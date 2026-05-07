import { useState, useEffect, useRef } from 'react'
import { Book, useLibraryStore } from '../../stores/libraryStore'
import { safeText } from '../../utils/safeText'

interface BookCardProps {
  book: Book
  onOpen: (bookId: number) => void
  onDelete: (bookId: number) => void
  onRemoveFromShelf?: (bookId: number) => void
  activeShelfId?: number | null
}

const formatColors: Record<string, string> = {
  epub: 'bg-blue-600',
  pdf: 'bg-red-600',
  mobi: 'bg-orange-600',
  txt: 'bg-gray-600',
  fb2: 'bg-green-600',
  cbz: 'bg-purple-600',
  cbr: 'bg-pink-600',
  html: 'bg-cyan-600',
  markdown: 'bg-teal-600',
}

async function generatePdfPreview(filePath: string): Promise<string | null> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', window.location.href).href

    const content = await window.electronAPI.readFile(filePath)
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(content) }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

async function generateCbzPreview(filePath: string): Promise<string | null> {
  try {
    const JSZip = (await import('jszip')).default
    const content = await window.electronAPI.readFile(filePath)
    const zip = await JSZip.loadAsync(new Uint8Array(content))

    const imageFiles: string[] = []
    zip.forEach((path) => {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path)) imageFiles.push(path)
    })
    imageFiles.sort()

    if (imageFiles.length === 0) return null
    const blob = await zip.file(imageFiles[0])!.async('blob')
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

async function extractTextPreview(filePath: string): Promise<string | null> {
  try {
    const content = await window.electronAPI.readFile(filePath)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(content))
    const cleaned = text.replace(/\s+/g, ' ').trim()
    return cleaned.slice(0, 120) || null
  } catch {
    return null
  }
}

function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
}

export function BookCard({ book, onOpen, onDelete, onRemoveFromShelf, activeShelfId }: BookCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showShelfMenu, setShowShelfMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  const { bookshelves, addBookToShelf, readingTimeMap } = useLibraryStore()
  const readingTime = readingTimeMap[book.id] || 0

  useEffect(() => {
    let mounted = true
    const loadCover = async () => {
      // Try existing cover first
      try {
        const cover = await window.electronAPI.getCoverImage(book.id)
        if (mounted && cover) {
          setCoverUrl(cover)
          return
        }
      } catch {}

      // Generate preview for PDF and CBZ
      if (book.format === 'pdf') {
        const preview = await generatePdfPreview(book.file_path)
        if (mounted && preview) setCoverUrl(preview)
      } else if (book.format === 'cbz' || book.format === 'cbr') {
        const preview = await generateCbzPreview(book.file_path)
        if (mounted && preview) {
          objectUrlRef.current = preview
          setCoverUrl(preview)
        }
      } else {
        // Text-based formats: show text preview
        const preview = await extractTextPreview(book.file_path)
        if (mounted && preview) setTextPreview(preview)
      }
    }
    loadCover()
    return () => {
      mounted = false
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [book.id])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(!showMenu)
  }

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => onOpen(book.id)}
      onContextMenu={handleContextMenu}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : textPreview ? (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/80 to-amber-950/90 flex flex-col p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,#fff_24px)]" />
            <span className="text-xs text-amber-200/80 font-medium mb-2 truncate">{safeText(book.title)}</span>
            <p className="text-[11px] leading-[18px] text-amber-100/70 break-all line-clamp-[8]">{textPreview}...</p>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs text-gray-400 text-center line-clamp-2">{safeText(book.title)}</span>
          </div>
        )}

        {/* Format badge */}
        <span className={`absolute top-2 right-2 text-xs font-bold text-white px-2 py-0.5 rounded ${formatColors[book.format] || 'bg-gray-600'}`}>
          {book.format.toUpperCase()}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <p className="text-sm font-medium text-[var(--reader-text)] truncate">{safeText(book.title)}</p>
        <p className="text-xs text-[var(--reader-text)] opacity-60 truncate">{safeText(book.author) || '未知作者'}</p>
        {readingTime > 0 && (
          <p className="text-xs text-[var(--reader-text)] opacity-40 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            已读 {formatReadingTime(readingTime)}
          </p>
        )}
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute z-50 top-2 left-2 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg shadow-xl py-1 min-w-[120px]">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(book.id); setShowMenu(false) }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--reader-text)] hover:bg-[var(--reader-border)]"
          >
            打开
          </button>
          {bookshelves.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowShelfMenu(!showShelfMenu) }}
              className="w-full text-left px-4 py-2 text-sm text-[var(--reader-text)] hover:bg-[var(--reader-border)] flex items-center justify-between"
            >
              添加到书柜
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {showShelfMenu && (
            <div className="pl-2">
              {bookshelves.map((shelf) => (
                <button
                  key={shelf.id}
                  onClick={(e) => { e.stopPropagation(); addBookToShelf(shelf.id, book.id); setShowMenu(false); setShowShelfMenu(false) }}
                  className="w-full text-left px-4 py-1.5 text-sm text-[var(--reader-text)] opacity-70 hover:opacity-100 hover:bg-[var(--reader-border)]"
                >
                  {shelf.name}
                </button>
              ))}
            </div>
          )}
          {activeShelfId != null && onRemoveFromShelf ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFromShelf(book.id); setShowMenu(false) }}
              className="w-full text-left px-4 py-2 text-sm text-orange-400 hover:bg-[var(--reader-border)]"
            >
              从书柜移除
            </button>
          ) : !confirmDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--reader-border)]"
            >
              删除
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(book.id); setShowMenu(false); setConfirmDelete(false) }}
              className="w-full text-left px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700"
            >
              确认删除
            </button>
          )}
        </div>
      )}
    </div>
  )
}
