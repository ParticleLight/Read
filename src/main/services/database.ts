import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

interface Book {
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

interface ReadingProgress {
  book_id: number
  progress: number
  cfi?: string
  page?: number
  scroll_position: number
  updated_at: string
}

interface Bookmark {
  id: number
  book_id: number
  cfi?: string
  page?: number
  progress?: number
  title?: string
  note?: string
  created_at: string
}

interface Highlight {
  id: number
  book_id: number
  cfi?: string
  page?: number
  text: string
  color: string
  note?: string
  created_at: string
}

interface Note {
  id: number
  book_id: number
  highlight_id?: number
  cfi?: string
  page?: number
  content: string
  created_at: string
  updated_at: string
}

interface Bookshelf {
  id: number
  name: string
  created_at: string
}

interface BookshelfBook {
  id: number
  shelf_id: number
  book_id: number
  added_at: string
}

interface ReadingSession {
  id: number
  book_id: number
  started_at: string
  ended_at?: string
  duration_seconds: number
}

interface SearchBookRules {
  bookList: string
  name: string
  author: string
  bookUrl: string
  coverUrl?: string
  lastChapter?: string
  intro?: string
}

interface BookInfoRules {
  name?: string
  author?: string
  coverUrl?: string
  intro?: string
  tocUrl?: string
}

interface TocRules {
  chapterList: string
  chapterName: string
  chapterUrl: string
}

interface ContentRules {
  content: string
  title?: string
  nextContentUrl?: string
}

interface BookSource {
  id: number
  bookSourceName: string
  bookSourceUrl: string
  bookSourceType: number
  enabled: boolean
  searchUrl: string
  ruleSearch: SearchBookRules
  ruleBookInfo: BookInfoRules
  ruleToc: TocRules
  ruleContent: ContentRules
  lastUsed?: string
  added_at: string
}

interface DBData {
  books: Book[]
  reading_progress: ReadingProgress[]
  bookmarks: Bookmark[]
  highlights: Highlight[]
  notes: Note[]
  bookshelves: Bookshelf[]
  bookshelf_books: BookshelfBook[]
  reading_sessions: ReadingSession[]
  book_sources: BookSource[]
  settings: Record<string, any>
  book_settings: Record<number, Record<string, any>>
  nextId: number
}

const defaultData: DBData = {
  books: [],
  reading_progress: [],
  bookmarks: [],
  highlights: [],
  notes: [],
  bookshelves: [],
  bookshelf_books: [],
  reading_sessions: [],
  book_sources: [],
  settings: {},
  book_settings: {},
  nextId: 1,
}

export class DatabaseService {
  private db: Low<DBData>
  private writeTimer: ReturnType<typeof setTimeout> | null = null
  private ready: Promise<void>

  constructor() {
    const dbDir = join(app.getPath('userData'), 'data')
    if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })
    const dbPath = join(dbDir, 'reader.json')

