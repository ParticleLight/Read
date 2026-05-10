import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export class UpdaterService {
  private mainWindow: BrowserWindow | null = null

  constructor() {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('update-available', (info) => {
      this.safeSend('app:updateAvailable', info)
    })

    autoUpdater.on('update-not-available', () => {
      this.safeSend('app:updateNotAvailable')
    })

    autoUpdater.on('download-progress', (progress) => {
      this.safeSend('app:downloadProgress', progress)
    })

    autoUpdater.on('update-downloaded', () => {
      this.safeSend('app:updateDownloaded')
    })

    autoUpdater.on('error', (err) => {
      this.safeSend('app:updateError', err?.message || '更新检查失败')
    })
  }

  setWindow(win: BrowserWindow) {
    this.mainWindow = win
  }

  private safeSend(channel: string, ...args: any[]) {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(channel, ...args)
      }
    } catch {}
  }

  async checkForUpdates() {
    autoUpdater.checkForUpdates().catch(() => {})
  }

  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version
  }

  downloadUpdate() {
    autoUpdater.downloadUpdate().catch((err) => {
      this.safeSend('app:updateError', err?.message || '下载失败')
    })
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall()
  }
}
