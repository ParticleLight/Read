import { ipcMain, BrowserWindow, Menu, MenuItem } from 'electron'
import { ZLibraryService } from '../services/zlibrary'

export function registerZlibHandlers(zlibService: ZLibraryService, mainWindow: BrowserWindow) {
  ipcMain.handle('zlib:show', async () => {
    try { await zlibService.show(mainWindow) } catch {}
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

  ipcMain.handle('zlib:switchMirror', (_event, index: number) => {
    try { zlibService.switchMirror(index) } catch {}
  })

  ipcMain.handle('zlib:getMirrorInfo', () => {
    try { return zlibService.getMirrorInfo() } catch { return { index: 0, url: '', mirrors: [] } }
  })

  ipcMain.handle('zlib:showMirrorMenu', () => {
    try {
      const info = zlibService.getMirrorInfo()
      const menu = new Menu()
      info.mirrors.forEach((url, i) => {
        menu.append(new MenuItem({
          label: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          type: 'radio',
          checked: i === info.index,
          click: () => zlibService.switchMirror(i),
        }))
      })
      menu.popup({ window: mainWindow })
    } catch {}
  })
}
