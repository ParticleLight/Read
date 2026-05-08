import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { useLibraryStore } from '../../stores/libraryStore'
import { BookGrid } from './BookGrid'
import { BookList } from './BookList'
import { BookShelfPanel } from './BookShelfPanel'
import { safeText } from '../../utils/safeText'

const StatisticsPanel = lazy(() => import('./StatisticsPanel').then(m => ({ default: m.StatisticsPanel })))
const ChangelogPanel = lazy(() => import('./ChangelogPanel').then(m => ({ default: m.ChangelogPanel })))
const BookSourcePanel = lazy(() => import('./BookSourcePanel').then(m => ({ default: m.BookSourcePanel })))

interface LibraryProps {
  onOpenBook: (bookId: number) => void
  onOpenSettings: () => void
  onOpenZLibrary: () => void
}

export function Library({ onOpenBook, onOpenSettings, onOpenZLibrary }: LibraryProps) {
  const { books, isLoading, viewMode, searchQuery, sortBy, activeShelfId, bookshelves, setViewMode, setSearchQuery, setSortBy, importBooks, loadBooks, loadBookshelves, loadReadingTime, loadReadingProgress } = useLibraryStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [showBookSource, setShowBookSource] = useState(false)

  useEffect(() => {
    loadBookshelves()
    loadReadingTime()
    loadReadingProgress()
  }, [])

  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return safeText(book.title).toLowerCase().includes(q) || safeText(book.author).toLowerCase().includes(q)
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'title': return safeText(a.title).localeCompare(safeText(b.title))
      case 'author': return safeText(a.author).localeCompare(safeText(b.author))
      case 'added_at': return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      case 'last_opened': return new Date(b.last_opened || 0).getTime() - new Date(a.last_opened || 0).getTime()
      default: return 0
    }
  })

  const handleImport = useCallback(async () => {
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      await importBooks([filePath])
    }
  }, [importBooks])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)
    const filePaths: string[] = []
    for (const file of Array.from(e.dataTransfer.files)) {
      try {
        const p = window.electronAPI.getFilePath(file)
        if (p) filePaths.push(p)
      } catch {}
    }
    if (filePaths.length > 0) {
      await importBooks(filePaths)
    }
  }, [importBooks])

  const dragCounterRef = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDragOver(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }, [])

  return (
    <div
      className="h-screen flex flex-col bg-[var(--reader-bg)]"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <header className="drag-region flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)] bg-[var(--reader-bg)]/80 backdrop-blur-sm">
        <div className="no-drag flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--reader-text)] flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            ParticleBook
          </h1>
          <span className="text-sm text-[var(--reader-text)] opacity-60">
            {activeShelfId !== null ? bookshelves.find((s) => s.id === activeShelfId)?.name : '全部书籍'} · {books.length} 本书
          </span>
        </div>

        <div className="no-drag flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索书名或作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg text-sm text-[var(--reader-text)] placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg text-sm text-[var(--reader-text)] focus:outline-none"
          >
            <option value="last_opened">最近阅读</option>
            <option value="added_at">添加时间</option>
            <option value="title">书名</option>
            <option value="author">作者</option>
          </select>

          {/* View Mode */}
          <div className="flex bg-[var(--reader-sidebar)] rounded-lg border border-[var(--reader-border)] overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--reader-accent)] text-white' : 'text-gray-400 hover:text-[var(--reader-text)]'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-[var(--reader-accent)] text-white' : 'text-gray-400 hover:text-[var(--reader-text)]'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
              </svg>
            </button>
          </div>

          {/* Import */}
          <button onClick={handleImport} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            导入
          </button>

          {/* Statistics */}
          <button
            onClick={() => setShowStatistics(true)}
            className="p-2 text-[var(--reader-text)] opacity-60 hover:opacity-100 rounded-lg hover:bg-[var(--reader-sidebar)] transition-colors"
            title="阅读统计"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Changelog */}
          <button
            onClick={() => setShowChangelog(true)}
            className="p-2 text-[var(--reader-text)] opacity-60 hover:opacity-100 rounded-lg hover:bg-[var(--reader-sidebar)] transition-colors"
            title="更新日志"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-[var(--reader-text)] opacity-60 hover:opacity-100 rounded-lg hover:bg-[var(--reader-sidebar)] transition-colors"
            title="全局设置"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Bookshelf sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-[var(--reader-border)] bg-[var(--reader-bg)] overflow-y-auto">
          <BookShelfPanel onOpenBookSource={() => setShowBookSource(true)} onOpenZLibrary={onOpenZLibrary} />
        </div>

        {/* Book area */}
        <div className="flex-1 overflow-y-auto p-6">
        {isDragOver && (
          <div className="absolute inset-6 z-50 flex items-center justify-center bg-indigo-600/20 border-2 border-dashed border-indigo-400 rounded-2xl pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xl text-indigo-300">拖放电子书文件到此处</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : sortedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--reader-text)] opacity-60">
            <svg className="w-24 h-24 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg mb-2">书架空空如也</p>
            <p className="text-sm">点击「导入」按钮或拖放文件添加电子书</p>
            <p className="text-sm mt-1 text-gray-600">支持 EPUB、PDF、MOBI、TXT、FB2、CBZ/CBR、HTML、Markdown</p>
          </div>
        ) : viewMode === 'grid' ? (
          <BookGrid books={sortedBooks} onOpenBook={onOpenBook} />
        ) : (
          <BookList books={sortedBooks} onOpenBook={onOpenBook} />
        )}
        </div>
      </main>

      {/* Statistics Panel */}
      {showStatistics && (
        <Suspense fallback={null}>
          <StatisticsPanel onClose={() => setShowStatistics(false)} isClosing={false} />
        </Suspense>
      )}

      {/* Changelog Panel */}
      {showChangelog && (
        <Suspense fallback={null}>
          <ChangelogPanel onClose={() => setShowChangelog(false)} isClosing={false} />
        </Suspense>
      )}

      {/* Book Source Panel */}
      {showBookSource && (
        <Suspense fallback={null}>
          <BookSourcePanel onClose={() => setShowBookSource(false)} isClosing={false} />
        </Suspense>
      )}
    </div>
  )
}
