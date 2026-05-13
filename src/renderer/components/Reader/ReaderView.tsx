import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { Book } from '../../stores/libraryStore'

function useAnimatedMount(isOpen: boolean, duration = 200) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  useEffect(() => {
    if (isOpen) { setShouldRender(true); setIsClosing(false) }
    else if (shouldRender) { setIsClosing(true); const timer = setTimeout(() => { setShouldRender(false); setIsClosing(false) }, duration); return () => clearTimeout(timer) }
  }, [isOpen, shouldRender])
  return { shouldRender, isClosing }
}

import { Sidebar } from './Sidebar'
import { ReaderControls } from './ReaderControls'
import { formatReadingTime } from '../../utils/format'

const EpubRenderer = lazy(() => import('./EpubRenderer').then(m => ({ default: m.EpubRenderer })))
const PdfRenderer = lazy(() => import('./PdfRenderer').then(m => ({ default: m.PdfRenderer })))
const ComicRenderer = lazy(() => import('./ComicRenderer').then(m => ({ default: m.ComicRenderer })))
const HtmlRenderer = lazy(() => import('./HtmlRenderer').then(m => ({ default: m.HtmlRenderer })))
const TextRenderer = lazy(() => import('./TextRenderer').then(m => ({ default: m.TextRenderer })))
const SettingsPanel = lazy(() => import('../Settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })))

interface ReaderViewProps { bookId: number; onClose: () => void }

function ReadingTimeDisplay() {
  const t = useReaderStore((s) => s.currentReadingTime)
  return <span title="本次阅读时长"><svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{formatReadingTime(t)}</span>
}

export function ReaderView({ bookId, onClose }: ReaderViewProps) {
  const [book, setBook] = useState<Book | null>(null)
  const [bookContent, setBookContent] = useState<Uint8Array | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showArrows, setShowArrows] = useState(false)
  const arrowTimerRef = useRef<number | null>(null)
  const sessionActiveRef = useRef(false)
  const settingsOpenRef = useRef(false)

  const showSidebar = useReaderStore((s) => s.showSidebar)
  const showControls = useReaderStore((s) => s.showControls)
  const controlsLocked = useReaderStore((s) => s.controlsLocked)
  const progress = useReaderStore((s) => s.progress)
  const setShowControls = useReaderStore((s) => s.setShowControls)
  const setShowSidebar = useReaderStore((s) => s.setShowSidebar)
  const loadProgress = useReaderStore((s) => s.loadProgress)
  const loadBookmarks = useReaderStore((s) => s.loadBookmarks)
  const loadHighlights = useReaderStore((s) => s.loadHighlights)
  const loadNotes = useReaderStore((s) => s.loadNotes)
  const turnPage = useReaderStore((s) => s.turnPage)
  const flushProgress = useReaderStore((s) => s.flushProgress)
  const setBookId = useReaderStore((s) => s.setBookId)
  const startReadingSession = useReaderStore((s) => s.startReadingSession)
  const endReadingSession = useReaderStore((s) => s.endReadingSession)
  const updateReadingTime = useReaderStore((s) => s.updateReadingTime)

  const loadBookSettings = useSettingsStore((s) => s.loadBookSettings)
  const clearBookSettings = useSettingsStore((s) => s.clearBookSettings)

  const { shouldRender: renderSidebar, isClosing: sidebarClosing } = useAnimatedMount(showSidebar)
  const { shouldRender: renderSettings, isClosing: settingsClosing } = useAnimatedMount(showSettings)

  useEffect(() => { setBookId(bookId)
    const loadBook = async () => {
      try {
        const bookData = await window.electronAPI.getBook(bookId); setBook(bookData)
        await loadProgress(bookId); await loadBookmarks(bookId); await loadHighlights(bookId); await loadNotes(bookId); await loadBookSettings(bookId)
        const content = await window.electronAPI.readFile(bookData.file_path); setBookContent(new Uint8Array(content))
      } catch (e) { console.error('Failed to load book:', e); onClose() }
    }
    loadBook()
    return () => { setBookId(null) }
  }, [bookId])

  useEffect(() => { settingsOpenRef.current = showSettings }, [showSettings])

  useEffect(() => {
    if (!bookContent || !book) return
    if (sessionActiveRef.current) return
    sessionActiveRef.current = true
    startReadingSession().catch((e) => { sessionActiveRef.current = false; console.error('Failed to start reading session:', e) })
  }, [bookContent, book])

  useEffect(() => { return () => { if (sessionActiveRef.current) { sessionActiveRef.current = false; flushProgress().finally(() => endReadingSession()) } } }, [bookId])

  useEffect(() => { if (!bookContent) return; const interval = setInterval(() => updateReadingTime(), 1000); return () => clearInterval(interval) }, [bookContent])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => { if (e.key === 'Escape') { await endReadingSession(); await flushProgress(); clearBookSettings(); onClose() } }
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!book) return
    const isPaginated = ['epub', 'cbz', 'cbr'].includes(book.format)
    if (!isPaginated) return
    let wheelTimer: ReturnType<typeof setTimeout> | null = null
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      const { showSidebar } = useReaderStore.getState()
      if (showSidebar || settingsOpenRef.current) return
      e.preventDefault()
      if (wheelTimer) return
      wheelTimer = setTimeout(() => { wheelTimer = null }, 200)
      if (e.deltaY > 0) turnPage(1); else if (e.deltaY < 0) turnPage(-1)
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => { window.removeEventListener('wheel', handleWheel); if (wheelTimer) clearTimeout(wheelTimer) }
  }, [book, turnPage])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (controlsLocked) return
      const y = e.clientY; const h = window.innerHeight
      setShowControls(y > h - 120 || y < 60)
      setShowArrows(true)
      if (arrowTimerRef.current) clearTimeout(arrowTimerRef.current)
      arrowTimerRef.current = window.setTimeout(() => setShowArrows(false), 2000)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => { window.removeEventListener('mousemove', handleMouseMove); if (arrowTimerRef.current) { clearTimeout(arrowTimerRef.current); arrowTimerRef.current = null } }
  }, [controlsLocked])

  if (!book || !bookContent) {
    return <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" /></div>
  }

  const loadingFallback = <div className="h-full flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" /></div>

  const renderContent = () => {
    const props = { book, content: bookContent, bookId }
    return <Suspense fallback={loadingFallback}>{(() => { switch (book.format) { case 'epub': return <EpubRenderer {...props} />; case 'pdf': return <PdfRenderer {...props} />; case 'cbz': case 'cbr': return <ComicRenderer {...props} />; case 'fb2': case 'html': case 'markdown': return <HtmlRenderer {...props} />; case 'txt': case 'mobi': default: return <TextRenderer {...props} /> } })()}</Suspense>
  }

  return (
    <div className="h-screen flex relative" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {renderSidebar && (
        <div className={`absolute inset-0 z-40 flex ${sidebarClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`absolute inset-0 ${sidebarClosing ? 'opacity-0' : ''}`} style={{ background: 'rgba(0,0,0,0.45)', transition: 'opacity 0.2s' }} onClick={() => setShowSidebar(false)} />
          <div className={`relative w-80 h-full shadow-win-lg ${sidebarClosing ? 'animate-slide-out' : 'animate-slide-in'}`} style={{ background: 'var(--acrylic-bg)', backdropFilter: 'blur(24px)', borderRight: '1px solid var(--acrylic-border)' }}>
            <Sidebar bookId={bookId} onClose={onClose} />
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <button onClick={async () => { await endReadingSession(); await flushProgress(); clearBookSettings(); onClose() }}
          aria-label="返回书架"
          className="absolute top-4 left-4 z-30 p-2 rounded-lg transition-all duration-150"
          style={{ background: 'var(--surface)', color: 'var(--text-primary)', backdropFilter: 'blur(16px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="h-full">{renderContent()}</div>

        <button onClick={(e) => { e.stopPropagation(); turnPage(-1) }} aria-label="上一页"
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all duration-300 ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'var(--surface)', color: 'var(--text-primary)', backdropFilter: 'blur(16px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); turnPage(1) }} aria-label="下一页"
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all duration-300 ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'var(--surface)', color: 'var(--text-primary)', backdropFilter: 'blur(16px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ReaderControls bookId={bookId} onOpenSettings={() => setShowSettings(true)} />
        </div>

        <div className="absolute bottom-3 right-3 z-10 text-xs px-3 py-1.5 rounded-full flex items-center gap-3"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', backdropFilter: 'blur(16px)' }}>
          <span>{progress.page != null ? `第 ${progress.page} 页` : `${Math.round(progress.progress || 0)}%`}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>|</span>
          <ReadingTimeDisplay />
        </div>
      </div>

      {renderSettings && (
        <Suspense fallback={null}>
          <SettingsPanel onClose={() => setShowSettings(false)} format={book.format} isClosing={settingsClosing} />
        </Suspense>
      )}
    </div>
  )
}
