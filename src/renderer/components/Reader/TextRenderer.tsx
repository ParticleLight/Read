import { useEffect, useRef, useMemo } from 'react'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { Book } from '../../stores/libraryStore'

interface TextRendererProps {
  book: Book
  content: Uint8Array
  bookId: number
}

export function TextRenderer({ book, content, bookId }: TextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const text = useMemo(() => new TextDecoder('utf-8').decode(content), [content])

  const progress = useReaderStore((s) => s.progress)
  const setProgress = useReaderStore((s) => s.setProgress)
  const saveProgress = useReaderStore((s) => s.saveProgress)
  const setTableOfContents = useReaderStore((s) => s.setTableOfContents)
  const navigateTarget = useReaderStore((s) => s.navigateTarget)
  const clearNavigateTarget = useReaderStore((s) => s.clearNavigateTarget)
  const turnPageDelta = useReaderStore((s) => s.turnPageDelta)
  const clearTurnPage = useReaderStore((s) => s.clearTurnPage)
  const seekTarget = useReaderStore((s) => s.seekTarget)
  const clearSeekTarget = useReaderStore((s) => s.clearSeekTarget)

  useEffect(() => {
    setTableOfContents([])
  }, [setTableOfContents])

  const fontSize = useSettingsStore((s) => s.fontSize)
  const fontFamily = useSettingsStore((s) => s.fontFamily)
  const lineHeight = useSettingsStore((s) => s.lineHeight)
  const margin = useSettingsStore((s) => s.margin)
  const textAlign = useSettingsStore((s) => s.textAlign)

  useEffect(() => {
    if (!navigateTarget || !containerRef.current) return
    if (navigateTarget.page) {
      const container = containerRef.current
      const scrollTop = (navigateTarget.page / 100) * container.scrollHeight
      container.scrollTop = scrollTop
    }
    clearNavigateTarget()
  }, [navigateTarget])

  useEffect(() => {
    if (turnPageDelta === null || !containerRef.current) return
    const container = containerRef.current
    container.scrollBy({ top: turnPageDelta > 0 ? container.clientHeight : -container.clientHeight, behavior: 'smooth' })
    clearTurnPage()
  }, [turnPageDelta])

  // Handle seek from progress bar
  useEffect(() => {
    if (seekTarget === null || !containerRef.current) return
    const container = containerRef.current
    const scrollTop = (seekTarget / 100) * (container.scrollHeight - container.clientHeight)
    container.scrollTop = scrollTop
    clearSeekTarget()
  }, [seekTarget])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight - container.clientHeight
      const progressPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress({ progress: progressPercent, scrollPosition: scrollTop })
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveProgress(), 500)
    }

    container.addEventListener('scroll', handleScroll)

    if (progress.scrollPosition) {
      container.scrollTop = progress.scrollPosition
    }

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [text])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-[var(--reader-bg)] text-[var(--reader-text)]"
    >
      <pre
        className="reader-content max-w-3xl mx-auto whitespace-pre-wrap break-words"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily.replace('Georgia', 'JetBrains Mono').replace('serif', 'monospace'),
          lineHeight,
          padding: `${margin}px`,
          textAlign,
        }}
      >
        {text}
      </pre>
    </div>
  )
}
