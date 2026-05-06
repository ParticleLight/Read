import { create } from 'zustand'

export interface Bookmark {
  id: number
  book_id: number
  cfi?: string
  page?: number
  title?: string
  note?: string
  created_at: string
}

export interface Highlight {
  id: number
  book_id: number
  cfi?: string
  page?: number
  text: string
  color: string
  note?: string
  created_at: string
}

export interface Note {
  id: number
  book_id: number
  highlight_id?: number
  cfi?: string
  page?: number
  content: string
  created_at: string
  updated_at: string
}

export interface ReadingProgress {
  progress: number
  cfi?: string
  page?: number
  scrollPosition?: number
}

export interface ReaderState {
  bookId: number | null
  progress: ReadingProgress
  bookmarks: Bookmark[]
  highlights: Highlight[]
  notes: Note[]
  sidebarTab: 'toc' | 'bookmarks' | 'highlights' | 'notes'
  showSidebar: boolean
  showControls: boolean
  tableOfContents: any[]

  setBookId: (id: number | null) => void
  setProgress: (progress: ReadingProgress) => void
  saveProgress: () => Promise<void>
  loadProgress: (bookId: number) => Promise<void>

  loadBookmarks: (bookId: number) => Promise<void>
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'created_at'>) => Promise<void>
  removeBookmark: (id: number) => Promise<void>

  loadHighlights: (bookId: number) => Promise<void>
  addHighlight: (highlight: Omit<Highlight, 'id' | 'created_at'>) => Promise<void>
  removeHighlight: (id: number) => Promise<void>

  loadNotes: (bookId: number) => Promise<void>
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateNote: (id: number, content: string) => Promise<void>
  removeNote: (id: number) => Promise<void>

  setSidebarTab: (tab: 'toc' | 'bookmarks' | 'highlights' | 'notes') => void
  toggleSidebar: () => void
  setShowControls: (show: boolean) => void
  setTableOfContents: (toc: any[]) => void
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  bookId: null,
  progress: { progress: 0 },
  bookmarks: [],
  highlights: [],
  notes: [],
  sidebarTab: 'toc',
  showSidebar: false,
  showControls: true,
  tableOfContents: [],

  setBookId: (bookId) => set({ bookId }),

  setProgress: (progress) => set({ progress }),

  saveProgress: async () => {
    const { bookId, progress } = get()
    if (bookId === null) return
    try {
      await window.electronAPI.updateReadingProgress(bookId, progress)
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  },

  loadProgress: async (bookId: number) => {
    try {
      const progress = await window.electronAPI.getReadingProgress(bookId)
      if (progress) {
        set({ progress: { progress: progress.progress, cfi: progress.cfi, page: progress.page, scrollPosition: progress.scroll_position } })
      } else {
        set({ progress: { progress: 0 } })
      }
    } catch (e) {
      console.error('Failed to load progress:', e)
    }
  },

  loadBookmarks: async (bookId: number) => {
    try {
      const bookmarks = await window.electronAPI.getBookmarks(bookId)
      set({ bookmarks: bookmarks as Bookmark[] })
    } catch (e) {
      console.error('Failed to load bookmarks:', e)
    }
  },

  addBookmark: async (bookmark) => {
    try {
      await window.electronAPI.addBookmark(bookmark)
      await get().loadBookmarks(bookmark.book_id)
    } catch (e) {
      console.error('Failed to add bookmark:', e)
    }
  },

  removeBookmark: async (id: number) => {
    try {
      await window.electronAPI.deleteBookmark(id)
      set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) })
    } catch (e) {
      console.error('Failed to remove bookmark:', e)
    }
  },

  loadHighlights: async (bookId: number) => {
    try {
      const highlights = await window.electronAPI.getHighlights(bookId)
      set({ highlights: highlights as Highlight[] })
    } catch (e) {
      console.error('Failed to load highlights:', e)
    }
  },

  addHighlight: async (highlight) => {
    try {
      await window.electronAPI.addHighlight(highlight)
      await get().loadHighlights(highlight.book_id)
    } catch (e) {
      console.error('Failed to add highlight:', e)
    }
  },

  removeHighlight: async (id: number) => {
    try {
      await window.electronAPI.deleteHighlight(id)
      set({ highlights: get().highlights.filter((h) => h.id !== id) })
    } catch (e) {
      console.error('Failed to remove highlight:', e)
    }
  },

  loadNotes: async (bookId: number) => {
    try {
      const notes = await window.electronAPI.getNotes(bookId)
      set({ notes: notes as Note[] })
    } catch (e) {
      console.error('Failed to load notes:', e)
    }
  },

  addNote: async (note) => {
    try {
      await window.electronAPI.addNote(note)
      await get().loadNotes(note.book_id)
    } catch (e) {
      console.error('Failed to add note:', e)
    }
  },

  updateNote: async (id: number, content: string) => {
    try {
      await window.electronAPI.updateNote(id, content)
      set({
        notes: get().notes.map((n) =>
          n.id === id ? { ...n, content, updated_at: new Date().toISOString() } : n
        ),
      })
    } catch (e) {
      console.error('Failed to update note:', e)
    }
  },

  removeNote: async (id: number) => {
    try {
      await window.electronAPI.deleteNote(id)
      set({ notes: get().notes.filter((n) => n.id !== id) })
    } catch (e) {
      console.error('Failed to remove note:', e)
    }
  },

  setSidebarTab: (sidebarTab) => set({ sidebarTab, showSidebar: true }),
  toggleSidebar: () => set({ showSidebar: !get().showSidebar }),
  setShowControls: (showControls) => set({ showControls }),
  setTableOfContents: (tableOfContents) => set({ tableOfContents }),
}))
