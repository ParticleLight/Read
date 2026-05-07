import { ipcMain } from 'electron'
import { DatabaseService } from '../services/database'

export function registerDbHandlers(db: DatabaseService) {
  // Books
  ipcMain.handle('db:getBooks', () => db.getBooks())
  ipcMain.handle('db:getBook', (_e, id: number) => db.getBook(id))
  ipcMain.handle('db:deleteBook', (_e, id: number) => db.deleteBook(id))

  // Reading Progress
  ipcMain.handle('db:getProgress', (_e, bookId: number) => db.getReadingProgress(bookId))
  ipcMain.handle('db:updateProgress', (_e, bookId: number, progress: any) => {
    db.upsertReadingProgress(bookId, progress)
    db.updateBookLastOpened(bookId)
  })

  // Bookmarks
  ipcMain.handle('db:getBookmarks', (_e, bookId: number) => db.getBookmarks(bookId))
  ipcMain.handle('db:addBookmark', (_e, bookmark: any) => db.addBookmark(bookmark))
  ipcMain.handle('db:deleteBookmark', (_e, id: number) => db.deleteBookmark(id))
  ipcMain.handle('db:updateBookmarkTitle', (_e, id: number, title: string) => {
    console.log('IPC updateBookmarkTitle called:', { id, title })
    const result = db.updateBookmarkTitle(id, title)
    console.log('IPC updateBookmarkTitle result:', result)
    return result
  })

  // Highlights
  ipcMain.handle('db:getHighlights', (_e, bookId: number) => db.getHighlights(bookId))
  ipcMain.handle('db:addHighlight', (_e, highlight: any) => db.addHighlight(highlight))
  ipcMain.handle('db:deleteHighlight', (_e, id: number) => db.deleteHighlight(id))

  // Notes
  ipcMain.handle('db:getNotes', (_e, bookId: number) => db.getNotes(bookId))
  ipcMain.handle('db:addNote', (_e, note: any) => db.addNote(note))
  ipcMain.handle('db:updateNote', (_e, id: number, content: string) => db.updateNote(id, content))
  ipcMain.handle('db:deleteNote', (_e, id: number) => db.deleteNote(id))

  // Bookshelves
  ipcMain.handle('db:getBookshelves', () => db.getBookshelves())
  ipcMain.handle('db:addBookshelf', (_e, name: string) => db.addBookshelf(name))
  ipcMain.handle('db:deleteBookshelf', (_e, id: number) => db.deleteBookshelf(id))
  ipcMain.handle('db:renameBookshelf', (_e, id: number, name: string) => db.renameBookshelf(id, name))
  ipcMain.handle('db:getBooksInShelf', (_e, shelfId: number) => db.getBooksInShelf(shelfId))
  ipcMain.handle('db:addBookToShelf', (_e, shelfId: number, bookId: number) => db.addBookToShelf(shelfId, bookId))
  ipcMain.handle('db:removeBookFromShelf', (_e, shelfId: number, bookId: number) => db.removeBookFromShelf(shelfId, bookId))
  ipcMain.handle('db:getShelvesForBook', (_e, bookId: number) => db.getShelvesForBook(bookId))

  // Reading Sessions
  ipcMain.handle('db:startReadingSession', (_e, bookId: number) => db.startReadingSession(bookId))
  ipcMain.handle('db:endReadingSession', (_e, sessionId: number) => db.endReadingSession(sessionId))
  ipcMain.handle('db:updateReadingSessionDuration', (_e, sessionId: number, durationSeconds: number) => db.updateReadingSessionDuration(sessionId, durationSeconds))
  ipcMain.handle('db:getReadingTime', (_e, bookId: number) => db.getReadingTimeForBook(bookId))
  ipcMain.handle('db:getAllReadingTime', () => db.getReadingTimeForAllBooks())
  ipcMain.handle('db:getAllReadingProgress', () => db.getAllReadingProgress())

  // Settings
  ipcMain.handle('db:getSettings', () => db.getSettings())
  ipcMain.handle('db:updateSettings', (_e, settings: any) => db.updateSettings(settings))

  // Per-book settings
  ipcMain.handle('db:getBookSettings', (_e, bookId: number) => db.getBookSettings(bookId))
  ipcMain.handle('db:updateBookSettings', (_e, bookId: number, settings: any) => db.updateBookSettings(bookId, settings))
  ipcMain.handle('db:deleteBookSettings', (_e, bookId: number) => db.deleteBookSettings(bookId))
}
