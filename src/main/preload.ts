import { contextBridge, ipcRenderer } from 'electron'

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

  getHighlights: (bookId) => ipcRenderer.invoke('db:getHighlights', bookId),
  addHighlight: (highlight) => ipcRenderer.invoke('db:addHighlight', highlight),
  deleteHighlight: (id) => ipcRenderer.invoke('db:deleteHighlight', id),

  getNotes: (bookId) => ipcRenderer.invoke('db:getNotes', bookId),
  addNote: (note) => ipcRenderer.invoke('db:addNote', note),
  updateNote: (id, content) => ipcRenderer.invoke('db:updateNote', id, content),
  deleteNote: (id) => ipcRenderer.invoke('db:deleteNote', id),

  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (settings) => ipcRenderer.invoke('db:updateSettings', settings),
}

contextBridge.exposeInMainWorld('electronAPI', api)
