import { useEffect, useState, useRef } from 'react'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'
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
  const { showSidebar, showControls, controlsLocked, setShowControls, loadProgress, loadBookmarks, loadHighlights, loadNotes, turnPage } = useReaderStore()

  useEffect(() => {
    const loadBook = async () => {
      const bookData = await window.electronAPI.getBook(bookId)
      setBook(bookData)

      const content = await window.electronAPI.readFile(bookData.file_path)
      setBookContent(new Uint8Array(content))

      await loadProgress(bookId)
      await loadBookmarks(bookId)
      await loadHighlights(bookId)
      await loadNotes(bookId)
    }
    loadBook()
  }, [bookId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
    <div
      className="h-screen flex bg-[var(--reader-bg)] text-[var(--reader-text)] relative"
      onMouseMove={(e) => {
        if (controlsLocked) return
        const y = e.clientY
        const h = window.innerHeight
        setShowControls(y > h - 120 || y < 60)

        setShowArrows(true)
        if (arrowTimerRef.current) clearTimeout(arrowTimerRef.current)
        arrowTimerRef.current = window.setTimeout(() => setShowArrows(false), 2000)
      }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 flex-shrink-0 border-r border-[var(--reader-border)] bg-[var(--reader-sidebar)]">
          <Sidebar bookId={bookId} onClose={onClose} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Back button */}
        <button
          onClick={onClose}
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
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} format={book.format} />
      )}
    </div>
  )
}
