#include "FileHandlers.h"
#include "BridgeServer.h"
#include "WebViewHost.h"
#include "services/DatabaseService.h"
#include "services/LibraryService.h"
#include "services/ContentCache.h"
#include <fstream>
#include <vector>
#include <filesystem>
#include <shobjidl.h>
#include <commdlg.h>
#include <cstring>
#include <cstdio>
#include <ctime>
#include <mutex>

static std::string DetectFormat(const std::string& path)
{
    // Use string ops to avoid std::filesystem::path issues with CJK/parens in path
    size_t dot = path.rfind('.');
    size_t slash = path.rfind('\\');
    if (dot == std::string::npos) return "";
    if (slash != std::string::npos && dot < slash) return "";
    std::string ext = path.substr(dot);
    for (auto& c : ext) c = static_cast<char>(std::tolower(c));
    if (ext == ".epub")   return "epub";
    if (ext == ".pdf")    return "pdf";
    if (ext == ".mobi")   return "mobi";
    if (ext == ".txt")    return "txt";
    if (ext == ".fb2")    return "fb2";
    if (ext == ".cbz")    return "cbz";
    if (ext == ".cbr")    return "cbr";
    if (ext == ".html" || ext == ".htm") return "html";
    if (ext == ".md")     return "markdown";
    return "";
}

static std::string GetFileName(const std::string& path)
{
    size_t slash = path.rfind('\\');
    return (slash != std::string::npos) ? path.substr(slash + 1) : path;
}

static int64_t GetFileSizeSafe(const std::string& path)
{
    // Use Win32 API directly to avoid codepage issues with std::filesystem
    int len = MultiByteToWideChar(CP_UTF8, 0, path.c_str(), -1, nullptr, 0);
    if (len <= 0) return 0;
    std::wstring wpath(len, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, path.c_str(), -1, &wpath[0], len);

    WIN32_FILE_ATTRIBUTE_DATA attrs;
    if (!GetFileAttributesExW(wpath.c_str(), GetFileExInfoStandard, &attrs)) return 0;

    LARGE_INTEGER size;
    size.HighPart = attrs.nFileSizeHigh;
    size.LowPart = attrs.nFileSizeLow;
    return static_cast<int64_t>(size.QuadPart);
}

static json ExtractBasicMetadata(const std::string& path, const std::string&)
{
    json meta;
    std::string filename = GetFileName(path);
    size_t dot = filename.rfind('.');
    meta["title"] = (dot != std::string::npos) ? filename.substr(0, dot) : filename;
    return meta;
}

static std::string WideToUtf8(LPCWSTR w)
{
    int len = WideCharToMultiByte(CP_UTF8, 0, w, -1, nullptr, 0, nullptr, nullptr);
    std::string s(len, '\0');
    WideCharToMultiByte(CP_UTF8, 0, w, -1, &s[0], len, nullptr, nullptr);
    while (!s.empty() && s.back() == '\0') s.pop_back();
    return s;
}

static void DebugLog(const char* msg)
{
    OutputDebugStringA(msg);
    // Also write to a log file in the exe directory
    static std::mutex logMutex;
    std::lock_guard<std::mutex> lock(logMutex);
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(nullptr, exePath, MAX_PATH);
    auto logPath = std::filesystem::path(exePath).parent_path() / "debug.log";
    FILE* f = _wfopen(logPath.c_str(), L"a");
    if (f) {
        time_t now = time(nullptr);
        char timeBuf[32];
        strftime(timeBuf, sizeof(timeBuf), "%H:%M:%S", localtime(&now));
        fprintf(f, "[%s] %s\n", timeBuf, msg);
        fclose(f);
    }
}


