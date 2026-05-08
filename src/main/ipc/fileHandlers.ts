import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { LibraryService } from '../services/library'

export function registerFileHandlers(library: LibraryService) {
  ipcMain.handle('dialog:openFile', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'E-Books', extensions: ['epub', 'pdf', 'mobi', 'txt', 'fb2', 'cbz', 'cbr', 'html', 'htm', 'md', 'markdown'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const buf = readFileSync(filePath)
      return new Uint8Array(buf)
    } catch {
      return null
    }
  })

  ipcMain.handle('book:metadata', async (_event, filePath: string) => {
    try {
      return await library.importBook(filePath)
    } catch (e: any) {
      console.error('book:metadata failed:', e?.message)
      return null
    }
  })

  ipcMain.handle('book:import', async (_event, filePaths: string[]) => {
    try {
      return await library.importBooks(filePaths)
    } catch (e: any) {
      console.error('book:import failed:', e?.message)
      return []
    }
  })

  ipcMain.handle('book:cover', async (_event, bookId: number) => {
    try {
      return await library.getCoverImage(bookId)
    } catch {
      return null
    }
  })
}
