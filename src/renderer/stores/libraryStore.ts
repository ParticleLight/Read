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
  isLoading: boolean
  viewMode: 'grid' | 'list'
  searchQuery: string
  sortBy: 'title' | 'author' | 'added_at' | 'last_opened'

  // Bookshelves
  bookshelves: Bookshelf[]
  activeShelfId: number | null
  shelfBookIds: number[]

  loadBooks: () => Promise<void>
  importBook: (filePath: string) => Promise<Book | null>
  importBooks: (filePaths: string[]) => Promise<void>
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
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  isLoading: false,
  viewMode: 'grid',
  searchQuery: '',
  sortBy: 'last_opened',

  bookshelves: [],
  activeShelfId: null,
  shelfBookIds: [],

  loadBooks: async () => {
    set({ isLoading: true })
    try {
      const { activeShelfId } = get()
      let books: Book[]
      if (activeShelfId !== null) {
        const bookIds = await window.electronAPI.getBooksInShelf(activeShelfId)
        const allBooks = await window.electronAPI.getBooks()
        books = (allBooks as Book[]).filter((b) => bookIds.includes(b.id))
      } else {
        books = (await window.electronAPI.getBooks()) as Book[]
      }
      set({ books })
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
      await window.electronAPI.importBooks(filePaths)
      await get().loadBooks()
    } catch (e) {
      console.error('Failed to import books:', e)
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
  },

  addBookToShelf: async (shelfId: number, bookId: number) => {
    try {
      await window.electronAPI.addBookToShelf(shelfId, bookId)
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
}))
