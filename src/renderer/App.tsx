import { useState, useEffect, lazy, Suspense } from 'react'
import { Library } from './components/Library/Library'
import { ReaderView } from './components/Reader/ReaderView'
import { UpdateBanner } from './components/UI/UpdateBanner'
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
    return window.electronAPI.onMenuShowAbout(() => {
      setPage('settings')
    })
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
    return (
      <>
        <UpdateBanner />
        <ReaderView bookId={currentBookId} onClose={closeBook} />
      </>
    )
  }

  if (page === 'settings') {
    return (
      <>
        <UpdateBanner />
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center bg-[var(--reader-bg)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        }>
          <GlobalSettings onBack={() => setPage('library')} />
        </Suspense>
      </>
    )
  }

  if (page === 'zlibrary') {
    return (
      <>
        <UpdateBanner />
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center bg-[var(--reader-bg)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        }>
          <ZLibraryView onBack={() => setPage('library')} />
        </Suspense>
      </>
    )
  }

  return (
    <>
      <UpdateBanner />
      <Library onOpenBook={openBook} onOpenSettings={() => setPage('settings')} onOpenZLibrary={() => setPage('zlibrary')} />
    </>
  )
}
