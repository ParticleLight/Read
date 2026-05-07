import { useState, useEffect } from 'react'
import { Library } from './components/Library/Library'
import { ReaderView } from './components/Reader/ReaderView'
import { GlobalSettings } from './components/Settings/GlobalSettings'
import { useSettingsStore } from './stores/settingsStore'
import { useLibraryStore } from './stores/libraryStore'

type Page = 'library' | 'settings'

export default function App() {
  const [currentBookId, setCurrentBookId] = useState<number | null>(null)
  const [page, setPage] = useState<Page>('library')
  const theme = useSettingsStore((s) => s.theme)
  const books = useLibraryStore((s) => s.books)
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
    return <GlobalSettings onBack={() => setPage('library')} />
  }

  return <Library onOpenBook={openBook} onOpenSettings={() => setPage('settings')} />
}
