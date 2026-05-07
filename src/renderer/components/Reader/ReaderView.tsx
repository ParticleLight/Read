import { useEffect, useState, useRef, useCallback } from 'react'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

function useAnimatedMount(isOpen: boolean, duration = 200) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
    } else if (shouldRender) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return { shouldRender, isClosing }
}
import { EpubRenderer } from './EpubRenderer'
import { PdfRenderer } from './PdfRenderer'
import { ComicRenderer } from './ComicRenderer'
import { HtmlRenderer } from './HtmlRenderer'
import { TextRenderer } from './TextRenderer'
import { Sidebar } from './Sidebar'
import { ReaderControls } from './ReaderControls'
import { SettingsPanel } from '../Settings/SettingsPanel'

interface ReaderViewProps {
  bookId: number
  onClose: () => void
}

export function ReaderView({ bookId, onClose }: ReaderViewProps) {
  const [book, setBook] = useState<any>(null)
  const [bookContent, setBookContent] = useState<Uint8Array | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showArrows, setShowArrows] = useState(false)
  const arrowTimerRef = useRef<number | null>(null)
  const { showSidebar, showControls, controlsLocked, setShowControls, setShowSidebar, loadProgress, loadBookmarks, loadHighlights, loadNotes, turnPage, progress, saveProgress, setBookId } = useReaderStore()
  const { loadBookSettings, clearBookSettings } = useSettingsStore()
  const { shouldRender: renderSidebar, isClosing: sidebarClosing } = useAnimatedMount(showSidebar, 200)
  const { shouldRender: renderSettings, isClosing: settingsClosing } = useAnimatedMount(showSettings, 200)

  useEffect(() => {
    setBookId(bookId)
    const loadBook = async () => {
      const bookData = await window.electronAPI.getBook(bookId)
      setBook(bookData)

      // Load progress BEFORE content so renderer has correct position on mount
      await loadProgress(bookId)
      await loadBookmarks(bookId)
      await loadHighlights(bookId)
      await loadNotes(bookId)
      await loadBookSettings(bookId)

      const content = await window.electronAPI.readFile(bookData.file_path)
      setBookContent(new Uint8Array(content))
    }
    loadBook()

    return () => { setBookId(null) }
  }, [bookId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        saveProgress()
        clearBookSettings()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (controlsLocked) return
      const y = e.clientY
      const h = window.innerHeight
      setShowControls(y > h - 120 || y < 60)

      setShowArrows(true)
      if (arrowTimerRef.current) clearTimeout(arrowTimerRef.current)
      arrowTimerRef.current = window.setTimeout(() => setShowArrows(false), 2000)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [controlsLocked])

  if (!book || !bookContent) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const renderContent = () => {
    const props = { book, content: bookContent, bookId }

    switch (book.format) {
      case 'epub':
        return <EpubRenderer {...props} />
      case 'pdf':
        return <PdfRenderer {...props} />
      case 'cbz':
      case 'cbr':
        return <ComicRenderer {...props} />
      case 'fb2':
      case 'html':
      case 'markdown':
        return <HtmlRenderer {...props} />
      case 'txt':
      case 'mobi':
      default:
        return <TextRenderer {...props} />
    }
  }

  return (
    <div className="h-screen flex bg-[var(--reader-bg)] text-[var(--reader-text)] relative">
      {/* Sidebar overlay */}
      {renderSidebar && (
        <div className={`absolute inset-0 z-40 flex ${sidebarClosing ? 'animate-fade-out' : ''}`}>
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black/40 ${sidebarClosing ? 'opacity-0' : ''}`} style={{ transition: 'opacity 0.2s' }} onClick={() => setShowSidebar(false)} />
          {/* Panel */}
          <div className={`relative w-80 h-full border-r border-[var(--reader-border)] shadow-2xl ${sidebarClosing ? 'animate-slide-out' : 'animate-slide-in'}`} style={{ backgroundColor: 'var(--reader-sidebar)', opacity: 0.9 }}>
            <Sidebar bookId={bookId} onClose={onClose} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Back button */}
        <button
          onClick={() => { saveProgress(); clearBookSettings(); onClose() }}
          className="absolute top-4 left-4 z-30 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Book content */}
        <div className="h-full">
          {renderContent()}
        </div>

        {/* Page turn arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); turnPage(-1) }}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white/60 hover:text-white transition-all duration-300 backdrop-blur-sm ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="上一页"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); turnPage(1) }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white/60 hover:text-white transition-all duration-300 backdrop-blur-sm ${showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="下一页"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Controls */}
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ReaderControls bookId={bookId} onOpenSettings={() => setShowSettings(true)} />
        </div>

        {/* Page indicator */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full">
          {progress.page != null ? `第 ${progress.page} 页` : `${Math.round(progress.progress || 0)}%`}
        </div>
      </div>

      {/* Settings Panel */}
      {renderSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} format={book.format} isClosing={settingsClosing} />
      )}
    </div>
  )
}
