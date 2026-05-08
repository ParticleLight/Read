import { useState, useEffect, lazy, Suspense } from 'react'
import { Library } from './components/Library/Library'
import { ReaderView } from './components/Reader/ReaderView'
import { useSettingsStore } from './stores/settingsStore'
import { useLibraryStore } from './stores/libraryStore'

const GlobalSettings = lazy(() => import('./components/Settings/GlobalSettings').then(m => ({ default: m.GlobalSettings })))
const ZLibraryView = lazy(() => import('./components/ZLibrary/ZLibraryView').then(m => ({ default: m.ZLibraryView })))

type Page = 'library' | 'settings' | 'zlibrary'

export default function App() {
  const [currentBookId, setCurrentBookId] = useState<number | null>(null)
  const [page, setPage] = useState<Page>('library')
  const theme = useSettingsStore((s) => s.theme)
  const loadBooks = useLibraryStore((s) => s.loadBooks)

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light', 'sepia')
    root.classList.add(theme)
  }, [theme])

  const openBook = (bookId: number) => {
    setCurrentBookId(bookId)
  }

  const closeBook = () => {
    setCurrentBookId(null)
    loadBooks()
  }

  if (currentBookId !== null) {
    return <ReaderView bookId={currentBookId} onClose={closeBook} />
  }

  if (page === 'settings') {
    return (
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-[var(--reader-bg)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      }>
        <GlobalSettings onBack={() => setPage('library')} />
      </Suspense>
    )
  }

  if (page === 'zlibrary') {
    return (
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-[var(--reader-bg)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      }>
        <ZLibraryView onBack={() => setPage('library')} />
      </Suspense>
    )
  }

  return <Library onOpenBook={openBook} onOpenSettings={() => setPage('settings')} onOpenZLibrary={() => setPage('zlibrary')} />
}
