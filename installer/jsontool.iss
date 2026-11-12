; jsontool installer script (Inno Setup 6)
; Author: 43086FG
; Build: ISCC.exe jsontool.iss

#define MyAppName "jsontool"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "43086FG"
#define MyAppExeName "jsontool.exe"
#define MyAppId "{{8F3C2B71-9A4D-4E6B-B2F1-3C7D5E9A1B64}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
VersionInfoVersion=1.0.1.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1sp1
WizardStyle=modern
WizardResizable=yes
ShowLanguageDialog=yes
OutputDir=.
OutputBaseFilename=jsontool-Setup-{#MyAppVersion}
SetupIconFile=..\src-tauri\icons\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Compression=lzma2/ultra64
SolidCompression=yes
CloseApplications=yes
RestartApplications=no
AllowNoIcons=yes

[Languages]
; The four bundled translations only override the wizard's core strings, so each
; is loaded on top of Default.isl. That keeps every Inno message defined (no
; untranslated fallback gaps) while the local file supplies the visible text.
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "zhcn"; MessagesFile: "compiler:Default.isl,languages\ChineseSimplified.isl"
Name: "zhtw"; MessagesFile: "compiler:Default.isl,languages\ChineseTraditional.isl"
Name: "ja"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "ko"; MessagesFile: "compiler:Default.isl,languages\Korean.isl"
Name: "ru"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "ar"; MessagesFile: "compiler:Default.isl,languages\Arabic.isl"
Name: "es"; MessagesFile: "compiler:Languages\Spanish.isl"

[CustomMessages]
en.TaskDesktopIcon=Create a desktop shortcut
en.TaskAssocJson=Associate .json files with jsontool (keeps the current default app)
en.InstallingWebView2=Installing Microsoft Edge WebView2 Runtime...
zhcn.TaskDesktopIcon=创建桌面快捷方式
zhcn.TaskAssocJson=将 .json 文件关联到 jsontool（不改变当前默认打开方式）
zhcn.InstallingWebView2=正在安装 Microsoft Edge WebView2 运行时...
zhtw.TaskDesktopIcon=建立桌面捷徑
zhtw.TaskAssocJson=將 .json 檔案關聯到 jsontool（不變更目前預設開啟方式）
zhtw.InstallingWebView2=正在安裝 Microsoft Edge WebView2 執行階段...
ja.TaskDesktopIcon=デスクトップにショートカットを作成
ja.TaskAssocJson=.json ファイルを jsontool に関連付ける（既定のアプリは変更しません）
ja.InstallingWebView2=Microsoft Edge WebView2 ランタイムをインストールしています...
ko.TaskDesktopIcon=바탕 화면에 바로 가기 만들기
ko.TaskAssocJson=.json 파일을 jsontool과 연결(기본 앱은 변경하지 않음)
ko.InstallingWebView2=Microsoft Edge WebView2 런타임 설치 중...
ru.TaskDesktopIcon=Создать ярлык на рабочем столе
ru.TaskAssocJson=Связать файлы .json с jsontool (приложение по умолчанию не меняется)
ru.InstallingWebView2=Установка среды выполнения Microsoft Edge WebView2...
ar.TaskDesktopIcon=إنشاء اختصار على سطح المكتب
ar.TaskAssocJson=ربط ملفات .json بـ jsontool (دون تغيير التطبيق الافتراضي)
ar.InstallingWebView2=جارٍ تثبيت وقت تشغيل Microsoft Edge WebView2...
es.TaskDesktopIcon=Crear un acceso directo en el escritorio
es.TaskAssocJson=Asociar archivos .json con jsontool (sin cambiar la aplicación predeterminada)
es.InstallingWebView2=Instalando Microsoft Edge WebView2 Runtime...
en.WebView2Missing=jsontool needs the Microsoft Edge WebView2 Runtime.%n%nWindows 10/11: run the bundled MicrosoftEdgeWebView2Setup.exe (or download it from https://developer.microsoft.com/microsoft-edge/webview2/).%n%nWindows 7 SP1: only WebView2 Runtime 109 is supported. Install the 109 offline runtime before starting jsontool.
zhcn.WebView2Missing=jsontool 需要 Microsoft Edge WebView2 运行时。%n%nWindows 10/11：请运行安装包附带的 MicrosoftEdgeWebView2Setup.exe（或从 https://developer.microsoft.com/microsoft-edge/webview2/ 下载）。%n%nWindows 7 SP1：仅支持 WebView2 运行时 109 版本，请先安装 109 离线运行时再启动 jsontool。
zhtw.WebView2Missing=jsontool 需要 Microsoft Edge WebView2 執行階段。%n%nWindows 10/11：請執行安裝包隨附的 MicrosoftEdgeWebView2Setup.exe（或從 https://developer.microsoft.com/microsoft-edge/webview2/ 下載）。%n%nWindows 7 SP1：僅支援 WebView2 執行階段 109 版本，請先安裝 109 離線執行階段再啟動 jsontool。
ja.WebView2Missing=jsontool には Microsoft Edge WebView2 ランタイムが必要です。%n%nWindows 10/11：同梱の MicrosoftEdgeWebView2Setup.exe を実行してください（または https://developer.microsoft.com/microsoft-edge/webview2/ からダウンロード）。%n%nWindows 7 SP1：WebView2 ランタイム 109 のみ対応しています。109 のオフライン ランタイムを先にインストールしてください。
ko.WebView2Missing=jsontool에는 Microsoft Edge WebView2 런타임이 필요합니다.%n%nWindows 10/11: 포함된 MicrosoftEdgeWebView2Setup.exe를 실행하세요(또는 https://developer.microsoft.com/microsoft-edge/webview2/ 에서 다운로드).%n%nWindows 7 SP1: WebView2 런타임 109만 지원됩니다. 먼저 109 오프라인 런타임을 설치하세요.
ru.WebView2Missing=Для jsontool требуется среда выполнения Microsoft Edge WebView2.%n%nWindows 10/11: запустите прилагаемый MicrosoftEdgeWebView2Setup.exe (или скачайте с https://developer.microsoft.com/microsoft-edge/webview2/).%n%nWindows 7 SP1: поддерживается только WebView2 109. Сначала установите офлайн-среду выполнения версии 109.
ar.WebView2Missing=يتطلب jsontool وقت تشغيل Microsoft Edge WebView2.%n%nWindows 10/11: شغّل ملف MicrosoftEdgeWebView2Setup.exe المرفق (أو نزّله من https://developer.microsoft.com/microsoft-edge/webview2/).%n%nWindows 7 SP1: يدعم الإصدار 109 فقط من WebView2، لذا ثبّت وقت التشغيل 109 دون اتصال قبل تشغيل jsontool.
es.WebView2Missing=jsontool necesita Microsoft Edge WebView2 Runtime.%n%nWindows 10/11: ejecute el MicrosoftEdgeWebView2Setup.exe incluido (o descárguelo de https://developer.microsoft.com/microsoft-edge/webview2/).%n%nWindows 7 SP1: solo se admite WebView2 Runtime 109. Instale el runtime 109 sin conexión antes de iniciar jsontool.

; Fill in the built-in Inno Setup messages that the shipped translation files
; leave undefined, so every language stays fully translated (no English
; fallback during the wizard).
en.LaunchProgram=Launch %1
en.AssocFileExtension=&Associate %1 with the %2 file extension
en.AssocingFileExtension=Associating %1 with the %2 file extension...
en.AutoStartProgramGroupDescription=Startup:
en.AutoStartProgram=Automatically start %1
en.AddonHostProgramNotFound=%1 could not be located in the folder you selected.%n%nDo you want to continue anyway?

zhcn.LaunchProgram=启动 %1
zhcn.AssocFileExtension=将 %1 与 %2 文件扩展名关联
zhcn.AssocingFileExtension=正在将 %1 与 %2 文件扩展名关联...
zhcn.AutoStartProgramGroupDescription=启动：
zhcn.AutoStartProgram=自动启动 %1
zhcn.AddonHostProgramNotFound=在您选择的文件夹中找不到 %1。%n%n是否仍要继续？
zhcn.UninstallProgram=卸载 %1

zhtw.LaunchProgram=啟動 %1
zhtw.AssocFileExtension=將 %1 與 %2 副檔名建立關聯
zhtw.AssocingFileExtension=正在將 %1 與 %2 副檔名建立關聯...
zhtw.AutoStartProgramGroupDescription=啟動：
zhtw.AutoStartProgram=自動啟動 %1
zhtw.AddonHostProgramNotFound=在您選擇的資料夾中找不到 %1。%n%n是否仍要繼續？
zhtw.UninstallProgram=解除安裝 %1

ja.LaunchProgram=%1 を起動
ja.AddonHostProgramNotFound=選択したフォルダーに %1 が見つかりませんでした。%n%nこのまま続行しますか？

ko.LaunchProgram=%1 실행
ko.AssocFileExtension=%1을(를) %2 파일 확장명과 연결
ko.AssocingFileExtension=%1을(를) %2 파일 확장명과 연결하는 중...
ko.AutoStartProgramGroupDescription=시작:
ko.AutoStartProgram=%1 자동 시작
ko.AddonHostProgramNotFound=선택한 폴더에서 %1을(를) 찾을 수 없습니다.%n%n계속하시겠습니까?
ko.UninstallProgram=%1 제거

ru.LaunchProgram=Запустить %1
ru.AddonHostProgramNotFound=Не удалось найти %1 в выбранной папке.%n%nПродолжить?

ar.LaunchProgram=تشغيل %1
ar.AssocFileExtension=ربط %1 بامتداد الملف %2
ar.AssocingFileExtension=جارٍ ربط %1 بامتداد الملف %2...
ar.AutoStartProgramGroupDescription=بدء التشغيل:
ar.AutoStartProgram=بدء تشغيل %1 تلقائيًا
ar.AddonHostProgramNotFound=تعذّر العثور على %1 في المجلد الذي حددته.%n%nهل تريد المتابعة على أي حال؟
ar.UninstallProgram=إزالة %1

es.LaunchProgram=Ejecutar %1
es.AddonHostProgramNotFound=No se pudo encontrar %1 en la carpeta seleccionada.%n%n¿Desea continuar de todos modos?

[Tasks]
; Exactly two optional tasks: desktop shortcut, and a scoped .json association.
; No group headers, so the page shows two self-explanatory checkboxes.
Name: "desktopicon"; Description: "{cm:TaskDesktopIcon}"; Flags: checkedonce
Name: "openwith"; Description: "{cm:TaskAssocJson}"; Flags: checkedonce

[Files]
Source: "..\src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; DestName: "README.md"; Flags: ignoreversion isreadme
Source: "..\public\fonts\QuanCangKai.ttf"; DestDir: "{app}\fonts"; Flags: ignoreversion
Source: "redist\MicrosoftEdgeWebView2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{tmp}\MicrosoftEdgeWebView2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "{cm:InstallingWebView2}"; Flags: waituntilterminated skipifdoesntexist; Check: NeedWebView2
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent

[Registry]
; "Open with" registration only. The .json default handler, icon and
; ProgID are intentionally left untouched.
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "{#MyAppName}"; Tasks: openwith
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}"; ValueType: string; ValueName: "ApplicationCompany"; ValueData: "{#MyAppPublisher}"; Tasks: openwith
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}"; ValueType: string; ValueName: "SupportedTypes"; ValueData: ".json"; Flags: uninsdeletevalue; Tasks: openwith
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"; Tasks: openwith
Root: HKLM; Subkey: "SOFTWARE\Classes\Applications\{#MyAppExeName}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: openwith
; First-run UI language (Inno language name, e.g. en/zhcn/zhtw/…) is written to
; {app}\install-language.txt in CurStepChanged; see [Code] below.

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
Type: files; Name: "{app}\install-language.txt"

[Code]
const
  WebView2ClientKey = 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';

function NeedWebView2: Boolean;
var
  Version: String;
begin
  Result := True;
  if RegQueryStringValue(HKLM, WebView2ClientKey, 'pv', Version) then
    Result := Version = ''
  else if RegQueryStringValue(HKCU, WebView2ClientKey, 'pv', Version) then
    Result := Version = '';
end;

procedure CleanupOpenWith;
var
  Names: String;
  Index: Integer;
begin
  // Remove our own entries left behind by Explorer's "Open with" MRU.
  if RegQueryStringValue(HKCU,
    'Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.json\OpenWithList',
    'a', Names) then
  begin
    if CompareText(Names, '{#MyAppExeName}') = 0 then
      RegDeleteValue(HKCU,
        'Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.json\OpenWithList', 'a');
  end;
  for Index := 0 to 25 do
  begin
    if RegQueryStringValue(HKCU,
      'Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.json\OpenWithList',
      Chr(Ord('a') + Index), Names) then
    begin
      if CompareText(Names, '{#MyAppExeName}') = 0 then
        RegDeleteValue(HKCU,
          'Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.json\OpenWithList',
          Chr(Ord('a') + Index));
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  // Remember the wizard language so the app can start in it. Any later choice
  // made inside the app wins; uninstall deletes this file.
  if CurStep = ssPostInstall then
    SaveStringToFile(ExpandConstant('{app}\install-language.txt'),
      ExpandConstant('{language}'), False);

  // If the runtime is still missing after the bundled installer ran (or when no
  // redist is shipped), tell the user what to install. Windows 7 SP1 needs the
  // WebView2 109 runtime, the last version that supports it.
  if (CurStep = ssPostInstall) and NeedWebView2 then
    MsgBox(ExpandConstant('{cm:WebView2Missing}'), mbInformation, MB_OK);
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    CleanupOpenWith;
  end;
end;
