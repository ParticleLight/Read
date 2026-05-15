#pragma once
#include <string>
#include <vector>
#include "nlohmann/json.hpp"

using json = nlohmann::json;

struct ExtractedMetadata {
    std::string title;
    std::string author;
    std::string language;
    std::string description;
    std::string publisher;
    std::string isbn;
    std::string coverFile;   // path inside EPUB zip
    std::string coverPath;   // external file path for cover
};

class LibraryService {
public:
    bool ExtractEpubMetadata(const std::string& filePath, ExtractedMetadata& meta);
    bool ExtractPdfMetadata(const std::string& filePath, ExtractedMetadata& meta);
    bool ExtractFb2Metadata(const std::string& filePath, ExtractedMetadata& meta);

    // Extract cover image from EPUB to external file, returns path
    std::string ExtractEpubCover(const std::string& filePath, const std::string& coverFile);

    // Render first page of PDF as cover image, returns path
    std::string ExtractPdfCover(const std::string& filePath);

private:
    std::string FindOpfPath(const std::string& epubPath);
    bool ParseOpfXml(const std::string& xml, const std::string& opfDir, ExtractedMetadata& meta);
};

std::string DetectFormat(const std::string& path);
