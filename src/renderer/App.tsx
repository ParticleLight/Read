import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Library } from './components/Library/Library'
import { ReaderView } from './components/Reader/ReaderView'
import { UpdateBanner } from './components/UI/UpdateBanner'
import { useSettingsStore } from './stores/settingsStore'
import { useLibraryStore } from './stores/libraryStore'

const GlobalSettings = lazy(() => import('./components/Settings/GlobalSettings').then(m => ({ default: m.GlobalSettings })))
const ZLibraryView = lazy(() => import('./components/ZLibrary/ZLibraryView').then(m => ({ default: m.ZLibraryView })))

type Page = 'library' | 'settings' | 'zlibrary'

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
    <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
  </div>
)

const PageShell = ({ children, show }: { children: React.ReactNode; show: boolean }) => (
  <div className={`h-screen overflow-hidden ${show ? 'animate-fade-in' : ''}`}>
    <UpdateBanner />
    {children}
  </div>
)

export default function App() {
  const [currentBookId, setCurrentBookId] = useState<number | null>(null)
  const [page, setPage] = useState<Page>('library')
  const [pageKey, setPageKey] = useState(0)
  const theme = useSettingsStore((s) => s.theme)
  const loadBooks = useLibraryStore((s) => s.loadBooks)

  useEffect(() => { loadBooks() }, [loadBooks])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light', 'sepia')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    return window.electronAPI.onMenuShowAbout(() => setPage('settings'))
  }, [])

  const navigateTo = useCallback((p: Page) => {
    setPage(p)
    setPageKey(k => k + 1)
  }, [])

  const openBook = useCallback((bookId: number) => {
    setCurrentBookId(bookId)
  }, [])

  const closeBook = useCallback(() => {
    setCurrentBookId(null)
    loadBooks()
  }, [loadBooks])

  if (currentBookId !== null) {
    return (
      <PageShell show>
        <ReaderView bookId={currentBookId} onClose={closeBook} />
      </PageShell>
    )
  }

  if (page === 'settings') {
    return (
      <PageShell show key={`settings-${pageKey}`}>
        <Suspense fallback={<PageLoader />}>
          <GlobalSettings onBack={() => navigateTo('library')} />
        </Suspense>
      </PageShell>
    )
  }

  if (page === 'zlibrary') {
    return (
      <PageShell show key={`zlibrary-${pageKey}`}>
        <Suspense fallback={<PageLoader />}>
          <ZLibraryView onBack={() => navigateTo('library')} />
        </Suspense>
      </PageShell>
    )
  }

  return (
    <PageShell show key="library">
      <Library onOpenBook={openBook} onOpenSettings={() => navigateTo('settings')} onOpenZLibrary={() => navigateTo('zlibrary')} />
    </PageShell>
  )
}