void RegisterFileHandlers(BridgeServer* bridge, DatabaseService* db, ContentCache* cache)
{
    // ── dialog:openFile ───────────────────────────────────────
    bridge->RegisterMethod("dialog:openFile", [](const json&) -> json {
        wchar_t fileBuf[MAX_PATH * 10] = {};  // Large buffer for safety

        OPENFILENAMEW ofn = {};
        ofn.lStructSize = sizeof(ofn);
        ofn.lpstrFilter = L"E-Books\0*.epub;*.pdf;*.mobi;*.txt;*.fb2;*.cbz;*.cbr;*.html;*.md\0All Files\0*.*\0";
        ofn.lpstrFile = fileBuf;
        ofn.nMaxFile = sizeof(fileBuf) / sizeof(wchar_t);
        ofn.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_EXPLORER;
        ofn.lpstrTitle = L"Select E-Book File";

        if (!GetOpenFileNameW(&ofn)) return json(nullptr);

        return json(WideToUtf8(fileBuf));
    });

    // ── dialog:openDirectory ──────────────────────────────────
    bridge->RegisterMethod("dialog:openDirectory", [](const json&) -> json {
        IFileOpenDialog* pDlg = nullptr;
        if (FAILED(CoCreateInstance(CLSID_FileOpenDialog, nullptr, CLSCTX_ALL,
                                    IID_PPV_ARGS(&pDlg)))) {
            return json(nullptr);
        }
        DWORD flags;
        pDlg->GetOptions(&flags);
        pDlg->SetOptions(flags | FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM);

        if (FAILED(pDlg->Show(nullptr))) { pDlg->Release(); return json(nullptr); }

        IShellItem* pItem = nullptr;
        if (FAILED(pDlg->GetResult(&pItem))) { pDlg->Release(); return json(nullptr); }
        pDlg->Release();

        std::string result;
        LPWSTR pszPath = nullptr;
        if (SUCCEEDED(pItem->GetDisplayName(SIGDN_FILESYSPATH, &pszPath))) {
            result = WideToUtf8(pszPath);
            CoTaskMemFree(pszPath);
        }
        pItem->Release();
        return result.empty() ? json(nullptr) : json(result);
    });

    // ── file:read ─ Return file content as byte array (cached) ───
    bridge->RegisterMethod("file:read", [cache](const json& p) -> json {
        std::string path = p["path"].get<std::string>();

        // Check cache first
        if (cache) {
            auto* cached = cache->Get(path);
            if (cached) return json(*cached);
        }

        // Convert UTF-8 path to wide for Windows API
        int wlen = MultiByteToWideChar(CP_UTF8, 0, path.c_str(), -1, nullptr, 0);
        if (wlen <= 0) return json(nullptr);
        std::wstring wpath(wlen, L'\0');
        MultiByteToWideChar(CP_UTF8, 0, path.c_str(), -1, &wpath[0], wlen);

        HANDLE hFile = CreateFileW(wpath.c_str(), GENERIC_READ, FILE_SHARE_READ,
                                   nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (hFile == INVALID_HANDLE_VALUE) return json(nullptr);

        // Get file time for cache validation
        FILETIME ftWrite;
        GetFileTime(hFile, nullptr, nullptr, &ftWrite);
        int64_t fileTime = (static_cast<int64_t>(ftWrite.dwHighDateTime) << 32)
                         | ftWrite.dwLowDateTime;

        LARGE_INTEGER liSize;
        GetFileSizeEx(hFile, &liSize);
        size_t size = static_cast<size_t>(liSize.QuadPart);

        std::vector<uint8_t> data(size);
        DWORD bytesRead = 0;
        ReadFile(hFile, data.data(), static_cast<DWORD>(size), &bytesRead, nullptr);
        CloseHandle(hFile);

        data.resize(bytesRead);
        if (cache) cache->Put(path, data, fileTime);
        return json(data);
    });

    // ── book:import ────────────────────────────────────────────
    bridge->RegisterMethod("book:import", [db, bridge](const json& p) -> json {
        json result = json::array();
        auto paths = p["paths"];

        char debugBuf[1024];
        snprintf(debugBuf, sizeof(debugBuf),
            "book:import called, paths is_array=%d, size=%zu",
            paths.is_array() ? 1 : 0, paths.is_array() ? paths.size() : 0);
        DebugLog(debugBuf);

        if (!paths.is_array()) return result;

        for (const auto& pathJson : paths) {
            try {
                std::string path = pathJson.get<std::string>();

                snprintf(debugBuf, sizeof(debugBuf), "book:import processing: %s", path.c_str());
                DebugLog(debugBuf);

                // Check for existing
                json existing = db->GetBookByPath(path);
                if (!existing.is_null()) {
                    DebugLog("book:import: already exists");
                    result.push_back(existing);
                    continue;
                }

                std::string format = DetectFormat(path);
                snprintf(debugBuf, sizeof(debugBuf), "book:import: format=%s", format.c_str());
                DebugLog(debugBuf);
                if (format.empty()) { DebugLog("book:import: unknown format, skip"); continue; }

                int64_t fileSize = GetFileSizeSafe(path);
                snprintf(debugBuf, sizeof(debugBuf), "book:import: fileSize=%lld", (long long)fileSize);
                DebugLog(debugBuf);
                if (fileSize <= 0) { DebugLog("book:import: file_size failed"); continue; }

                // Extract rich metadata (may crash on corrupt files)
                DebugLog("book:import: extracting metadata");
                LibraryService lib;
                ExtractedMetadata em;
                if (format == "epub") {
                    DebugLog("book:import: calling ExtractEpubMetadata");
                    lib.ExtractEpubMetadata(path, em);
                    snprintf(debugBuf, sizeof(debugBuf),
                        "book:import: epub metadata done, title=%s coverFile=%s",
                        em.title.c_str(), em.coverFile.c_str());
                    DebugLog(debugBuf);
                    if (!em.coverFile.empty()) {
                        DebugLog("book:import: extracting cover");
                        auto coverPath = lib.ExtractEpubCover(path, em.coverFile);
                        if (!coverPath.empty()) em.coverPath = coverPath;
                        DebugLog("book:import: cover done");
                    } else {
                        DebugLog("book:import: NO COVER FOUND in OPF");
                    }
                } else if (format == "pdf") {
                    lib.ExtractPdfMetadata(path, em);
                    DebugLog("book:import: rendering PDF cover");
                    em.coverPath = lib.ExtractPdfCover(path);
                    DebugLog("book:import: PDF cover done");
                } else if (format == "fb2") {
                    lib.ExtractFb2Metadata(path, em);
                }
                DebugLog("book:import: metadata extraction complete");

                std::string title = em.title.empty() ? GetFileName(path) : em.title;
                json book;
                book["title"] = title;
                book["author"] = em.author.empty() ? nullptr : json(em.author);
                book["format"] = format;
                book["file_path"] = path;
                book["file_size"] = fileSize;
                book["description"] = em.description.empty() ? nullptr : json(em.description);
                book["publisher"] = em.publisher.empty() ? nullptr : json(em.publisher);
                book["cover_path"] = em.coverPath.empty() ? nullptr : json(em.coverPath);
                book["language"] = em.language.empty() ? nullptr : json(em.language);
                book["isbn"] = em.isbn.empty() ? nullptr : json(em.isbn);

                auto inserted = db->InsertBook(book);
                snprintf(debugBuf, sizeof(debugBuf), "book:import: inserted id=%d", inserted.value("id", -1));
                DebugLog(debugBuf);
                result.push_back(inserted);
            } catch (const std::exception& e) {
                snprintf(debugBuf, sizeof(debugBuf), "book:import: exception: %s", e.what());
                DebugLog(debugBuf);
            } catch (...) {
                DebugLog("book:import: unknown crash, skipping file");
            }
        }
        snprintf(debugBuf, sizeof(debugBuf), "book:import: returning %zu books", result.size());
        DebugLog(debugBuf);
        db->FlushSync();
        return result;
    });

    // ── book:metadata ──────────────────────────────────────────
    bridge->RegisterMethod("book:metadata", [](const json& p) -> json {
        std::string path = p["path"].get<std::string>();
        std::string format = DetectFormat(path);
        if (format.empty()) return json::object();

        LibraryService lib;
        ExtractedMetadata em;
        if (format == "epub")   lib.ExtractEpubMetadata(path, em);
        else if (format == "pdf")   lib.ExtractPdfMetadata(path, em);
        else if (format == "fb2")   lib.ExtractFb2Metadata(path, em);

        json result;
        result["title"] = em.title.empty() ? GetFileName(path) : em.title;
        result["author"] = em.author;
        result["language"] = em.language;
        result["format"] = format;
        return result;
    });

    // ── book:cover ─────────────────────────────────────────────
    bridge->RegisterMethod("book:cover", [db](const json& p) -> json {
        int id = p["id"].get<int>();
        auto book = db->GetBook(id);
        if (book.is_null()) return json(nullptr);

        std::string coverPath = book.value("cover_path", "");
        if (!coverPath.empty()) {
            // Check existence via Win32 API
            int wlen = MultiByteToWideChar(CP_UTF8, 0, coverPath.c_str(), -1, nullptr, 0);
            if (wlen <= 0) return json(nullptr);
            std::wstring wpath(wlen, L'\0');
            MultiByteToWideChar(CP_UTF8, 0, coverPath.c_str(), -1, &wpath[0], wlen);

            HANDLE hFile = CreateFileW(wpath.c_str(), GENERIC_READ, FILE_SHARE_READ,
                                       nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
            if (hFile == INVALID_HANDLE_VALUE) return json(nullptr);

            LARGE_INTEGER liSize;
            GetFileSizeEx(hFile, &liSize);
            size_t size = static_cast<size_t>(liSize.QuadPart);
            std::vector<unsigned char> data(size);
            DWORD bytesRead = 0;
            ReadFile(hFile, data.data(), static_cast<DWORD>(size), &bytesRead, nullptr);
            CloseHandle(hFile);
            data.resize(bytesRead);

            static const char* b64 =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            std::string ext;
            size_t dot = coverPath.rfind('.');
            if (dot != std::string::npos) {
                ext = coverPath.substr(dot);
                for (auto& c : ext) c = static_cast<char>(std::tolower(c));
            }
            std::string prefix = "data:image/" +
                std::string(ext == ".png" ? "png" : "jpeg") + ";base64,";
            std::string b64data;
            int val = 0, valb = -6;
            for (unsigned char c : data) {
                val = (val << 8) + c;
                valb += 8;
                while (valb >= 0) { b64data.push_back(b64[(val >> valb) & 0x3F]); valb -= 6; }
            }
            if (valb > -6) b64data.push_back(b64[((val << 8) >> (valb + 8)) & 0x3F]);
            while (b64data.size() % 4) b64data.push_back('=');
            return json(prefix + b64data);
        }
        return json(nullptr);
    });

    // ── Stubs for not-yet-implemented ──────────────────────────
    bridge->RegisterMethod("app:checkUpdate",    [](const json&) -> json { return json(nullptr); });
    bridge->RegisterMethod("app:getVersion",     [](const json&) -> json { return json("1.9.0"); });
    bridge->RegisterMethod("app:downloadUpdate", [](const json&) -> json { return json(nullptr); });
    bridge->RegisterMethod("app:quitAndInstall", [](const json&) -> json {
        PostQuitMessage(0); return json(nullptr);
    });

    bridge->RegisterMethod("bookSource:importFile",     [](const json&) -> json { return json(nullptr); });
}
