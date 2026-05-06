interface ElectronAPI {
  openFile: () => Promise<string | null>
  openDirectory: () => Promise<string | null>
  readFile: (filePath: string) => Promise<Buffer>
  getBookMetadata: (filePath: string) => Promise<any>
  importBooks: (filePaths: string[]) => Promise<any[]>
  getCoverImage: (bookId: number) => Promise<string | null>

  getBooks: () => Promise<any[]>
  getBook: (id: number) => Promise<any>
  deleteBook: (id: number) => Promise<void>
  updateReadingProgress: (bookId: number, progress: any) => Promise<void>
  getReadingProgress: (bookId: number) => Promise<any>

  getBookmarks: (bookId: number) => Promise<any[]>
  addBookmark: (bookmark: any) => Promise<void>
  deleteBookmark: (id: number) => Promise<void>

  getHighlights: (bookId: number) => Promise<any[]>
  addHighlight: (highlight: any) => Promise<void>
  deleteHighlight: (id: number) => Promise<void>

  getNotes: (bookId: number) => Promise<any[]>
  addNote: (note: any) => Promise<void>
  updateNote: (id: number, content: string) => Promise<void>
  deleteNote: (id: number) => Promise<void>

  getSettings: () => Promise<any>
  updateSettings: (settings: any) => Promise<void>
}

declare interface Window {
  electronAPI: ElectronAPI
}
