#include "ZLibraryService.h"
#include "BridgeServer.h"
#include "WebViewHost.h"
#include "services/DatabaseService.h"
#include "App.h"
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <winhttp.h>
#include <shlobj.h>
#include <regex>
#include <algorithm>
#include <filesystem>
#include <thread>
#include <chrono>
#include <fstream>
#include <sstream>

#pragma comment(lib, "winhttp.lib")
#include <wrl/event.h>
#include <utility>
using namespace Microsoft::WRL;

#define WM_ZLIB_DOWNLOAD_DONE (WM_USER + 10)

static std::wstring ToWide(const std::string& s) {
    if (s.empty()) return L"";
    int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, nullptr, 0);
    std::wstring w(len, L'\0'); MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, &w[0], len); return w;
}
static std::string ToNarrow(LPCWSTR w) {
    if (!w) return "";
    int len = WideCharToMultiByte(CP_UTF8, 0, w, -1, nullptr, 0, nullptr, nullptr);
    if (len <= 0) return ""; std::string s(len, '\0');
    WideCharToMultiByte(CP_UTF8, 0, w, -1, &s[0], len, nullptr, nullptr);
    while (!s.empty() && s.back() == '\0') s.pop_back(); return s;
}

static const std::vector<std::string> FALLBACK_MIRRORS = {
    "https://zh.101fbiwarning.ru/","https://zh.zzz101.ru/","https://zh.1lib.sk/",
    "https://zh.z-library.sk/","https://zh.singlelogin.re/","https://zh.singlelogin.rs/",
};

static std::string FetchUrl(const std::string& url) {
    size_t se = url.find("://"); if (se == std::string::npos) return "";
    bool https = (url.substr(0, se) == "https"); size_t hs = se + 3;
    size_t ps = url.find('/', hs);
    std::string host, path;
    ps != std::string::npos
        ? (host = url.substr(hs, ps - hs), path = url.substr(ps))
        : (host = url.substr(hs), path = "/");
    auto toW = [](const std::string& s) { return ToWide(s); };
    HINTERNET hS = WinHttpOpen(L"PB/1.9", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, nullptr, nullptr, 0);
    if (!hS) return "";
    HINTERNET hC = WinHttpConnect(hS, toW(host).c_str(), https ? 443 : 80, 0);
    if (!hC) { WinHttpCloseHandle(hS); return ""; }
    HINTERNET hR = WinHttpOpenRequest(hC, L"GET", toW(path).c_str(), nullptr, nullptr, nullptr, https ? WINHTTP_FLAG_SECURE : 0);
    if (!hR) { WinHttpCloseHandle(hC); WinHttpCloseHandle(hS); return ""; }
    if (!WinHttpSendRequest(hR, nullptr, 0, nullptr, 0, 0, 0) || !WinHttpReceiveResponse(hR, nullptr))
    { WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS); return ""; }
    std::string r; DWORD br; char b[8192];
    while (WinHttpReadData(hR, b, sizeof(b), &br) && br > 0) r.append(b, br);
    WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS); return r;
}

ZLibraryService::ZLibraryService(BridgeServer* bridge) : m_bridge(bridge), m_mirrors(FALLBACK_MIRRORS) { FetchMirrors(); }
ZLibraryService::~ZLibraryService() {}

json ZLibraryService::FetchMirrors() {
    std::string html = FetchUrl("https://z.wwwnav.com/");
    if (html.empty()) { json r; r["mirrors"] = m_mirrors; r["current"] = m_currentMirror; return r; }
    std::vector<std::string> found;
    std::regex linkRe("href=\"(https?://[^\"]+)\"", std::regex::icase);
    for (auto it = std::sregex_iterator(html.begin(), html.end(), linkRe); it != std::sregex_iterator(); ++it) {
        std::string u = (*it)[1];
        if (u.find("z-lib") != std::string::npos || u.find("1lib") != std::string::npos || u.find("zzz") != std::string::npos || u.find("singlelogin") != std::string::npos || u.find("fbiwarning") != std::string::npos || u.find("zlibrary") != std::string::npos || u.find("bookfi") != std::string::npos) {
            if (u.back() != '/') u += '/';
            if (std::find(found.begin(), found.end(), u) == found.end()) found.push_back(u);
        }
    }
    if (!found.empty()) { m_mirrors = found; m_currentMirror = 0; }
    json r; r["mirrors"] = m_mirrors; r["current"] = m_currentMirror; return r;
}

