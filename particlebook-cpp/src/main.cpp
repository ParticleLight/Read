#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include "App.h"

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE, LPWSTR, int nCmdShow)
{
    // Enable per-monitor DPI awareness for crisp rendering
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);

    try {
        App::Instance().Init(hInstance);
        App::Instance().Run();
        App::Instance().Shutdown();
        return 0;
    } catch (const std::exception& e) {
        MessageBoxA(nullptr, e.what(), "ParticleBook Fatal Error", MB_OK | MB_ICONERROR);
        return 1;
    }
}
