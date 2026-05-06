import { ipcMain } from 'electron'
import { DatabaseService } from '../services/database'

export function registerDbHandlers(db: DatabaseService) {
  // Books
  ipcMain.handle('db:getBooks', () => db.getBooks())
  ipcMain.handle('db:getBook', (_e, id: number) => db.getBook(id))
  ipcMain.handle('db:deleteBook', (_e, id: number) => db.deleteBook(id))

  // Reading Progress
  ipcMain.handle('db:getProgress', (_e, bookId: number) => db.getReadingProgress(bookId))
  ipcMain.handle('db:updateProgress', (_e, bookId: number, progress: any) => db.upsertReadingProgress(bookId, progress))

  // Bookmarks
  ipcMain.handle('db:getBookmarks', (_e, bookId: number) => db.getBookmarks(bookId))
  ipcMain.handle('db:addBookmark', (_e, bookmark: any) => db.addBookmark(bookmark))
  ipcMain.handle('db:deleteBookmark', (_e, id: number) => db.deleteBookmark(id))

  // Highlights
  ipcMain.handle('db:getHighlights', (_e, bookId: number) => db.getHighlights(bookId))
  ipcMain.handle('db:addHighlight', (_e, highlight: any) => db.addHighlight(highlight))
  ipcMain.handle('db:deleteHighlight', (_e, id: number) => db.deleteHighlight(id))

  // Notes
  ipcMain.handle('db:getNotes', (_e, bookId: number) => db.getNotes(bookId))
  ipcMain.handle('db:addNote', (_e, note: any) => db.addNote(note))
  ipcMain.handle('db:updateNote', (_e, id: number, content: string) => db.updateNote(id, content))
  ipcMain.handle('db:deleteNote', (_e, id: number) => db.deleteNote(id))

  // Settings
  ipcMain.handle('db:getSettings', () => db.getSettings())
  ipcMain.handle('db:updateSettings', (_e, settings: any) => db.updateSettings(settings))
}
