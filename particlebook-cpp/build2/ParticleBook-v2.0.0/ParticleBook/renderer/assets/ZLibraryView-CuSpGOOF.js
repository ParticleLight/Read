import { r as reactExports, j as jsxRuntimeExports } from "./index-DYVh4C-w.js";
function ZLibraryView({ onBack }) {
  const containerRef = reactExports.useRef(null);
  const [currentUrl, setCurrentUrl] = reactExports.useState("");
  const [notification, setNotification] = reactExports.useState(null);
  const notificationTimer = reactExports.useRef();
  const syncBounds = reactExports.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    window.electronAPI.zlibSetBounds({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
  }, []);
  reactExports.useEffect(() => {
    window.electronAPI.zlibShow();
    const syncAfterLayout = () => {
      requestAnimationFrame(() => {
        syncBounds();
        setTimeout(syncBounds, 200);
      });
    };
    syncAfterLayout();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => syncBounds());
    observer.observe(container);
    window.addEventListener("resize", syncBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncBounds);
      window.electronAPI.zlibHide();
    };
  }, [syncBounds]);
  reactExports.useEffect(() => {
    const unsub = window.electronAPI.onZlibUrlChanged((url) => setCurrentUrl(url));
    return unsub;
  }, []);
  reactExports.useEffect(() => {
    const unsubs = [
      window.electronAPI.onZlibDownloadProgress((p) => {
        showNotification("progress", `下载中: ${p.fileName} ${Math.round(p.received / p.total * 100)}%`);
      }),
      window.electronAPI.onZlibDownloadComplete((d) => {
        showNotification("complete", `下载完成: ${d.fileName}`);
      }),
      window.electronAPI.onZlibImportComplete((d) => {
        showNotification("import", `已导入书架: ${d.fileName}`);
      }),
      window.electronAPI.onZlibImportError((d) => {
        showNotification("error", `导入失败: ${d.fileName} - ${d.error}`);
      })
    ];
    return () => unsubs.forEach((u) => u());
  }, []);
  const showNotification = (type, message) => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    setNotification({ type, message });
    notificationTimer.current = setTimeout(() => setNotification(null), 5e3);
  };
  const handleNavigate = (action) => {
    window.electronAPI.zlibNavigate(action);
  };
  const handleClose = () => {
    window.electronAPI.zlibHide();
    onBack();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-[var(--reader-bg)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "drag-region flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)] bg-[var(--reader-bg)]/80 backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleClose,
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "返回书架",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-[var(--reader-text)]", children: "Z-Library" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleNavigate("back"),
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "后退",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleNavigate("forward"),
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "前进",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleNavigate("reload"),
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "刷新",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => window.electronAPI.zlibShowMirrorMenu(),
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "切换线路",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: async () => {
              await window.electronAPI.zlibLogout();
              window.electronAPI.zlibNavigate("reload");
            },
            className: "p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors",
            title: "退出登录",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-2 px-3 py-1.5 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg text-xs text-[var(--reader-text)] opacity-50 truncate max-w-sm", children: currentUrl || "Z-Library" })
      ] })
    ] }),
    notification && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "px-4 py-2 text-sm flex-shrink-0",
        style: {
          color: notification.type === "error" ? "var(--notify-error-text)" : notification.type === "import" ? "var(--notify-success-text)" : "var(--notify-info-text)",
          backgroundColor: notification.type === "error" ? "var(--notify-error-bg)" : notification.type === "import" ? "var(--notify-success-bg)" : "var(--notify-info-bg)"
        },
        children: notification.message
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, className: "flex-1 bg-[var(--reader-bg)]" })
  ] });
}
export {
  ZLibraryView
};
