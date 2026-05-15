#pragma once
// Minimal ZIP reader for EPUB metadata extraction. Handles uncompressed
// (store) and deflate-compressed entries. No encryption, no ZIP64.
#include <string>
#include <vector>
#include <cstdint>

bool ReadZipEntry(const std::string& zipPath, const std::string& entryName, std::string& output);
