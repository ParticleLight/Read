import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface ElectronAPI {
  // File operations
  openFile: () => Promise<string | null>
  openDirectory: () => Promise<string | null>
  readFile: (filePath: string) => Promise<Buffer>
  getBookMetadata: (filePath: string) => Promise<any>
  importBooks: (filePaths: string[]) => Promise<any[]>
  getCoverImage: (bookId: number) => Promise<string | null>

  // Database operations
  getBooks: () => Promise<any[]>
  getBook: (id: number) => Promise<any>
  deleteBook: (id: number) => Promise<void>
  updateReadingProgress: (bookId: number, progress: any) => Promise<void>
  getReadingProgress: (bookId: number) => Promise<any>

  // Bookmarks
  getBookmarks: (bookId: number) => Promise<any[]>
  addBookmark: (bookmark: any) => Promise<void>
  deleteBookmark: (id: number) => Promise<void>
  updateBookmarkTitle: (id: number, title: string) => Promise<void>

  // Highlights
  getHighlights: (bookId: number) => Promise<any[]>
  addHighlight: (highlight: any) => Promise<void>
  deleteHighlight: (id: number) => Promise<void>

  // Notes
  getNotes: (bookId: number) => Promise<any[]>
  addNote: (note: any) => Promise<void>
  updateNote: (id: number, content: string) => Promise<void>
  deleteNote: (id: number) => Promise<void>

  // Settings
  getSettings: () => Promise<any>
  updateSettings: (settings: any) => Promise<void>
  getBookSettings: (bookId: number) => Promise<any>
  updateBookSettings: (bookId: number, settings: any) => Promise<void>
  deleteBookSettings: (bookId: number) => Promise<void>

  // Bookshelves
  getBookshelves: () => Promise<any[]>
  addBookshelf: (name: string) => Promise<any>
  deleteBookshelf: (id: number) => Promise<void>
  renameBookshelf: (id: number, name: string) => Promise<void>
  getBooksInShelf: (shelfId: number) => Promise<number[]>
  addBookToShelf: (shelfId: number, bookId: number) => Promise<void>
  removeBookFromShelf: (shelfId: number, bookId: number) => Promise<void>
  getShelvesForBook: (bookId: number) => Promise<number[]>

  // Utilities
  getFilePath: (file: File) => string

  // Book Sources
  getBookSources: () => Promise<any[]>
  getBookSource: (id: number) => Promise<any>
  insertBookSource: (source: any) => Promise<any>
  updateBookSource: (id: number, updates: any) => Promise<void>
  deleteBookSource: (id: number) => Promise<void>
  toggleBookSource: (id: number) => Promise<void>
  clearAllBookSources: () => Promise<void>
  importBookSources: () => Promise<{ imported: number; total: number }>
  searchBooks: (keyword: string, page?: number) => Promise<any[]>
  searchBooksFromSource: (sourceId: number, keyword: string, page?: number) => Promise<any[]>
  getBookInfoFromSource: (sourceId: number, bookUrl: string) => Promise<any>
  getChapterListFromSource: (sourceId: number, tocUrl: string) => Promise<any[]>
  downloadBook: (sourceId: number, bookUrl: string, bookName: string, format: string) => Promise<number>
  onDownloadProgress: (callback: (progress: any) => void) => () => void

  // Reading Sessions
  startReadingSession: (bookId: number) => Promise<number>
  endReadingSession: (sessionId: number) => Promise<void>
  updateReadingSessionDuration: (sessionId: number, durationSeconds: number) => Promise<void>
  getReadingTime: (bookId: number) => Promise<number>
  getAllReadingTime: () => Promise<Record<number, number>>
  getAllReadingProgress: () => Promise<Record<number, any>>
}

