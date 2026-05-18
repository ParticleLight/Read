[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=ParticleBook v2.0.0 安装完成！
TargetName=ParticleBook-Setup-v2.0.0.exe
FriendlyName=ParticleBook v2.0.0
AppLaunched=none
PostInstallCmd=cmd.exe /c mklink "%USERPROFILE%\Desktop\ParticleBook.lnk" "%InstallPath%\ParticleBook.exe"
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles
[SourceFiles]
SourceFiles0=BUILD_DIR\ParticleBook
[SourceFiles0]
ParticleBook.exe=
mutool.exe=
WebView2Loader.dll=
