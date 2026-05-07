import { useState, useEffect } from 'react'
import { useLibraryStore } from '../../stores/libraryStore'
import type { Book } from '../../stores/libraryStore'

interface StatisticsPanelProps {
  onClose: () => void
  isClosing: boolean
}

function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
}

async function extractTextPreview(filePath: string): Promise<string | null> {
  try {
    const content = await window.electronAPI.readFile(filePath)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(content))
    const cleaned = text.replace(/\s+/g, ' ').trim()
    return cleaned.slice(0, 80) || null
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
      } else {
        const preview = await extractTextPreview(book.file_path)
        if (mounted) setTextPreview(preview)
      }
    }
    load()
    return () => { mounted = false }
  }, [book.id, book.file_path])

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Cover */}
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-white/5">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : textPreview ? (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/80 to-amber-950/90 flex flex-col p-1.5 relative overflow-hidden">
            <span className="text-[8px] text-amber-200/80 font-medium truncate">{book.title}</span>
            <p className="text-[7px] leading-[10px] text-amber-100/70 break-all line-clamp-[4] mt-0.5">{textPreview}</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
            {book.format.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{book.title}</div>
        <div className="text-xs text-white/40 truncate">{book.author || '未知作者'}</div>
        <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0 w-24">
        <div className="text-sm text-white/70">{Math.min(100, Math.round(progress * 10) / 10)}%</div>
        <div className="text-xs text-white/40">
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-lg font-semibold text-white">阅读统计</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">{allBooks.length}</div>
            <div className="text-xs text-white/50 mt-1">总书籍</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{formatReadingTime(totalTime)}</div>
            <div className="text-xs text-white/50 mt-1">总阅读时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{booksWithProgress}</div>
            <div className="text-xs text-white/50 mt-1">已开始阅读</div>
          </div>
        </div>

        {/* Book list */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-3">
          {bookStats.length === 0 ? (
            <div className="text-center text-white/40 py-8">暂无书籍</div>
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
