// Minimal ZIP reader — handles stored (uncompressed) and deflate entries.
// Uses miniz for deflate decompression.
#include "ZipReader.h"
#include <windows.h>
#include <cstring>
#include <algorithm>

#define MINIZ_NO_TIME
#define MINIZ_NO_ARCHIVE_APIS
#define MINIZ_NO_ARCHIVE_WRITING_APIS
#include "miniz.h"
#pragma pack(push, 1)
struct ZipLocalHeader {
    uint32_t signature;      // 0x04034b50
    uint16_t version;
    uint16_t flags;
    uint16_t compression;
    uint16_t modTime;
    uint16_t modDate;
    uint32_t crc32;
    uint32_t compSize;
    uint32_t uncompSize;
    uint16_t nameLen;
    uint16_t extraLen;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct ZipCentralDirEntry {
    uint32_t signature;      // 0x02014b50
    uint16_t versionMadeBy;
    uint16_t versionNeeded;
    uint16_t flags;
    uint16_t compression;
    uint16_t modTime;
    uint16_t modDate;
    uint32_t crc32;
    uint32_t compSize;
    uint32_t uncompSize;
    uint16_t nameLen;
    uint16_t extraLen;
    uint16_t commentLen;
    uint16_t diskStart;
    uint16_t internalAttr;
    uint32_t externalAttr;
    uint32_t localHeaderOffset;
};

struct ZipEOCD {
    uint32_t signature;      // 0x06054b50
    uint16_t diskNum;
    uint16_t diskStart;
    uint16_t entriesOnDisk;
    uint16_t totalEntries;
    uint32_t centralDirSize;
    uint32_t centralDirOffset;
    uint16_t commentLen;
};
#pragma pack(pop)

bool ReadZipEntry(const std::string& zipPath, const std::string& entryName, std::string& output)
{
    // Open file with wide path support
    int wlen = MultiByteToWideChar(CP_UTF8, 0, zipPath.c_str(), -1, nullptr, 0);
    if (wlen <= 0) return false;
    std::wstring wPath(wlen, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, zipPath.c_str(), -1, &wPath[0], wlen);

    HANDLE hFile = CreateFileW(wPath.c_str(), GENERIC_READ, FILE_SHARE_READ,
                               nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (hFile == INVALID_HANDLE_VALUE) return false;

    // Get file size
    LARGE_INTEGER liSize;
    GetFileSizeEx(hFile, &liSize);
    size_t fileSize = static_cast<size_t>(liSize.QuadPart);
    if (fileSize < sizeof(ZipEOCD)) { CloseHandle(hFile); return false; }

    // Find EOCD (scan from end, max 65535 + sizeof(EOCD) bytes back)
    size_t searchStart = (fileSize > 65535 + sizeof(ZipEOCD)) ? fileSize - 65535 - sizeof(ZipEOCD) : 0;
    size_t searchLen = fileSize - searchStart;
    std::vector<uint8_t> buf(searchLen);
    {
        LARGE_INTEGER li;
        li.QuadPart = static_cast<LONGLONG>(searchStart);
        SetFilePointerEx(hFile, li, nullptr, FILE_BEGIN);
        DWORD bytesRead = 0;
        ReadFile(hFile, buf.data(), static_cast<DWORD>(searchLen), &bytesRead, nullptr);
    }

    // Scan for EOCD signature
    ZipEOCD* eocd = nullptr;
    for (size_t i = 0; i + sizeof(ZipEOCD) <= buf.size(); i++) {
        auto* p = reinterpret_cast<ZipEOCD*>(buf.data() + i);
        if (p->signature == 0x06054b50) { eocd = p; break; }
    }
    if (!eocd) { CloseHandle(hFile); return false; }

    // Read central directory
    std::vector<uint8_t> cdBuf(eocd->centralDirSize);
    {
        LARGE_INTEGER li;
        li.QuadPart = eocd->centralDirOffset;
        SetFilePointerEx(hFile, li, nullptr, FILE_BEGIN);
        DWORD bytesRead = 0;
        ReadFile(hFile, cdBuf.data(), eocd->centralDirSize, &bytesRead, nullptr);
    }

    // Find entry in central directory
    const ZipCentralDirEntry* foundEntry = nullptr;
    size_t pos = 0;
    for (uint16_t i = 0; i < eocd->totalEntries && pos < cdBuf.size(); i++) {
        auto* entry = reinterpret_cast<const ZipCentralDirEntry*>(cdBuf.data() + pos);
        if (entry->signature != 0x02014b50) break;

        std::string name(reinterpret_cast<const char*>(cdBuf.data() + pos + sizeof(ZipCentralDirEntry)),
                         entry->nameLen);

        if (name == entryName) {
            foundEntry = entry;
            break;
        }
        pos += sizeof(ZipCentralDirEntry) + entry->nameLen + entry->extraLen + entry->commentLen;
    }

    if (!foundEntry) { CloseHandle(hFile); return false; }

    // Validate local header offset
    if (foundEntry->localHeaderOffset + sizeof(ZipLocalHeader) > fileSize) {
        CloseHandle(hFile); return false;
    }

    // Read local file header first to get actual field values
    ZipLocalHeader lh = {};
    {
        LARGE_INTEGER li;
        li.QuadPart = foundEntry->localHeaderOffset;
        SetFilePointerEx(hFile, li, nullptr, FILE_BEGIN);
        DWORD bytesRead = 0;
        ReadFile(hFile, &lh, sizeof(lh), &bytesRead, nullptr);
        if (bytesRead < sizeof(lh) || lh.signature != 0x04034b50) {
            CloseHandle(hFile); return false;
        }
    }

    // Use central directory sizes (more reliable), but validate against file
    uint32_t compSize = foundEntry->compSize;
    size_t dataOffset = foundEntry->localHeaderOffset + sizeof(ZipLocalHeader) + lh.nameLen + lh.extraLen;
    if (dataOffset + compSize > fileSize) {
        // Clamp to available file data
        compSize = (fileSize > dataOffset) ? static_cast<uint32_t>(fileSize - dataOffset) : 0;
    }
    if (compSize == 0 && foundEntry->uncompSize > 0) {
        CloseHandle(hFile); return false;
    }

    // Read compressed data
    std::vector<uint8_t> compBuf(compSize);
    if (compSize > 0) {
        LARGE_INTEGER li;
        li.QuadPart = static_cast<LONGLONG>(dataOffset);
        SetFilePointerEx(hFile, li, nullptr, FILE_BEGIN);
        DWORD bytesRead = 0;
        ReadFile(hFile, compBuf.data(), compSize, &bytesRead, nullptr);
        compBuf.resize(bytesRead);
    }
    CloseHandle(hFile);

    if (foundEntry->compression == 0) {
        // Stored (uncompressed)
        output.assign(reinterpret_cast<const char*>(compBuf.data()), compBuf.size());
        return true;
    } else if (foundEntry->compression == 8) {
        // DEFLATE (raw) — decompress with miniz tinfl
        // NOTE: ZIP uses raw deflate (RFC 1951), NOT zlib-wrapped (RFC 1950).
        // tinfl_decompress handles raw deflate; mz_uncompress expects zlib header.
        size_t destLen = foundEntry->uncompSize;
        std::vector<uint8_t> destBuf(destLen);
        size_t srcLen = compBuf.size();
        size_t written = tinfl_decompress_mem_to_mem(
            destBuf.data(), destLen,
            compBuf.data(), srcLen,
            0);
        if (written == TINFL_DECOMPRESS_MEM_TO_MEM_FAILED) {
            return false;
        }
        output.assign(reinterpret_cast<const char*>(destBuf.data()), written);
        return true;
    }

    return false;
}
