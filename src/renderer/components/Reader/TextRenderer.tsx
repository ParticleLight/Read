import { useEffect, useRef } from 'react'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface TextRendererProps {
  book: any
  content: Uint8Array
  bookId: number
}

export function TextRenderer({ book, content, bookId }: TextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const text = new TextDecoder('utf-8').decode(content)

  const { progress, setProgress, saveProgress, navigateTarget, clearNavigateTarget, turnPageDelta, clearTurnPage } = useReaderStore()
  const { fontSize, fontFamily, lineHeight, margin, textAlign, theme } = useSettingsStore()

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
    container.scrollBy({ top: turnPageDelta > 0 ? container.clientHeight * 0.9 : -container.clientHeight * 0.9, behavior: 'smooth' })
    clearTurnPage()
  }, [turnPageDelta])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight - container.clientHeight
      const progressPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress({ progress: progressPercent, scrollPosition: scrollTop })
      saveProgress()
    }

    container.addEventListener('scroll', handleScroll)

    if (progress.scrollPosition) {
      container.scrollTop = progress.scrollPosition
    }

    return () => container.removeEventListener('scroll', handleScroll)
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
