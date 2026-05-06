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

export interface LibraryState {
  books: Book[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  searchQuery: string
  sortBy: 'title' | 'author' | 'added_at' | 'last_opened'

  loadBooks: () => Promise<void>
  importBook: (filePath: string) => Promise<Book | null>
  importBooks: (filePaths: string[]) => Promise<void>
  deleteBook: (id: number) => Promise<void>
  setViewMode: (mode: 'grid' | 'list') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'title' | 'author' | 'added_at' | 'last_opened') => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  isLoading: false,
  viewMode: 'grid',
  searchQuery: '',
  sortBy: 'last_opened',

  loadBooks: async () => {
    set({ isLoading: true })
    try {
      const books = await window.electronAPI.getBooks()
      set({ books: books as Book[] })
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
}))