const api: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getBookMetadata: (filePath) => ipcRenderer.invoke('book:metadata', filePath),
  importBooks: (filePaths) => ipcRenderer.invoke('book:import', filePaths),
  getCoverImage: (bookId) => ipcRenderer.invoke('book:cover', bookId),

  getBooks: () => ipcRenderer.invoke('db:getBooks'),
  getBook: (id) => ipcRenderer.invoke('db:getBook', id),
  deleteBook: (id) => ipcRenderer.invoke('db:deleteBook', id),
  updateReadingProgress: (bookId, progress) => ipcRenderer.invoke('db:updateProgress', bookId, progress),
  getReadingProgress: (bookId) => ipcRenderer.invoke('db:getProgress', bookId),

  getBookmarks: (bookId) => ipcRenderer.invoke('db:getBookmarks', bookId),
  addBookmark: (bookmark) => ipcRenderer.invoke('db:addBookmark', bookmark),
  deleteBookmark: (id) => ipcRenderer.invoke('db:deleteBookmark', id),
  updateBookmarkTitle: (id, title) => ipcRenderer.invoke('db:updateBookmarkTitle', id, title),

  getHighlights: (bookId) => ipcRenderer.invoke('db:getHighlights', bookId),
  addHighlight: (highlight) => ipcRenderer.invoke('db:addHighlight', highlight),
  deleteHighlight: (id) => ipcRenderer.invoke('db:deleteHighlight', id),

  getNotes: (bookId) => ipcRenderer.invoke('db:getNotes', bookId),
  addNote: (note) => ipcRenderer.invoke('db:addNote', note),
  updateNote: (id, content) => ipcRenderer.invoke('db:updateNote', id, content),
  deleteNote: (id) => ipcRenderer.invoke('db:deleteNote', id),

  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (settings) => ipcRenderer.invoke('db:updateSettings', settings),
  getBookSettings: (bookId) => ipcRenderer.invoke('db:getBookSettings', bookId),
  updateBookSettings: (bookId, settings) => ipcRenderer.invoke('db:updateBookSettings', bookId, settings),
  deleteBookSettings: (bookId) => ipcRenderer.invoke('db:deleteBookSettings', bookId),

  getBookshelves: () => ipcRenderer.invoke('db:getBookshelves'),
  addBookshelf: (name) => ipcRenderer.invoke('db:addBookshelf', name),
  deleteBookshelf: (id) => ipcRenderer.invoke('db:deleteBookshelf', id),
  renameBookshelf: (id, name) => ipcRenderer.invoke('db:renameBookshelf', id, name),
  getBooksInShelf: (shelfId) => ipcRenderer.invoke('db:getBooksInShelf', shelfId),
  addBookToShelf: (shelfId, bookId) => ipcRenderer.invoke('db:addBookToShelf', shelfId, bookId),
  removeBookFromShelf: (shelfId, bookId) => ipcRenderer.invoke('db:removeBookFromShelf', shelfId, bookId),
  getShelvesForBook: (bookId) => ipcRenderer.invoke('db:getShelvesForBook', bookId),

  getFilePath: (file) => webUtils.getPathForFile(file),

  getBookSources: () => ipcRenderer.invoke('bookSource:getAll'),
  getBookSource: (id) => ipcRenderer.invoke('bookSource:get', id),
  insertBookSource: (source) => ipcRenderer.invoke('bookSource:insert', source),
  updateBookSource: (id, updates) => ipcRenderer.invoke('bookSource:update', id, updates),
  deleteBookSource: (id) => ipcRenderer.invoke('bookSource:delete', id),
  toggleBookSource: (id) => ipcRenderer.invoke('bookSource:toggle', id),
  clearAllBookSources: () => ipcRenderer.invoke('bookSource:clearAll'),
  importBookSources: () => ipcRenderer.invoke('bookSource:importFile'),
  searchBooks: (keyword, page) => ipcRenderer.invoke('bookSource:search', keyword, page),
  searchBooksFromSource: (sourceId, keyword, page) => ipcRenderer.invoke('bookSource:searchOne', sourceId, keyword, page),
  getBookInfoFromSource: (sourceId, bookUrl) => ipcRenderer.invoke('bookSource:getBookInfo', sourceId, bookUrl),
  getChapterListFromSource: (sourceId, tocUrl) => ipcRenderer.invoke('bookSource:getChapterList', sourceId, tocUrl),
  downloadBook: (sourceId, bookUrl, bookName, format) => ipcRenderer.invoke('bookSource:download', sourceId, bookUrl, bookName, format),
  onDownloadProgress: (callback) => {
    const handler = (_event: any, progress: any) => callback(progress)
    ipcRenderer.on('bookSource:downloadProgress', handler)
    return () => ipcRenderer.removeListener('bookSource:downloadProgress', handler)
  },

  startReadingSession: (bookId) => ipcRenderer.invoke('db:startReadingSession', bookId),
  endReadingSession: (sessionId) => ipcRenderer.invoke('db:endReadingSession', sessionId),
  updateReadingSessionDuration: (sessionId, durationSeconds) => ipcRenderer.invoke('db:updateReadingSessionDuration', sessionId, durationSeconds),
  getReadingTime: (bookId) => ipcRenderer.invoke('db:getReadingTime', bookId),
  getAllReadingTime: () => ipcRenderer.invoke('db:getAllReadingTime'),
  getAllReadingProgress: () => ipcRenderer.invoke('db:getAllReadingProgress'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
