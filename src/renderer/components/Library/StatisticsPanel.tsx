import { useState, useEffect } from 'react'
import { useLibraryStore } from '../../stores/libraryStore'
import type { Book } from '../../stores/libraryStore'
import { formatReadingTime, extractTextPreview } from '../../utils/format'

interface StatisticsPanelProps {
  onClose: () => void
  isClosing: boolean
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
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
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
    zip.forEach((path) => { if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path)) imageFiles.push(path) })
    imageFiles.sort()
    if (imageFiles.length === 0) return null
    return URL.createObjectURL(await zip.file(imageFiles[0])!.async('blob'))
  } catch {
    return null
  }
}

function BookRow({ book, readingTime, progress }: { book: Book; readingTime: number; progress: number }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const cover = await window.electronAPI.getCoverImage(book.id)
      if (!mounted) return
      if (cover) {
        setCoverUrl(cover)
      } else if (book.format === 'pdf') {
        const preview = await generatePdfPreview(book.file_path)
        if (mounted && preview) setCoverUrl(preview)
      } else if (book.format === 'cbz' || book.format === 'cbr') {
        const preview = await generateCbzPreview(book.file_path)
        if (mounted && preview) setCoverUrl(preview)
      } else {
        const preview = await extractTextPreview(book.file_path)
        if (mounted) setTextPreview(preview)
      }
    }
    load()
    return () => { mounted = false }
  }, [book.id, book.file_path, book.format])

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Cover */}
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--reader-border)' }}>
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : textPreview ? (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/80 to-amber-950/90 flex flex-col p-1.5 relative overflow-hidden">
            <span className="text-[8px] text-amber-200/80 font-medium truncate">{book.title}</span>
            <p className="text-[7px] leading-[10px] text-amber-100/70 break-all line-clamp-[4] mt-0.5">{textPreview}</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--reader-text)', opacity: 0.2 }}>
            {book.format.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: 'var(--reader-text)' }}>{book.title}</div>
        <div className="text-xs truncate" style={{ color: 'var(--reader-text)', opacity: 0.4 }}>{book.author || '未知作者'}</div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--reader-border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round(progress))}%`, backgroundColor: 'var(--reader-accent)' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0 w-24">
        <div className="text-sm" style={{ color: 'var(--reader-text)', opacity: 0.7 }}>{Math.min(100, Math.round(progress * 10) / 10)}%</div>
        <div className="text-xs" style={{ color: 'var(--reader-text)', opacity: 0.4 }}>
          {readingTime > 0 ? formatReadingTime(readingTime) : '未阅读'}
        </div>
      </div>
    </div>
  )
}

export function StatisticsPanel({ onClose, isClosing }: StatisticsPanelProps) {
  const { readingTimeMap, readingProgressMap } = useLibraryStore()
  const [allBooks, setAllBooks] = useState<Book[]>([])

  useEffect(() => {
    window.electronAPI.getBooks().then((books) => setAllBooks(books as Book[]))
  }, [])

  const totalTime = Object.values(readingTimeMap).reduce((sum, t) => sum + t, 0)
  const booksWithProgress = Object.keys(readingProgressMap).length

  const bookStats = allBooks
    .map((book) => ({
      book,
      readingTime: readingTimeMap[book.id] || 0,
      progress: readingProgressMap[book.id]?.progress || 0,
    }))
    .sort((a, b) => b.readingTime - a.readingTime)

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center ${isClosing ? 'animate-fade-out' : ''}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} style={{ transition: 'opacity 0.2s' }} />
      <div
        className={`relative w-[700px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        style={{ backgroundColor: 'var(--reader-sidebar, #1e1e2e)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--reader-border)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-indigo)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-lg font-semibold" style={{ color: 'var(--reader-text)' }}>阅读统计</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--reader-text)', opacity: 0.6 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--reader-border)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-indigo)' }}>{allBooks.length}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--reader-text)', opacity: 0.5 }}>总书籍</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-green)' }}>{formatReadingTime(totalTime)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--reader-text)', opacity: 0.5 }}>总阅读时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-yellow)' }}>{booksWithProgress}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--reader-text)', opacity: 0.5 }}>已开始阅读</div>
          </div>
        </div>

        {/* Book list */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-3">
          {bookStats.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--reader-text)', opacity: 0.4 }}>暂无书籍</div>
          ) : (
            <div className="space-y-3">
              {bookStats.map((item) => (
                <BookRow
                  key={item.book.id}
                  book={item.book}
                  readingTime={item.readingTime}
                  progress={item.progress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