json ZLibraryService::GetMirrorInfo() {
    json r; r["index"] = m_currentMirror;
    r["url"] = m_currentMirror < (int)m_mirrors.size() ? m_mirrors[m_currentMirror] : "";
    r["mirrors"] = m_mirrors; return r;
}

json ZLibraryService::SwitchMirror(int index) {
    if (index >= 0 && index < (int)m_mirrors.size()) m_currentMirror = index;
    if (m_host && m_host->GetWebView())
        m_host->GetWebView()->Navigate(ToWide(m_mirrors[m_currentMirror]).c_str());
    m_bridge->EmitEvent("zlib:mirrorChanged", GetMirrorInfo());
    return GetMirrorInfo();
}

// ── Navigate main WebView2 + inject floating toolbar ───────────────────────

json ZLibraryService::Show() {
    m_zlibActive = true;
    SetupDownloadHandler();

    auto* wv = m_host ? m_host->GetWebView() : nullptr;
    if (!wv) {
        ShellExecuteW(nullptr, L"open", ToWide(m_mirrors[m_currentMirror]).c_str(),
                      nullptr, nullptr, SW_SHOWNORMAL);
        return json(nullptr);
    }
    wv->Navigate(ToWide(m_mirrors[m_currentMirror]).c_str());
    m_bridge->EmitEvent("zlib:mirrorChanged", GetMirrorInfo());
    return json(nullptr);
}

json ZLibraryService::Hide() {
    m_zlibActive = false;
    if (m_host) m_host->ReloadPage();
    return json(nullptr);
}

json ZLibraryService::Navigate(const std::string& a) {
    auto* wv = m_host ? m_host->GetWebView() : nullptr;
    if (!wv) return json(nullptr);
    if (a == "back")      { BOOL c = FALSE; wv->get_CanGoBack(&c); if (c) wv->GoBack(); }
    else if (a == "forward") { BOOL c = FALSE; wv->get_CanGoForward(&c); if (c) wv->GoForward(); }
    else if (a == "reload")   wv->Reload();
    return json(nullptr);
}

json ZLibraryService::GetURL() {
    if (m_host && m_host->GetWebView()) {
        LPWSTR u = nullptr; m_host->GetWebView()->get_Source(&u);
        if (u) { m_currentUrl = ToNarrow(u); CoTaskMemFree(u); }
    }
    return json(m_currentUrl);
}

json ZLibraryService::SetBounds(int, int, int, int) { return json(nullptr); }
json ZLibraryService::Logout() {
    m_zlibActive = false;
    if (m_host && m_host->GetWebView())
        m_host->GetWebView()->Navigate(ToWide(m_mirrors[m_currentMirror]).c_str());
    return json(nullptr);
}

std::string ZLibraryService::GetDownloadPath() const
{
    wchar_t profile[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_PROFILE, nullptr, 0, profile))) {
        char buf[MAX_PATH * 3];
        WideCharToMultiByte(CP_UTF8, 0, profile, -1, buf, sizeof(buf), nullptr, nullptr);
        std::string path = std::string(buf) + "/Downloads/ParticleBook";
        std::error_code ec;
        std::filesystem::create_directories(path, ec);
        return path;
    }
    return App::Instance().UserDataPath() + "/downloads";
}

