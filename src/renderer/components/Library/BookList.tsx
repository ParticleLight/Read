import { useState } from 'react'
import { Book } from '../../stores/libraryStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { safeText } from '../../utils/safeText'

interface BookListProps {
  books: Book[]
  onOpenBook: (bookId: number) => void
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function BookList({ books, onOpenBook }: BookListProps) {
  const deleteBook = useLibraryStore((s) => s.deleteBook)
  const activeShelfId = useLibraryStore((s) => s.activeShelfId)
  const removeBookFromShelf = useLibraryStore((s) => s.removeBookFromShelf)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleDelete = (e: React.MouseEvent, bookId: number) => {
    e.stopPropagation()
    if (activeShelfId != null) {
      removeBookFromShelf(activeShelfId, bookId)
      return
    }
    if (confirmId === bookId) {
      deleteBook(bookId)
      setConfirmId(null)
    } else {
      setConfirmId(bookId)
    }
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-[var(--reader-text)] opacity-60 uppercase tracking-wider border-b border-[var(--reader-border)]">
        <div className="col-span-5">书名</div>
        <div className="col-span-3">作者</div>
        <div className="col-span-1">格式</div>
        <div className="col-span-1">大小</div>
        <div className="col-span-1">添加时间</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      {books.map((book) => (
        <div
          key={book.id}
          onClick={() => onOpenBook(book.id)}
          className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-[var(--reader-sidebar)] cursor-pointer transition-colors group"
        >
          <div className="col-span-5 flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--reader-text)] opacity-40 group-hover:text-[var(--reader-accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm text-[var(--reader-text)] truncate">{safeText(book.title)}</span>
          </div>
          <div className="col-span-3 text-sm text-[var(--reader-text)] opacity-70 truncate flex items-center">{safeText(book.author) || '—'}</div>
          <div className="col-span-1 flex items-center">
            <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${formatColors[book.format] || 'bg-gray-600'}`}>
              {book.format.toUpperCase()}
            </span>
          </div>
          <div className="col-span-1 text-sm text-[var(--reader-text)] opacity-60 flex items-center">{formatFileSize(book.file_size)}</div>
          <div className="col-span-1 text-sm text-[var(--reader-text)] opacity-60 flex items-center">
            {new Date(book.added_at).toLocaleDateString('zh-CN')}
          </div>
          <div className="col-span-1 flex items-center justify-end">
            <button
              onClick={(e) => handleDelete(e, book.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                activeShelfId != null
                  ? 'opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-300 hover:bg-[var(--reader-sidebar)]'
                  : confirmId === book.id
                    ? 'bg-red-600 text-white'
                    : 'opacity-0 group-hover:opacity-100 text-[var(--reader-text)] opacity-60 hover:text-red-400 hover:bg-[var(--reader-sidebar)]'
              }`}
              title={activeShelfId != null ? '从书柜移除' : confirmId === book.id ? '再次点击确认删除' : '删除'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeShelfId != null ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"} />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
