#include "App.h"
#include "services/DatabaseService.h"
#include "services/PdfService.h"
#include "services/BookSourceService.h"
#include "services/ZLibraryService.h"
#include "services/ContentCache.h"
#include "WebViewHost.h"
#include "BridgeServer.h"
#include "handlers/DbHandlers.h"
#include "handlers/FileHandlers.h"
#include <shlobj.h>
#include <fstream>
#include <sstream>

// Forward declaration from BookSourceService.cpp
class BridgeServer;
class BookSourceService;
class ZLibraryService;
void RegisterBookSourceHandlers(BridgeServer* bridge, BookSourceService* svc);
void RegisterZlibHandlers(BridgeServer* bridge, ZLibraryService* zlib);

App& App::Instance() { static App app; return app; }

void App::Init(HINSTANCE hInstance)
{
    m_hInstance = hInstance;

    // 1. Database
    m_db = std::make_unique<DatabaseService>();
    m_db->Load(UserDataPath() + "/data/reader.json");

    // 2. Bridge (message dispatch)
    m_bridge = std::make_unique<BridgeServer>();

    // 3. WebView host (window + browser)
    m_webview = std::make_unique<WebViewHost>();

    // Wire bridge <-> WebView
    m_bridge->SetWebView(m_webview.get());
    m_webview->SetMessageHandler([this](const std::string& msg) {
        m_bridge->HandleMessage(msg);
    });

    // 4. Inject bridge script BEFORE WebView2 navigates
    m_webview->InjectBridgeScript(BridgeServer::GenerateBridgeScript());
    // Z-Library floating toolbar
    m_webview->InjectBridgeScript(
        "(function(){"
        "var _t=setInterval(function(){if(document.body){clearInterval(_t);"
        // CSS
        "var s=document.createElement('style');s.textContent='#zlib-bar{position:fixed;bottom:16px;right:16px;z-index:2147483647;align-items:center;gap:2px;background:rgba(30,30,30,0.9);backdrop-filter:blur(20px);border-radius:24px;padding:6px 10px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 24px rgba(0,0,0,0.5)}#zlib-bar button{background:transparent;border:none;color:rgba(255,255,255,0.7);padding:8px;border-radius:50%;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center}#zlib-bar button:hover{color:#fff;background:rgba(255,255,255,0.1)}#zlib-bar .sep{width:1px;height:20px;background:rgba(255,255,255,0.1);margin:0 4px}#zlib-bar .u{font-size:11px;color:rgba(255,255,255,0.5);margin:0 6px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#zb-dl{display:none;align-items:center;gap:4px}#zb-dl-bar{width:80px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden}#zb-dl-fill{height:100%;width:0%;background:#60a5fa;border-radius:2px}#zb-dl-pct{font-size:10px;color:rgba(255,255,255,0.6);min-width:32px;text-align:right}#zb-ntf{position:fixed;bottom:72px;right:16px;z-index:2147483647;padding:8px 16px;border-radius:12px;font-size:13px;display:none;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,0.5)}#zb-ntf.ok{background:rgba(0,180,80,0.25);color:#4ade80;border:1px solid rgba(0,180,80,0.3)}#zb-ntf.err{background:rgba(220,60,60,0.25);color:#f87171;border:1px solid rgba(220,60,60,0.3)}#zb-ntf.info{background:rgba(60,140,240,0.25);color:#60a5fa;border:1px solid rgba(60,140,240,0.3)}';"
        "document.head.appendChild(s);"
        // HTML
        "function _svgs(){return '<button id=zb-back><svg width=16 height=16 viewBox=\"0 0 24 24\" fill=none stroke=currentColor stroke-width=2><path d=\"M15 19l-7-7 7-7\"/></svg></button>'"
        "+'<button id=zb-fwd><svg width=16 height=16 viewBox=\"0 0 24 24\" fill=none stroke=currentColor stroke-width=2><path d=\"M9 5l7 7-7 7\"/></svg></button>'"
        "+'<button id=zb-reload><svg width=16 height=16 viewBox=\"0 0 24 24\" fill=none stroke=currentColor stroke-width=2><path d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\"/></svg></button>'"
        "+'<span class=sep></span><span id=zb-dl><span id=zb-dl-pct></span><span id=zb-dl-bar><span id=zb-dl-fill></span></span></span>'"
        "+'<span class=sep></span><span class=u id=zb-url></span><span class=sep></span>'"
        "+'<button id=zb-mirror style=font-size:11px;padding:4px 8px;border-radius:6px;width:auto;height:28px>线路</button>'"
        "+'<span class=sep></span><button id=zb-close style=color:rgba(255,100,100,0.8)>'"
        "+'<svg width=16 height=16 viewBox=\"0 0 24 24\" fill=none stroke=currentColor stroke-width=2><path d=\"M6 18L18 6M6 6l12 12\"/></svg></button>'}"
        "var b=document.createElement('div');b.id='zlib-bar';b.style.display='flex';b.innerHTML=_svgs();"
        "document.body.appendChild(b);"
        // Event handlers
        "var _fu='';"
        "function _chk(){var h=location.hostname;var a=h.indexOf('z-lib')!==-1||h.indexOf('1lib')!==-1||h.indexOf('zzz')!==-1||h.indexOf('singlelogin')!==-1||h.indexOf('fbiwarning')!==-1||h.indexOf('zlibrary')!==-1;"
        "b.style.display=a?'flex':'none';if(a){if(!_fu)_fu=location.href;var el=document.getElementById('zb-url');if(el)el.textContent=location.href.substring(0,80)}}"
        "_chk();setInterval(_chk,500);"
        "document.getElementById('zb-back').onclick=function(){if(_fu&&location.href!==_fu)history.back()};"
        "document.getElementById('zb-fwd').onclick=function(){history.forward()};"
        "document.getElementById('zb-reload').onclick=function(){location.reload()};"
        "document.getElementById('zb-close').onclick=function(){window.chrome.webview.postMessage(JSON.stringify({type:'zlibClose'}))};"
        // Mirror selection popup
        "var _mp=null;"
        "document.getElementById('zb-mirror').onclick=function(){"
        "if(_mp){_mp.remove();_mp=null;return;}"
        "if(!window.electronAPI||!window.electronAPI.zlibGetMirrorInfo)return;"
        "window.electronAPI.zlibGetMirrorInfo().then(function(info){"
        "if(!info||!info.mirrors||!info.mirrors.length)return;"
        "var p=document.createElement('div');p.style.cssText='position:fixed;bottom:64px;right:16px;z-index:2147483647;background:rgba(30,30,30,0.95);border-radius:12px;padding:8px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 24px rgba(0,0,0,0.5);min-width:240px;max-height:300px;overflow-y:auto;font-family:system-ui';"
        "var hd=document.createElement('div');hd.textContent='线路 '+(info.index+1)+'/'+info.mirrors.length;hd.style.cssText='font-size:12px;color:#999;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:4px';p.appendChild(hd);"
        "for(var i=0;i<info.mirrors.length;i++){(function(idx,cur){"
        "var it=document.createElement('div');var u=info.mirrors[idx];try{var pn=new URL(u).hostname}catch(e){pn=u}"
        "it.textContent=pn;it.style.cssText='padding:8px 12px;cursor:pointer;border-radius:8px;font-size:13px;color:'+(idx===cur?'#fff':'#ccc')+';background:'+(idx===cur?'rgba(255,255,255,0.1)':'transparent');"
        "it.onmouseenter=function(){if(idx!==cur)it.style.background='rgba(255,255,255,0.05)'};"
        "it.onmouseleave=function(){if(idx!==cur)it.style.background='transparent'};"
        "it.onclick=function(){window.chrome.webview.postMessage(JSON.stringify({type:'zlibSwitchTo',index:idx}));p.remove();_mp=null;};"
        "p.appendChild(it);})(i,info.index)}"
        "document.body.appendChild(p);_mp=p;"
        "setTimeout(function(){var h=function(e){if(_mp&&!_mp.contains(e.target)){_mp.remove();_mp=null;document.removeEventListener('click',h)}};document.addEventListener('click',h)},100);"
        "}).catch(function(){});};"
        // Download notification toast
        "var _n=document.createElement('div');_n.id='zb-ntf';document.body.appendChild(_n);var _nt=null;"
        "function _toast(msg,cls){_n.textContent=msg;_n.className=cls;_n.style.display='block';if(_nt)clearTimeout(_nt);_nt=setTimeout(function(){_n.style.display='none'},4000);}"
        // Listen for download events (from C++ EmitEvent via bridge)
        "window.chrome.webview.addEventListener('message',function(e){try{var m=JSON.parse(e.data);if(m.type!=='event')return;var d=m.data;var z=document.getElementById('zb-dl');var p=document.getElementById('zb-dl-pct');var f=document.getElementById('zb-dl-fill');"
        "if(m.event==='zlib:downloadProgress'){"
        "  var pct=d.total>0?Math.round(d.received/d.total*100):0;z.style.display='flex';p.textContent=pct+'%';f.style.width=pct+'%';"
        "}else if(m.event==='zlib:downloadComplete'){z.style.display='none';_toast('下载完成: '+d.fileName,'info');}"
        "else if(m.event==='zlib:importComplete'){_toast('已导入书架: '+d.fileName,'ok');}"
        "else if(m.event==='zlib:importError'){_toast('导入失败: '+d.fileName,'err');}"
        "}catch(_){}});"
        "}},100)}"
        ")()"
    );

    // 5. Services
    m_pdf = std::make_unique<PdfService>();
    m_bookSource = std::make_shared<BookSourceService>(m_db.get(), m_bridge.get());
    m_zlib = std::make_unique<ZLibraryService>(m_bridge.get());
    m_zlib->SetHost(m_webview.get());
    m_zlib->SetDatabase(m_db.get());
    m_cache = std::make_unique<ContentCache>();

    // 6. Register IPC handlers
    RegisterDbHandlers(m_bridge.get(), m_db.get());
    RegisterFileHandlers(m_bridge.get(), m_db.get(), m_cache.get());
    RegisterPdfHandlers(m_bridge.get(), m_pdf.get());
    RegisterBookSourceHandlers(m_bridge.get(), m_bookSource.get());
    RegisterZlibHandlers(m_bridge.get(), m_zlib.get());
}

void App::Run()
{
    m_webview->CreateMainWindow(m_hInstance);
    m_webview->RunMessageLoop();
}

void App::Shutdown()
{
    if (m_db) m_db->FlushSync();
    m_webview.reset();
    m_bridge.reset();
    m_db.reset();
}

std::string App::UserDataPath() const
{
    wchar_t appData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_APPDATA, nullptr, 0, appData))) {
        char buf[MAX_PATH * 3];
        WideCharToMultiByte(CP_UTF8, 0, appData, -1, buf, sizeof(buf), nullptr, nullptr);
        return std::string(buf) + "/particle-book";
    }
    return ".";
}
