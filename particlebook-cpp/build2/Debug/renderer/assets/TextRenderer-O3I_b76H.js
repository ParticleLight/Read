import { r as reactExports, i as useReaderStore, u as useSettingsStore, j as jsxRuntimeExports } from "./index-Dc6Yu-j7.js";
function TextRenderer({ book, content, bookId }) {
  const containerRef = reactExports.useRef(null);
  const text = reactExports.useMemo(() => new TextDecoder("utf-8").decode(content), [content]);
  const progress = useReaderStore((s) => s.progress);
  const setProgress = useReaderStore((s) => s.setProgress);
  const saveProgress = useReaderStore((s) => s.saveProgress);
  const setTableOfContents = useReaderStore((s) => s.setTableOfContents);
  const navigateTarget = useReaderStore((s) => s.navigateTarget);
  const clearNavigateTarget = useReaderStore((s) => s.clearNavigateTarget);
  const turnPageDelta = useReaderStore((s) => s.turnPageDelta);
  const clearTurnPage = useReaderStore((s) => s.clearTurnPage);
  const seekTarget = useReaderStore((s) => s.seekTarget);
  const clearSeekTarget = useReaderStore((s) => s.clearSeekTarget);
  reactExports.useEffect(() => {
    setTableOfContents([]);
  }, [setTableOfContents]);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const lineHeight = useSettingsStore((s) => s.lineHeight);
  const margin = useSettingsStore((s) => s.margin);
  const textAlign = useSettingsStore((s) => s.textAlign);
  reactExports.useEffect(() => {
    if (!navigateTarget || !containerRef.current) return;
    if (navigateTarget.page) {
      const container = containerRef.current;
      const scrollTop = navigateTarget.page / 100 * container.scrollHeight;
      container.scrollTop = scrollTop;
    }
    clearNavigateTarget();
  }, [navigateTarget]);
  reactExports.useEffect(() => {
    if (turnPageDelta === null || !containerRef.current) return;
    const container = containerRef.current;
    container.scrollBy({ top: turnPageDelta > 0 ? container.clientHeight : -container.clientHeight, behavior: "smooth" });
    clearTurnPage();
  }, [turnPageDelta]);
  reactExports.useEffect(() => {
    if (seekTarget === null || !containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = seekTarget / 100 * (container.scrollHeight - container.clientHeight);
    container.scrollTop = scrollTop;
    clearSeekTarget();
  }, [seekTarget]);
  reactExports.useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let saveTimer = null;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progressPercent = scrollHeight > 0 ? scrollTop / scrollHeight * 100 : 0;
      setProgress({ progress: progressPercent, scrollPosition: scrollTop });
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveProgress(), 500);
    };
    container.addEventListener("scroll", handleScroll);
    if (progress.scrollPosition) {
      container.scrollTop = progress.scrollPosition;
    }
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [text]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className: "h-full overflow-auto bg-[var(--reader-bg)] text-[var(--reader-text)]",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "pre",
        {
          className: "reader-content max-w-3xl mx-auto whitespace-pre-wrap break-words",
          style: {
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily.replace("Georgia", "JetBrains Mono").replace("serif", "monospace"),
            lineHeight,
            padding: `${margin}px`,
            textAlign
          },
          children: text
        }
      )
    }
  );
}
export {
  TextRenderer
};
