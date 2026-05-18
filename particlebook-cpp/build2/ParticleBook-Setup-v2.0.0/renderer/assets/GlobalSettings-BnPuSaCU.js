import { u as useSettingsStore, r as reactExports, j as jsxRuntimeExports } from "./index-DYVh4C-w.js";
function GlobalSettings({ onBack }) {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    margin,
    setMargin,
    textAlign,
    setTextAlign
  } = useSettingsStore();
  const [appVersion, setAppVersion] = reactExports.useState(null);
  const [updateStatus, setUpdateStatus] = reactExports.useState("idle");
  const [updateInfo, setUpdateInfo] = reactExports.useState(null);
  const [downloadPercent, setDownloadPercent] = reactExports.useState(0);
  const [errorMessage, setErrorMessage] = reactExports.useState("");
  const [downloadPath, setDownloadPath] = reactExports.useState("");
  const idleTimerRef = reactExports.useRef(null);
  const fonts = [
    { label: "衬线体", value: "Georgia, Noto Serif SC, serif" },
    { label: "无衬线", value: "Inter, Noto Sans SC, sans-serif" },
    { label: "等宽", value: "JetBrains Mono, monospace" }
  ];
  const themes = [
    { id: "light", label: "亮色模式", desc: "适合白天阅读", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "dark", label: "暗色模式", desc: "适合夜间阅读", icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
    { id: "sepia", label: "护眼模式", desc: "降低蓝光，缓解疲劳", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }
  ];
  reactExports.useEffect(() => {
    window.electronAPI.getAppVersion().then((v) => setAppVersion(v));
    window.electronAPI.zlibGetDownloadPath().then((r) => {
      if (r?.path) setDownloadPath(r.path);
    });
  }, []);
  reactExports.useEffect(() => {
    const unsubs = [
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
        setUpdateStatus("available");
      }),
      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateStatus("not-available");
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          idleTimerRef.current = null;
          setUpdateStatus("idle");
        }, 3e3);
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateStatus("downloaded");
      }),
      window.electronAPI.onUpdateError((msg) => {
        setErrorMessage(msg);
        setUpdateStatus("error");
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          idleTimerRef.current = null;
          setUpdateStatus("idle");
        }, 5e3);
      }),
      window.electronAPI.onUpdateDownloadProgress((p) => {
        setUpdateStatus("downloading");
        setDownloadPercent(p.percent);
      })
    ];
    return () => {
      unsubs.forEach((u) => u());
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);
  const handleCheckUpdate = () => {
    setUpdateStatus("checking");
    setErrorMessage("");
    window.electronAPI.checkUpdate();
  };
  const handleDownloadUpdate = () => {
    setUpdateStatus("downloading");
    window.electronAPI.downloadUpdate();
  };
  const handleQuitAndInstall = () => {
    window.electronAPI.quitAndInstall();
  };
  const handleChangeDownloadPath = async () => {
    try {
      const result = await window.electronAPI.zlibPickDownloadFolder();
      if (result?.path) setDownloadPath(result.path);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-[var(--reader-bg)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "drag-region flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)] bg-[var(--reader-bg)]/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onBack,
          className: "p-2 rounded-lg hover:bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-60 hover:opacity-100 transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-[var(--reader-text)]", children: "全局设置" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto p-8 space-y-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "外观主题" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-4", children: themes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setTheme(t.id),
            className: `p-4 rounded-xl border-2 transition-all text-left ${theme === t.id ? "border-[var(--border-focus)] bg-[var(--color-indigo-bg)]" : "border-[var(--reader-border)] hover:border-[var(--border-focus)] bg-[var(--reader-sidebar)]"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6 mb-2 text-[var(--reader-text)]", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: t.icon }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-[var(--reader-text)]", children: t.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--reader-text)] opacity-50 mt-1", children: t.desc })
            ]
          },
          t.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "字体" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: fonts.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setFontFamily(f.value),
            className: `px-5 py-3 rounded-xl text-sm transition-all border-2 ${fontFamily === f.value ? "border-[var(--border-focus)] bg-[var(--color-indigo-bg)] text-[var(--reader-text)]" : "border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100"}`,
            style: { fontFamily: f.value },
            children: f.label
          },
          f.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "字号" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setFontSize(Math.max(12, fontSize - 1)),
              className: "w-10 h-10 rounded-lg bg-[var(--reader-sidebar)] border border-[var(--reader-border)] text-[var(--reader-text)] hover:bg-[var(--reader-border)] transition-colors font-bold",
              children: "A-"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "12",
              max: "32",
              value: fontSize,
              onChange: (e) => setFontSize(Number(e.target.value)),
              className: "flex-1",
              style: { accentColor: "var(--accent)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setFontSize(Math.min(32, fontSize + 1)),
              className: "w-10 h-10 rounded-lg bg-[var(--reader-sidebar)] border border-[var(--reader-border)] text-[var(--reader-text)] hover:bg-[var(--reader-border)] transition-colors font-bold",
              children: "A+"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[var(--reader-text)] opacity-60 w-12 text-center", children: [
            fontSize,
            "px"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "行距" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--reader-text)] opacity-50 text-sm", children: "紧凑" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "1.2",
              max: "3",
              step: "0.1",
              value: lineHeight,
              onChange: (e) => setLineHeight(Number(e.target.value)),
              className: "flex-1",
              style: { accentColor: "var(--accent)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--reader-text)] opacity-50 text-sm", children: "宽松" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--reader-text)] opacity-60 w-12 text-center", children: lineHeight.toFixed(1) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "边距" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--reader-text)] opacity-50 text-sm", children: "窄" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "0",
              max: "100",
              value: margin,
              onChange: (e) => setMargin(Number(e.target.value)),
              className: "flex-1",
              style: { accentColor: "var(--accent)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--reader-text)] opacity-50 text-sm", children: "宽" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[var(--reader-text)] opacity-60 w-12 text-center", children: [
            margin,
            "px"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "对齐方式" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setTextAlign("left"),
              className: `flex-1 py-3 rounded-xl text-sm transition-all border-2 ${textAlign === "left" ? "border-[var(--border-focus)] bg-[var(--color-indigo-bg)] text-[var(--reader-text)]" : "border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100"}`,
              children: "左对齐"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setTextAlign("justify"),
              className: `flex-1 py-3 rounded-xl text-sm transition-all border-2 ${textAlign === "justify" ? "border-[var(--border-focus)] bg-[var(--color-indigo-bg)] text-[var(--reader-text)]" : "border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100"}`,
              children: "两端对齐"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "Z-Library 下载位置" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--reader-sidebar)] rounded-xl border border-[var(--reader-border)] p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--reader-text)] opacity-70 mb-3 break-all", children: downloadPath || "加载中..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleChangeDownloadPath,
              className: "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              style: { color: "var(--color-indigo)", backgroundColor: "var(--color-indigo-bg)" },
              children: "更改文件夹"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "pt-6 border-t border-[var(--reader-border)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--reader-text)] opacity-40", children: "此处的设置对所有书籍生效。如果在阅读某本书时单独修改了设置，该书将使用独立设置，不受此处更改影响。" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-6 border-t border-[var(--reader-border)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--reader-text)] mb-4", children: "关于" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--reader-sidebar)] rounded-xl border border-[var(--reader-border)] p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-xl flex items-center justify-center", style: { backgroundColor: "var(--color-indigo-bg)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-8 h-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: { color: "var(--color-indigo)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-[var(--reader-text)]", children: "ParticleBook" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-[var(--reader-text)] opacity-50", children: [
                "v",
                appVersion || "..."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
            updateStatus === "checking" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg", style: { color: "var(--notify-info-text)", backgroundColor: "var(--notify-info-bg)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "正在检查更新..." })
            ] }),
            updateStatus === "available" && updateInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg", style: { color: "var(--notify-success-text)", backgroundColor: "var(--notify-success-bg)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium mb-2", children: [
                "发现新版本 v",
                updateInfo.version
              ] }),
              updateInfo.releaseNotes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs opacity-70 mb-2", children: updateInfo.releaseNotes }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleDownloadUpdate,
                  className: "px-3 py-1.5 text-xs rounded-md font-medium",
                  style: { backgroundColor: "var(--color-green)", color: "#fff" },
                  children: "下载更新"
                }
              )
            ] }),
            updateStatus === "downloading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg", style: { color: "var(--notify-info-text)", backgroundColor: "var(--notify-info-bg)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "正在下载更新..." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full mt-2", style: { backgroundColor: "var(--reader-border)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${downloadPercent}%`, backgroundColor: "var(--color-indigo)" } }) })
            ] }),
            updateStatus === "downloaded" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg", style: { color: "var(--notify-success-text)", backgroundColor: "var(--notify-success-bg)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium mb-2", children: "更新已下载，重启软件即可安装" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleQuitAndInstall,
                  className: "px-3 py-1.5 text-xs rounded-md font-medium",
                  style: { backgroundColor: "var(--color-green)", color: "#fff" },
                  children: "立即重启"
                }
              )
            ] }),
            updateStatus === "not-available" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg text-sm", style: { color: "var(--notify-success-text)", backgroundColor: "var(--notify-success-bg)" }, children: "已是最新版本" }),
            updateStatus === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg text-sm", style: { color: "var(--notify-error-text)", backgroundColor: "var(--notify-error-bg)" }, children: errorMessage }),
            (updateStatus === "idle" || updateStatus === "not-available" || updateStatus === "error") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: handleCheckUpdate,
                className: "w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                style: { color: "var(--color-indigo)", backgroundColor: "var(--color-indigo-bg)" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                  "检查更新"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--reader-text)] opacity-70 leading-relaxed mb-3", children: "一款内置 Z-Library 的全功能电子书阅读器，支持 EPUB、PDF、MOBI、TXT、FB2、CBZ/CBR、HTML、Markdown 等多种格式。" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--reader-text)] opacity-70 leading-relaxed mb-3", children: "提供书架管理、阅读进度同步、书签、高亮标注、笔记、多种主题切换等功能，为您带来舒适的阅读体验。" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: ["EPUB", "PDF", "MOBI", "TXT", "FB2", "CBZ/CBR", "HTML", "Markdown"].map((fmt) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 text-xs rounded-md", style: { color: "var(--color-indigo)", backgroundColor: "var(--color-indigo-bg)" }, children: fmt }, fmt)) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  GlobalSettings
};