void ZLibraryService::SetupDownloadHandler()
{
    if (m_downloadRegistered || !m_host || !m_host->GetWebView()) return;
    m_downloadRegistered = true;
    m_hwnd = m_host->GetHwnd();

    m_host->SetDownloadCallback([this](const std::string& path, const std::string& fileName) {
        OnDownloadDone(path, fileName);
    });

    auto* wv = m_host->GetWebView();

    // ── NewWindowRequested — intercept window.open() downloads, start WinHTTP ──
    ComPtr<ICoreWebView2_2> wv2;
    if (SUCCEEDED(wv->QueryInterface(IID_PPV_ARGS(&wv2)))) {
        wv2->add_NewWindowRequested(
            Callback<ICoreWebView2NewWindowRequestedEventHandler>(
                [this](ICoreWebView2*, ICoreWebView2NewWindowRequestedEventArgs* args) -> HRESULT {
                    if (!m_zlibActive) return S_OK;
                    LPWSTR uriRaw = nullptr;
                    if (FAILED(args->get_Uri(&uriRaw)) || !uriRaw) return S_OK;
                    std::string url = ToNarrow(uriRaw);
                    CoTaskMemFree(uriRaw);
                    MessageBoxW(nullptr, L"NewWindowRequested!", L"ZLib NW", MB_OK);
                    args->put_Handled(TRUE);  // cancel popup, stay on Z-Library page

                    // Start WinHTTP download directly (don't navigate main window)
                    StartDownloadThread(url);
                    return S_OK;
                }).Get(), nullptr);
    }

    // ── DownloadStarting — intercept direct downloads (kept as fallback) ──
    ComPtr<ICoreWebView2_4> wv4;
    if (FAILED(wv->QueryInterface(IID_PPV_ARGS(&wv4)))) return;

    wv4->add_DownloadStarting(
        Callback<ICoreWebView2DownloadStartingEventHandler>(
            [this](ICoreWebView2*, ICoreWebView2DownloadStartingEventArgs* args) -> HRESULT {
                if (!m_zlibActive) return S_OK;

                ComPtr<ICoreWebView2DownloadOperation> op;
                if (FAILED(args->get_DownloadOperation(&op))) return S_OK;
                LPWSTR uriRaw = nullptr;
                if (FAILED(op->get_Uri(&uriRaw)) || !uriRaw) return S_OK;
                std::string url = ToNarrow(uriRaw);
                CoTaskMemFree(uriRaw);

                MessageBoxW(nullptr, L"DownloadStarting!", L"ZLib DS", MB_OK);
                args->put_Handled(TRUE);
                StartDownloadThread(url);
                return S_OK;
            }).Get(), &m_downloadToken);
}

