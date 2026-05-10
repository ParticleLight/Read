import { ipcMain } from 'electron'
import { UpdaterService } from '../services/updater'

export function registerUpdaterHandlers(updater: UpdaterService) {
  ipcMain.handle('app:checkUpdate', async () => {
    await updater.checkForUpdates()
  })

  ipcMain.handle('app:getVersion', () => {
    return updater.getCurrentVersion()
  })

  ipcMain.handle('app:downloadUpdate', () => {
    updater.downloadUpdate()
  })

  ipcMain.handle('app:quitAndInstall', () => {
    updater.quitAndInstall()
  })
}
