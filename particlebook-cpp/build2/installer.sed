[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=?????? ParticleBook v2.0.0?C++ WebView2 ???????? Electron ????????? 10MB???????????????? %%APPDATA%%\particle-book ???
DisplayLicense=
FinishMessage=ParticleBook v2.0.0 ????????????????
TargetName=f:\VScode\Read\particlebook-cpp\build2\ParticleBook-v2.0.0-clean\ParticleBook\..\ParticleBook-Setup-v2.0.0.exe
FriendlyName=ParticleBook v2.0.0
AppLaunched=none
PostInstallCmd=cmd.exe /c "powershell -NoP -EP Bypass -Command $ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\ParticleBook.lnk'); $s.TargetPath='%InstallPath%\ParticleBook.exe'; $s.WorkingDirectory='%InstallPath%'; $s.Save()"
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles
[SourceFiles]
SourceFiles0=f:\VScode\Read\particlebook-cpp\build2\ParticleBook-v2.0.0-clean\ParticleBook
[SourceFiles0]install.bat=
mutool.exe=
ParticleBook.exe=
WebView2Loader.dll=
renderer\index.html=
renderer\pdf.worker.min.mjs=
renderer\assets\BookSourcePanel-BonNDQhn.js=
renderer\assets\ChangelogPanel-DFHCiJnT.js=
renderer\assets\ComicRenderer-DBTO4q3k.js=
renderer\assets\EpubRenderer-B8rACOOK.js=
renderer\assets\GlobalSettings-BnPuSaCU.js=
renderer\assets\HtmlRenderer-eV2CphHr.js=
renderer\assets\index-D5YUh_2q.css=
renderer\assets\index-DYVh4C-w.js=
renderer\assets\jszip.min-DE8TlDjW.js=
renderer\assets\pdf-BJAF3mHZ.js=
renderer\assets\PdfRenderer-C74G3lyQ.js=
renderer\assets\SettingsPanel-BW0lo3Tl.js=
renderer\assets\StatisticsPage-BELK3syL.js=
renderer\assets\TextRenderer-BH6ZaJIP.js=
renderer\assets\ZLibraryView-CuSpGOOF.js=
renderer\assets\_commonjs-dynamic-modules-TGKdzP3c.js=