void ZLibraryService::StartDownloadThread(const std::string& url)
{
    MessageBoxW(nullptr, ToWide(url).c_str(), L"StartDownload", MB_OK);

    // Extract filename from ?filename= query param
    std::string fileName = "download";
    size_t fnp = url.find("filename=");
    if (fnp != std::string::npos) {
        std::string fn = url.substr(fnp + 9);
        size_t amp = fn.find('&');
        if (amp != std::string::npos) fn = fn.substr(0, amp);
        std::string decoded;
        for (size_t i = 0; i < fn.size(); ++i) {
            if (fn[i] == '%' && i + 2 < fn.size()) {
                char hex[3] = {fn[i+1], fn[i+2], 0};
                decoded += (char)strtol(hex, nullptr, 16);
                i += 2;
            } else if (fn[i] == '+') {
                decoded += ' ';
            } else {
                decoded += fn[i];
            }
        }
        if (!decoded.empty()) fileName = decoded;
    }

    std::string downloadPath = GetDownloadPath() + "/" + fileName;
    std::filesystem::create_directories(GetDownloadPath(), std::error_code{});

    // Show "downloading" in toolbar via ExecuteScript (bypasses event system)
    if (m_host && m_host->GetWebView()) {
        std::wstring fnW = ToWide(fileName);
        // Escape single quotes in filename
        size_t pos = 0;
        while ((pos = fnW.find(L'\'', pos)) != std::wstring::npos) {
            fnW.insert(pos, L"\\"); pos += 2;
        }
        std::wstring script = L"(function(){"
            L"var z=document.getElementById('zb-dl');if(z)z.style.display='flex';"
            L"var p=document.getElementById('zb-dl-pct');if(p)p.textContent='下载中';"
            L"var f=document.getElementById('zb-dl-fill');if(f)f.style.width='10%';"
            L"var n=document.getElementById('zb-ntf');if(n){n.textContent='下载中: " + fnW + L"';n.className='info';n.style.display='block';}"
            L"})()";
        m_host->GetWebView()->ExecuteScript(script.c_str(), nullptr);
    }

    HWND hwnd = m_hwnd;
    BridgeServer* bridge = m_bridge;
    std::thread([url, fileName, downloadPath, hwnd, bridge]() {
                    size_t se = url.find("://");
                    if (se == std::string::npos) return;
                    bool https = (url.substr(0, se) == "https");
                    size_t hs = se + 3;
                    size_t ps = url.find('/', hs);
                    std::string host, path;
                    if (ps != std::string::npos) { host = url.substr(hs, ps - hs); path = url.substr(ps); }
                    else { host = url.substr(hs); path = "/"; }

                    HINTERNET hS = WinHttpOpen(L"PB/1.9", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, nullptr, nullptr, 0);
                    if (!hS) return;
                    HINTERNET hC = WinHttpConnect(hS, ToWide(host).c_str(), https ? 443 : 0, 0);
                    if (!hC) { WinHttpCloseHandle(hS); return; }
                    HINTERNET hR = WinHttpOpenRequest(hC, L"GET", ToWide(path).c_str(), nullptr, nullptr, nullptr,
                        https ? WINHTTP_FLAG_SECURE : 0);
                    if (!hR) { WinHttpCloseHandle(hC); WinHttpCloseHandle(hS); return; }

                    if (!WinHttpSendRequest(hR, nullptr, 0, nullptr, 0, 0, 0) || !WinHttpReceiveResponse(hR, nullptr)) {
                        WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS);
                        if (hwnd) PostMessage(hwnd, WM_ZLIB_DOWNLOAD_DONE, 0, 0);
                        return;
                    }

                    DWORD contentLength = 0, dwSize = sizeof(contentLength);
                    WinHttpQueryHeaders(hR, WINHTTP_QUERY_CONTENT_LENGTH | WINHTTP_QUERY_FLAG_NUMBER,
                        nullptr, &contentLength, &dwSize, nullptr);

                    HANDLE hFile = CreateFileW(ToWide(downloadPath).c_str(), GENERIC_WRITE, 0, nullptr,
                        CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
                    if (hFile == INVALID_HANDLE_VALUE) {
                        WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS);
                        if (hwnd) PostMessage(hwnd, WM_ZLIB_DOWNLOAD_DONE, 0, 0);
                        return;
                    }

                    char buf[65536]; DWORD bytesRead; int64_t totalRead = 0;
                    while (WinHttpReadData(hR, buf, sizeof(buf), &bytesRead) && bytesRead > 0) {
                        DWORD written;
                        WriteFile(hFile, buf, bytesRead, &written, nullptr);
                        totalRead += bytesRead;
                    }
                    CloseHandle(hFile);
                    WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS);

                    if (totalRead > 0 && hwnd) {
                        wchar_t mb[256];
                        swprintf(mb, 256, L"DL OK: %lld bytes", (long long)totalRead);
                        MessageBoxW(nullptr, mb, L"Thread done", MB_OK);
                        auto* data = new std::pair<std::string, std::string>(downloadPath, fileName);
                        PostMessage(hwnd, WM_ZLIB_DOWNLOAD_DONE, 1, reinterpret_cast<LPARAM>(data));
                    } else if (hwnd) {
                        MessageBoxW(nullptr, L"DL failed: 0 bytes", L"Thread done", MB_OK);
                        PostMessage(hwnd, WM_ZLIB_DOWNLOAD_DONE, 0, 0);
                    } else {
                        MessageBoxW(nullptr, L"No hwnd!", L"Thread done", MB_OK);
                    }
                }).detach();
}

