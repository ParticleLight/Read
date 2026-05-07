import { Book } from '../../stores/libraryStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { BookCard } from './BookCard'

interface BookGridProps {
  books: Book[]
  onOpenBook: (bookId: number) => void
}

export function BookGrid({ books, onOpenBook }: BookGridProps) {
  const deleteBook = useLibraryStore((s) => s.deleteBook)
  const activeShelfId = useLibraryStore((s) => s.activeShelfId)
  const removeBookFromShelf = useLibraryStore((s) => s.removeBookFromShelf)

  const handleRemoveFromShelf = (bookId: number) => {
    if (activeShelfId != null) {
      removeBookFromShelf(activeShelfId, bookId)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onOpen={onOpenBook}
          onDelete={deleteBook}
          onRemoveFromShelf={activeShelfId != null ? handleRemoveFromShelf : undefined}
          activeShelfId={activeShelfId}
        />
      ))}
    </div>
  )
}
