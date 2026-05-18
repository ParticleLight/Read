; ParticleBook v2.0.0 NSIS Installer
; One-click update from old Electron version via electron-updater
; Supports: normal install (manual) and /S silent install (electron-updater)

Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 64

!define PRODUCT_NAME "ParticleBook"
!define PRODUCT_VERSION "2.0.0"
!define PRODUCT_PUBLISHER "ParticleLight"
!define INSTALL_DIR "$LOCALAPPDATA\Programs\ParticleBook"

Name "${PRODUCT_NAME} v${PRODUCT_VERSION}"
OutFile "..\build2\ParticleBook-Setup-v2.0.0.exe"
Icon "..\assets\app.ico"
InstallDir "${INSTALL_DIR}"
BrandingText " "

; Modern UI 2
!include "MUI2.nsh"
!define MUI_ICON "..\assets\app.ico"
!define MUI_UNICON "..\assets\app.ico"

; Pages (hidden in silent mode)
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; Hide pages in silent mode
Function .onInit
    IfSilent 0 +2
    SetAutoClose true
FunctionEnd

Section "Install"
    SetOutPath "$INSTDIR"

    ; Core application
    File "..\build2\Release\ParticleBook.exe"
    File "..\build2\Release\mutool.exe"
    File "..\build2\Release\WebView2Loader.dll"

    ; Renderer
    SetOutPath "$INSTDIR\renderer"
    File "..\build2\Release\renderer\index.html"
    File /nonfatal "..\build2\Release\renderer\pdf.worker.min.mjs"

    SetOutPath "$INSTDIR\renderer\assets"
    File "..\build2\Release\renderer\assets\*.js"
    File "..\build2\Release\renderer\assets\*.css"

    SetOutPath "$INSTDIR"

    ; Desktop shortcut
    CreateShortCut "$DESKTOP\ParticleBook.lnk" "$INSTDIR\ParticleBook.exe" "" "$INSTDIR\ParticleBook.exe" 0

    ; Start Menu
    CreateDirectory "$SMPROGRAMS\ParticleBook"
    CreateShortCut "$SMPROGRAMS\ParticleBook\ParticleBook.lnk" "$INSTDIR\ParticleBook.exe" "" "$INSTDIR\ParticleBook.exe" 0

    ; Uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook" "DisplayName" "${PRODUCT_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook" "Publisher" "${PRODUCT_PUBLISHER}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook" "DisplayIcon" "$INSTDIR\ParticleBook.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\ParticleBook.exe"
    Delete "$INSTDIR\mutool.exe"
    Delete "$INSTDIR\WebView2Loader.dll"
    Delete "$INSTDIR\renderer\index.html"
    Delete "$INSTDIR\renderer\pdf.worker.min.mjs"
    Delete "$INSTDIR\renderer\assets\*.js"
    Delete "$INSTDIR\renderer\assets\*.css"
    RMDir "$INSTDIR\renderer\assets"
    RMDir "$INSTDIR\renderer"
    Delete "$INSTDIR\uninstall.exe"
    RMDir "$INSTDIR"

    Delete "$DESKTOP\ParticleBook.lnk"
    Delete "$SMPROGRAMS\ParticleBook\ParticleBook.lnk"
    RMDir "$SMPROGRAMS\ParticleBook"

    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ParticleBook"
SectionEnd
