import { ipcMain, BrowserWindow } from 'electron'
import { ZLibraryService } from '../services/zlibrary'

export function registerZlibHandlers(zlibService: ZLibraryService, mainWindow: BrowserWindow) {
  ipcMain.handle('zlib:show', () => {
    try { zlibService.show(mainWindow) } catch {}
  })

  ipcMain.handle('zlib:hide', () => {
    try { zlibService.hide(mainWindow) } catch {}
  })

  ipcMain.handle('zlib:navigate', (_event, action: 'back' | 'forward' | 'reload') => {
    try {
      switch (action) {
        case 'back': zlibService.goBack(); break
        case 'forward': zlibService.goForward(); break
        case 'reload': zlibService.reload(); break
      }
    } catch {}
  })

  ipcMain.handle('zlib:getURL', () => {
    try { return zlibService.getURL() } catch { return '' }
  })

  ipcMain.handle('zlib:setBounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    try { zlibService.setBounds(bounds) } catch {}
  })

  ipcMain.handle('zlib:logout', async () => {
    try { await zlibService.logout() } catch {}
  })
}
