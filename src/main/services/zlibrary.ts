import { app, BrowserWindow, WebContentsView, session, DownloadItem } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { LibraryService } from './library'

const DEFAULT_URL = 'https://zh.zzz101.ru/'

export class ZLibraryService {
  private view: WebContentsView | null = null
  private mainWindow: BrowserWindow | null = null
  private zlibSession: Electron.Session
  private library: LibraryService

  constructor(library: LibraryService) {
    this.library = library
    this.zlibSession = session.fromPartition('persist:zlibrary', { cache: true })

    this.zlibSession.on('will-download', (_event, item) => {
      this.handleDownload(item)
    })
  }

  private safeSend(channel: string, ...args: any[]) {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed() && !this.mainWindow.webContents.isDestroyed()) {
        this.mainWindow.webContents.send(channel, ...args)
      }
    } catch {}
  }

  show(mainWindow: BrowserWindow) {
    if (this.view) {
      this.hide(mainWindow)
    }

    this.mainWindow = mainWindow

    this.view = new WebContentsView({
      webPreferences: {
        session: this.zlibSession,
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    // Set initial bounds to full window before adding to view
    const [width, height] = mainWindow.getContentSize()
    this.view.setBounds({ x: 0, y: 40, width, height: height - 40 })

    mainWindow.contentView.addChildView(this.view)

    this.view.webContents.on('did-finish-load', () => {
      try {
        const url = this.view?.webContents.getURL()
        if (url) this.safeSend('zlib:urlChanged', url)
      } catch {}
    })

    this.view.webContents.on('did-navigate', (_event, url) => {
      this.safeSend('zlib:urlChanged', url)
    })

    this.view.webContents.on('did-navigate-in-page', (_event, url) => {
      this.safeSend('zlib:urlChanged', url)
    })

    this.view.webContents.on('page-title-updated', (_event, title) => {
      this.safeSend('zlib:titleChanged', title)
    })

    this.view.webContents.on('did-fail-load', (_event, errorCode, errorDesc) => {
      this.safeSend('zlib:urlChanged', `加载失败: ${errorDesc} (${errorCode})`)
    })

    this.view.webContents.loadURL(DEFAULT_URL).catch(() => {})
  }

  hide(mainWindow: BrowserWindow) {
    if (this.view) {
      try {
        mainWindow.contentView.removeChildView(this.view)
      } catch {}
      try {
        this.view.webContents.close()
      } catch {}
      this.view = null
    }
  }

  goBack() {
    try {
      if (this.view && !this.view.webContents.isDestroyed() && this.view.webContents.canGoBack()) {
        this.view.webContents.goBack()
      }
    } catch {}
  }

  goForward() {
    try {
      if (this.view && !this.view.webContents.isDestroyed() && this.view.webContents.canGoForward()) {
        this.view.webContents.goForward()
      }
    } catch {}
  }

  reload() {
    try {
      if (this.view && !this.view.webContents.isDestroyed()) {
        this.view.webContents.reload()
      }
    } catch {}
  }

  getURL(): string {
    try {
      if (this.view && !this.view.webContents.isDestroyed()) {
        return this.view.webContents.getURL()
      }
    } catch {}
    return ''
  }

  setBounds(bounds: { x: number; y: number; width: number; height: number }) {
    if (this.view) {
      try {
        this.view.setBounds(bounds)
      } catch {}
    }
  }

  async logout() {
    await this.zlibSession.clearStorageData()
    await this.zlibSession.clearCache()
    if (this.view && !this.view.webContents.isDestroyed()) {
      this.view.webContents.loadURL(DEFAULT_URL).catch(() => {})
    }
  }

  private async handleDownload(item: DownloadItem) {
    const fileName = item.getFilename()
    const downloadDir = join(app.getPath('downloads'), 'ParticleBook')
    mkdirSync(downloadDir, { recursive: true })
    const savePath = join(downloadDir, fileName)

    item.setSavePath(savePath)

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        this.safeSend('zlib:downloadProgress', {
          received: item.getReceivedBytes(),
          total: item.getTotalBytes(),
          fileName,
        })
      }
    })

    item.once('done', async (_event, state) => {
      if (state === 'completed') {
        this.safeSend('zlib:downloadComplete', { fileName, path: savePath })
        try {
          await this.library.importBook(savePath)
          this.safeSend('zlib:importComplete', { fileName })
        } catch (e: any) {
          this.safeSend('zlib:importError', { fileName, error: e?.message })
        }
      } else {
        this.safeSend('zlib:downloadError', { fileName, state })
      }
    })
  }
}
