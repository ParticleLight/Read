@echo off
title ParticleBook v2.0.0 安装
echo ============================================
echo   ParticleBook v2.0.0 — C++ WebView2 版
echo ============================================
echo.
echo 此版本从 Electron 架构重写为 C++ 原生应用。
echo 安装包仅 ~10MB（不含 mutool 40MB）。
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\Programs\ParticleBook"
echo 安装目录: %INSTALL_DIR%
echo.

:: Check if old version exists
if exist "%INSTALL_DIR%\ParticleBook.exe" (
    echo [警告] 已存在旧版本，正在覆盖...
)

:: Copy files
echo [1/2] 复制文件...
xcopy /E /Y /Q "%~dp0*" "%INSTALL_DIR%\" >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 文件复制失败，请以管理员身份运行。
    pause
    exit /b 1
)

:: Create desktop shortcut
echo [2/2] 创建桌面快捷方式...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\ParticleBook.lnk'); $s.TargetPath = '%INSTALL_DIR%\ParticleBook.exe'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.IconLocation = '%INSTALL_DIR%\ParticleBook.exe,0'; $s.Description = 'ParticleBook - Z-Library 电子书阅读器'; $s.Save()"

echo.
echo ============================================
echo   安装完成！
echo   桌面已创建 ParticleBook 快捷方式。
echo.
echo   首次运行会自动创建数据库。
echo   旧版阅读数据位于:
echo     %%APPDATA%%\particle-book\data\reader.json
echo   新版会自动兼容。
echo ============================================
echo.
pause
