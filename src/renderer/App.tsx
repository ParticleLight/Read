import { useState, useEffect } from 'react'
import { Library } from './components/Library/Library'
import { ReaderView } from './components/Reader/ReaderView'
import { useSettingsStore } from './stores/settingsStore'
import { useLibraryStore } from './stores/libraryStore'

export default function App() {
  const [currentBookId, setCurrentBookId] = useState<number | null>(null)
  const theme = useSettingsStore((s) => s.theme)
  const books = useLibraryStore((s) => s.books)
  const loadBooks = useLibraryStore((s) => s.loadBooks)

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const openBook = (bookId: number) => {
    setCurrentBookId(bookId)
    window.electronAPI.updateReadingProgress(bookId, { progress: 0 })
  }

  const closeBook = () => {
    setCurrentBookId(null)
  }

  if (currentBookId !== null) {
    return <ReaderView bookId={currentBookId} onClose={closeBook} />
  }

  return <Library onOpenBook={openBook} />
}