    const adapter = new JSONFile<DBData>(dbPath)
    this.db = new Low<DBData>(adapter, defaultData)
    this.ready = this.db.read().then(() => {
      // Initialize missing fields for older database files
      if (!this.db.data.bookshelves) this.db.data.bookshelves = []
      if (!this.db.data.bookshelf_books) this.db.data.bookshelf_books = []
      if (!this.db.data.reading_sessions) this.db.data.reading_sessions = []
      if (!this.db.data.book_settings) this.db.data.book_settings = {}
      if (!this.db.data.book_sources) this.db.data.book_sources = []
      this.cleanupOldSessions()
      return this.db.write()
    })
  }

  async ensureReady(): Promise<void> {
    await this.ready
  }

  private scheduleWrite(): void {
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(async () => {
      this.writeTimer = null
      await this.db.write()
    }, 300)
  }

  flushWrite(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      this.writeTimer = null
    }
    this.db.write()
  }

  private cleanupOldSessions(): void {
    if (!this.db.data.reading_sessions) return
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    this.db.data.reading_sessions = this.db.data.reading_sessions.filter((s) => {
      if (s.ended_at) {
        return new Date(s.ended_at).getTime() > cutoff
      }
      return true // keep active sessions
    })
  }

  private getNextId(): number {
    const id = this.db.data.nextId
    this.db.data.nextId++
    return id
  }

  // Books
  getBooks(): Book[] {
    return this.db.data.books.sort((a, b) => {
      const aTime = a.last_opened || a.added_at
      const bTime = b.last_opened || b.added_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }

  getBook(id: number): Book | undefined {
    return this.db.data.books.find((b) => b.id === id)
  }

  getBookByPath(filePath: string): Book | undefined {
    return this.db.data.books.find((b) => b.file_path === filePath)
  }

  insertBook(book: Omit<Book, 'id' | 'added_at'>): Book {
    const newBook: Book = {
      ...book,
      id: this.getNextId(),
      added_at: new Date().toISOString(),
    }
    this.db.data.books.push(newBook)
    this.scheduleWrite()
    return newBook
  }

  updateBookLastOpened(id: number): void {
    const book = this.db.data.books.find((b) => b.id === id)
    if (book) {
      book.last_opened = new Date().toISOString()
      this.scheduleWrite()
    }
  }

  deleteBook(id: number): void {
    this.db.data.books = this.db.data.books.filter((b) => b.id !== id)
    this.db.data.reading_progress = this.db.data.reading_progress.filter((p) => p.book_id !== id)
    this.db.data.bookmarks = this.db.data.bookmarks.filter((b) => b.book_id !== id)
    this.db.data.highlights = this.db.data.highlights.filter((h) => h.book_id !== id)
    this.db.data.notes = this.db.data.notes.filter((n) => n.book_id !== id)
    this.db.data.reading_sessions = this.db.data.reading_sessions.filter((s) => s.book_id !== id)
    this.scheduleWrite()
  }

  // Reading Sessions
  startReadingSession(bookId: number): number {
    const session: ReadingSession = {
      id: this.getNextId(),
      book_id: bookId,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
    }
    this.db.data.reading_sessions.push(session)
    this.scheduleWrite()
    return session.id
  }

  endReadingSession(sessionId: number): void {
    const session = this.db.data.reading_sessions.find((s) => s.id === sessionId)
    if (session && !session.ended_at) {
      session.ended_at = new Date().toISOString()
      const started = new Date(session.started_at).getTime()
      const ended = new Date(session.ended_at).getTime()
      session.duration_seconds = Math.floor((ended - started) / 1000)
      this.scheduleWrite()
    }
  }

  updateReadingSessionDuration(sessionId: number, durationSeconds: number): void {
    const session = this.db.data.reading_sessions.find((s) => s.id === sessionId)
    if (session) {
      session.duration_seconds = durationSeconds
      this.scheduleWrite()
    }
  }

  getReadingTimeForBook(bookId: number): number {
    if (!this.db.data.reading_sessions) return 0
    return this.db.data.reading_sessions
      .filter((s) => s.book_id === bookId)
      .reduce((total, s) => total + s.duration_seconds, 0)
  }

  getReadingTimeForAllBooks(): Record<number, number> {
    if (!this.db.data.reading_sessions) return {}
    const result: Record<number, number> = {}
    for (const session of this.db.data.reading_sessions) {
      if (!result[session.book_id]) result[session.book_id] = 0
      result[session.book_id] += session.duration_seconds
    }
    return result
  }

  getAllReadingProgress(): Record<number, ReadingProgress> {
    const map: Record<number, ReadingProgress> = {}
    for (const p of this.db.data.reading_progress) {
      map[p.book_id] = p
    }
    return map
  }

  // Reading Progress
  getReadingProgress(bookId: number): ReadingProgress | undefined {
    return this.db.data.reading_progress.find((p) => p.book_id === bookId)
  }

  upsertReadingProgress(bookId: number, progress: Omit<ReadingProgress, 'book_id' | 'updated_at'>): void {
    const existing = this.db.data.reading_progress.find((p) => p.book_id === bookId)
    if (existing) {
      existing.progress = progress.progress
      existing.cfi = progress.cfi
      existing.page = progress.page
      existing.scroll_position = progress.scroll_position
      existing.updated_at = new Date().toISOString()
    } else {
      this.db.data.reading_progress.push({
        book_id: bookId,
        ...progress,
        updated_at: new Date().toISOString(),
      })
    }
    this.scheduleWrite()
  }

  // Bookmarks
  getBookmarks(bookId: number): Bookmark[] {
    return this.db.data.bookmarks
      .filter((b) => b.book_id === bookId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  addBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at'>): Bookmark {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: this.getNextId(),
      created_at: new Date().toISOString(),
    }
    this.db.data.bookmarks.push(newBookmark)
    this.scheduleWrite()
    return newBookmark
  }

  deleteBookmark(id: number): void {
    this.db.data.bookmarks = this.db.data.bookmarks.filter((b) => b.id !== id)
    this.scheduleWrite()
  }

  updateBookmarkTitle(id: number, title: string): void {
    const bookmark = this.db.data.bookmarks.find((b) => b.id === id)
    if (bookmark) {
      bookmark.title = title
      this.scheduleWrite()
    }
  }

  // Highlights
  getHighlights(bookId: number): Highlight[] {
    return this.db.data.highlights
      .filter((h) => h.book_id === bookId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  addHighlight(highlight: Omit<Highlight, 'id' | 'created_at'>): Highlight {
    const newHighlight: Highlight = {
      ...highlight,
      id: this.getNextId(),
      created_at: new Date().toISOString(),
    }
    this.db.data.highlights.push(newHighlight)
    this.scheduleWrite()
    return newHighlight
  }

  deleteHighlight(id: number): void {
    this.db.data.highlights = this.db.data.highlights.filter((h) => h.id !== id)
    this.scheduleWrite()
  }

  // Notes
  getNotes(bookId: number): Note[] {
    return this.db.data.notes
      .filter((n) => n.book_id === bookId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  addNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Note {
    const newNote: Note = {
      ...note,
      id: this.getNextId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.db.data.notes.push(newNote)
    this.scheduleWrite()
    return newNote
  }

  updateNote(id: number, content: string): void {
    const note = this.db.data.notes.find((n) => n.id === id)
    if (note) {
      note.content = content
      note.updated_at = new Date().toISOString()
      this.scheduleWrite()
    }
  }

  deleteNote(id: number): void {
    this.db.data.notes = this.db.data.notes.filter((n) => n.id !== id)
    this.scheduleWrite()
  }

  // Bookshelves
  getBookshelves(): Bookshelf[] {
    if (!this.db.data.bookshelves) this.db.data.bookshelves = []
    return this.db.data.bookshelves.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  addBookshelf(name: string): Bookshelf {
    if (!this.db.data.bookshelves) this.db.data.bookshelves = []
    const newShelf: Bookshelf = {
      id: this.getNextId(),
      name,
      created_at: new Date().toISOString(),
    }
    this.db.data.bookshelves.push(newShelf)
    this.scheduleWrite()
    return newShelf
  }

  deleteBookshelf(id: number): void {
    if (this.db.data.bookshelves) this.db.data.bookshelves = this.db.data.bookshelves.filter((s) => s.id !== id)
    if (this.db.data.bookshelf_books) this.db.data.bookshelf_books = this.db.data.bookshelf_books.filter((sb) => sb.shelf_id !== id)
    this.scheduleWrite()
  }

  renameBookshelf(id: number, name: string): void {
    if (!this.db.data.bookshelves) this.db.data.bookshelves = []
    const shelf = this.db.data.bookshelves.find((s) => s.id === id)
    if (shelf) {
      shelf.name = name
      this.scheduleWrite()
    }
  }

  getBooksInShelf(shelfId: number): number[] {
    if (!this.db.data.bookshelf_books) this.db.data.bookshelf_books = []
    return this.db.data.bookshelf_books
      .filter((sb) => sb.shelf_id === shelfId)
      .map((sb) => sb.book_id)
  }

  addBookToShelf(shelfId: number, bookId: number): void {
    if (!this.db.data.bookshelf_books) this.db.data.bookshelf_books = []
    const exists = this.db.data.bookshelf_books.some((sb) => sb.shelf_id === shelfId && sb.book_id === bookId)
    if (!exists) {
      this.db.data.bookshelf_books.push({
        id: this.getNextId(),
        shelf_id: shelfId,
        book_id: bookId,
        added_at: new Date().toISOString(),
      })
      this.scheduleWrite()
    }
  }

  removeBookFromShelf(shelfId: number, bookId: number): void {
    if (!this.db.data.bookshelf_books) this.db.data.bookshelf_books = []
    this.db.data.bookshelf_books = this.db.data.bookshelf_books.filter(
      (sb) => !(sb.shelf_id === shelfId && sb.book_id === bookId)
    )
    this.scheduleWrite()
  }

  getShelvesForBook(bookId: number): number[] {
    if (!this.db.data.bookshelf_books) this.db.data.bookshelf_books = []
    return this.db.data.bookshelf_books
      .filter((sb) => sb.book_id === bookId)
      .map((sb) => sb.shelf_id)
  }

  // Book Sources
  getBookSources(): BookSource[] {
    if (!this.db.data.book_sources) this.db.data.book_sources = []
    return this.db.data.book_sources.sort((a, b) =>
      new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    )
  }

  getBookSource(id: number): BookSource | undefined {
    return this.db.data.book_sources?.find((s) => s.id === id)
  }

  insertBookSource(source: Omit<BookSource, 'id' | 'added_at'>): BookSource {
    if (!this.db.data.book_sources) this.db.data.book_sources = []
    const newSource: BookSource = {
      ...source,
      id: this.getNextId(),
      added_at: new Date().toISOString(),
    }
    this.db.data.book_sources.push(newSource)
    this.scheduleWrite()
    return newSource
  }

  updateBookSource(id: number, updates: Partial<BookSource>): void {
    const source = this.db.data.book_sources?.find((s) => s.id === id)
    if (source) {
      Object.assign(source, updates)
      this.scheduleWrite()
    }
  }

  deleteBookSource(id: number): void {
    if (!this.db.data.book_sources) return
    this.db.data.book_sources = this.db.data.book_sources.filter((s) => s.id !== id)
    this.scheduleWrite()
  }

  toggleBookSource(id: number): void {
    const source = this.db.data.book_sources?.find((s) => s.id === id)
    if (source) {
      source.enabled = !source.enabled
      this.scheduleWrite()
    }
  }

  importBookSources(sources: Omit<BookSource, 'id' | 'added_at'>[]): number {
    if (!this.db.data.book_sources) this.db.data.book_sources = []
    let imported = 0
    for (const source of sources) {
      const exists = this.db.data.book_sources.some((s) => s.bookSourceUrl === source.bookSourceUrl)
      if (exists) continue
      this.db.data.book_sources.push({
        ...source,
        id: this.getNextId(),
        added_at: new Date().toISOString(),
      })
      imported++
    }
    this.scheduleWrite()
    return imported
  }

  updateBookSourceLastUsed(id: number): void {
    const source = this.db.data.book_sources?.find((s) => s.id === id)
    if (source) {
      source.lastUsed = new Date().toISOString()
      this.scheduleWrite()
    }
  }

  clearAllBookSources(): void {
    this.db.data.book_sources = []
    this.scheduleWrite()
  }

  // Settings
  getSettings(): Record<string, any> {
    return this.db.data.settings
  }

  updateSettings(settings: Record<string, any>): void {
    this.db.data.settings = { ...this.db.data.settings, ...settings }
    this.scheduleWrite()
  }

  // Per-book settings
  getBookSettings(bookId: number): Record<string, any> | undefined {
    if (!this.db.data.book_settings) this.db.data.book_settings = {}
    return this.db.data.book_settings[bookId]
  }

  updateBookSettings(bookId: number, settings: Record<string, any>): void {
    if (!this.db.data.book_settings) this.db.data.book_settings = {}
    this.db.data.book_settings[bookId] = { ...this.db.data.book_settings[bookId], ...settings }
    this.scheduleWrite()
  }

  deleteBookSettings(bookId: number): void {
    if (!this.db.data.book_settings) this.db.data.book_settings = {}
    delete this.db.data.book_settings[bookId]
    this.scheduleWrite()
  }

  close() {
    this.flushWrite()
  }
}
