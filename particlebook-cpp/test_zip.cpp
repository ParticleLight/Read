#include "utils/ZipReader.h"
#include <cstdio>
#include <windows.h>

int main() {
    std::string data;
    const char* epub = "C:/Users/Particle Light/Desktop/我的治愈系游戏 (我会修空调) (z-library.sk, 1lib.sk, z-lib.sk).epub";

    if (ReadZipEntry(epub, "META-INF/container.xml", data)) {
        printf("container.xml (%zu bytes):\n%s\n", data.size(), data.c_str());
    } else {
        printf("FAILED to read container.xml\n");
    }

    data.clear();
    if (ReadZipEntry(epub, "OEBPS/content.opf", data)) {
        printf("OPF (%zu bytes):\n%.500s...\n", data.size(), data.c_str());
    } else {
        printf("FAILED to read OPF\n");
    }
    return 0;
}