void ZLibraryService::OnDownloadDone(const std::string& downloadPath, const std::string& fileName)
{
    // Called on MAIN THREAD — safe to call EmitEvent and InvokeMethod
    json comp;
    comp["fileName"] = fileName;
    comp["path"] = downloadPath;
    m_bridge->EmitEvent("zlib:downloadComplete", comp);

    json params;
    params["paths"] = json::array({downloadPath});
    auto result = m_bridge->InvokeMethod("book:import", params);
    if (result.is_array() && result.size() > 0) {
        m_bridge->EmitEvent("zlib:importComplete", {{"fileName", fileName}});
        m_bridge->EmitEvent("menu:importBooks", json::object());
        if (m_host && m_host->GetWebView()) {
            std::wstring fnW = ToWide(fileName);
            size_t pos = 0;
            while ((pos = fnW.find(L'\'', pos)) != std::wstring::npos) { fnW.insert(pos, L"\\"); pos += 2; }
            std::wstring script = L"(function(){"
                L"var z=document.getElementById('zb-dl');if(z)z.style.display='none';"
                L"var n=document.getElementById('zb-ntf');if(n){n.textContent='已导入书架: " + fnW + L"';n.className='ok';n.style.display='block';setTimeout(function(){n.style.display='none'},4000);}"
                L"})()";
            m_host->GetWebView()->ExecuteScript(script.c_str(), nullptr);
        }
    } else {
        m_bridge->EmitEvent("zlib:importError",
            {{"fileName", fileName}, {"error", "Import failed"}});
        if (m_host && m_host->GetWebView()) {
            std::wstring fnW = ToWide(fileName);
            size_t pos = 0;
            while ((pos = fnW.find(L'\'', pos)) != std::wstring::npos) { fnW.insert(pos, L"\\"); pos += 2; }
            std::wstring script = L"(function(){"
                L"var z=document.getElementById('zb-dl');if(z)z.style.display='none';"
                L"var n=document.getElementById('zb-ntf');if(n){n.textContent='导入失败(可能已存在): " + fnW + L"';n.className='err';n.style.display='block';setTimeout(function(){n.style.display='none'},4000);}"
                L"})()";
            m_host->GetWebView()->ExecuteScript(script.c_str(), nullptr);
        }
    }
}

void RegisterZlibHandlers(BridgeServer* bridge, ZLibraryService* zlib) {
    bridge->RegisterMethod("zlib:getMirrorInfo", [zlib](const json&)    { return zlib->GetMirrorInfo(); });
    bridge->RegisterMethod("zlib:switchMirror",   [zlib](const json& p) { return zlib->SwitchMirror(p["index"].get<int>()); });
    bridge->RegisterMethod("zlib:fetchMirrors",   [zlib](const json&)   { return zlib->FetchMirrors(); });
    bridge->RegisterMethod("zlib:show",           [zlib](const json&)   { return zlib->Show(); });
    bridge->RegisterMethod("zlib:hide",           [zlib](const json&)   { return zlib->Hide(); });
    bridge->RegisterMethod("zlib:navigate",       [zlib](const json& p) { return zlib->Navigate(p.value("action","")); });
    bridge->RegisterMethod("zlib:getURL",         [zlib](const json&)   { return zlib->GetURL(); });
    bridge->RegisterMethod("zlib:setBounds",      [zlib](const json& p) {
        auto b = p["bounds"]; return zlib->SetBounds(b.value("x",0),b.value("y",0),b.value("width",0),b.value("height",0));
    });
    bridge->RegisterMethod("zlib:logout",         [zlib](const json&)   { return zlib->Logout(); });
    bridge->RegisterMethod("zlib:showMirrorMenu", [zlib](const json&) -> json {
        auto info = zlib->GetMirrorInfo(); int t = (int)info["mirrors"].size();
        return zlib->SwitchMirror((info["index"].get<int>()+1)%(t>0?t:1));
    });
}
