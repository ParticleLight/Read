import { create } from 'zustand'

export interface Book {
  id: number
  title: string
  author?: string
  format: string
  file_path: string
  file_size: number
  cover_path?: string
  description?: string
  publisher?: string
  publish_date?: string
  isbn?: string
  language?: string
  added_at: string
  last_opened?: string
}

export interface Bookshelf {
  id: number
  name: string
  created_at: string
}

export interface LibraryState {
  books: Book[]
  allBooks: Book[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  searchQuery: string
  sortBy: 'title' | 'author' | 'added_at' | 'last_opened'

  // Bookshelves
  bookshelves: Bookshelf[]
  activeShelfId: number | null
  shelfBookIds: number[]

  // Reading time
  readingTimeMap: Record<number, number>
  readingProgressMap: Record<number, { progress: number; page?: number; updated_at: string }>

  loadBooks: () => Promise<void>
  importBook: (filePath: string) => Promise<Book | null>
  importBooks: (filePaths: string[]) => Promise<Book[]>
  deleteBook: (id: number) => Promise<void>
  setViewMode: (mode: 'grid' | 'list') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'title' | 'author' | 'added_at' | 'last_opened') => void

  // Bookshelf actions
  loadBookshelves: () => Promise<void>
  createBookshelf: (name: string) => Promise<void>
  deleteBookshelf: (id: number) => Promise<void>
  renameBookshelf: (id: number, name: string) => Promise<void>
  setActiveShelf: (id: number | null) => Promise<void>
  addBookToShelf: (shelfId: number, bookId: number) => Promise<void>
  removeBookFromShelf: (shelfId: number, bookId: number) => Promise<void>

  // Reading time actions
  loadReadingTime: () => Promise<void>
  loadReadingProgress: () => Promise<void>
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  allBooks: [],
  isLoading: false,
  viewMode: 'grid',
  searchQuery: '',
  sortBy: 'last_opened',

  bookshelves: [],
  activeShelfId: null,
  shelfBookIds: [],

  readingTimeMap: {},
  readingProgressMap: {},

  loadBooks: async () => {
    set({ isLoading: true })
    try {
      const { activeShelfId } = get()
      const allBooks = (await window.electronAPI.getBooks()) as Book[]
      let books: Book[]
      if (activeShelfId !== null) {
        const bookIds = await window.electronAPI.getBooksInShelf(activeShelfId)
        books = allBooks.filter((b) => bookIds.includes(b.id))
      } else {
        books = allBooks
      }
      set({ books, allBooks })
    } catch (e) {
      console.error('Failed to load books:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  importBook: async (filePath: string) => {
    try {
      const books = await window.electronAPI.importBooks([filePath])
      if (books.length > 0) {
        await get().loadBooks()
        return books[0] as Book
      }
    } catch (e) {
      console.error('Failed to import book:', e)
    }
    return null
  },

  importBooks: async (filePaths: string[]) => {
    try {
      const imported = await window.electronAPI.importBooks(filePaths) as Book[]
      await get().loadBooks()
      // Also add to active shelf if viewing one
      const { activeShelfId, addBookToShelf } = get()
      if (activeShelfId !== null) {
        for (const book of imported) {
          await addBookToShelf(activeShelfId, book.id)
        }
      }
      return imported
    } catch (e) {
      console.error('Failed to import books:', e)
      return []
    }
  },

  deleteBook: async (id: number) => {
    try {
      await window.electronAPI.deleteBook(id)
      set({ books: get().books.filter((b) => b.id !== id) })
    } catch (e) {
      console.error('Failed to delete book:', e)
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),

  // Bookshelf actions
  loadBookshelves: async () => {
    try {
      const bookshelves = await window.electronAPI.getBookshelves()
      set({ bookshelves: bookshelves as Bookshelf[] })
    } catch (e) {
      console.error('Failed to load bookshelves:', e)
    }
  },

  createBookshelf: async (name: string) => {
    try {
      await window.electronAPI.addBookshelf(name)
      await get().loadBookshelves()
    } catch (e) {
      console.error('Failed to create bookshelf:', e)
    }
  },

  deleteBookshelf: async (id: number) => {
    try {
      await window.electronAPI.deleteBookshelf(id)
      const { activeShelfId } = get()
      if (activeShelfId === id) {
        set({ activeShelfId: null })
        await get().loadBooks()
      }
      await get().loadBookshelves()
    } catch (e) {
      console.error('Failed to delete bookshelf:', e)
    }
  },

  renameBookshelf: async (id: number, name: string) => {
    try {
      await window.electronAPI.renameBookshelf(id, name)
      await get().loadBookshelves()
    } catch (e) {
      console.error('Failed to rename bookshelf:', e)
    }
  },

  setActiveShelf: async (id: number | null) => {
    set({ activeShelfId: id })
    await get().loadBooks()
    if (id !== null) {
      const { books } = get()
      set({ shelfBookIds: books.map((b) => b.id) })
    } else {
      set({ shelfBookIds: [] })
    }
  },

  addBookToShelf: async (shelfId: number, bookId: number) => {
    try {
      await window.electronAPI.addBookToShelf(shelfId, bookId)
      const { activeShelfId } = get()
      if (activeShelfId === shelfId) {
        await get().loadBooks()
      }
    } catch (e) {
      console.error('Failed to add book to shelf:', e)
    }
  },

  removeBookFromShelf: async (shelfId: number, bookId: number) => {
    try {
      await window.electronAPI.removeBookFromShelf(shelfId, bookId)
      const { activeShelfId } = get()
      if (activeShelfId === shelfId) {
        await get().loadBooks()
      }
    } catch (e) {
      console.error('Failed to remove book from shelf:', e)
    }
  },

  loadReadingTime: async () => {
    try {
      const readingTimeMap = await window.electronAPI.getAllReadingTime()
      set({ readingTimeMap })
    } catch (e) {
      console.error('Failed to load reading time:', e)
    }
  },

  loadReadingProgress: async () => {
    try {
      const readingProgressMap = await window.electronAPI.getAllReadingProgress()
      set({ readingProgressMap })
    } catch (e) {
      console.error('Failed to load reading progress:', e)
    }
  },
}))
