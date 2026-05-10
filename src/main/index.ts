import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { DatabaseService } from './services/database'
import { LibraryService } from './services/library'
import { BookSourceService } from './services/bookSource'
import { ZLibraryService } from './services/zlibrary'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerDbHandlers } from './ipc/dbHandlers'
import { registerBookSourceHandlers } from './ipc/bookSourceHandlers'
import { registerZlibHandlers } from './ipc/zlibHandlers'
import { UpdaterService } from './services/updater'
import { registerUpdaterHandlers } from './ipc/updaterHandlers'

let mainWindow: BrowserWindow | null = null
let db: DatabaseService
let library: LibraryService
let bookSourceService: BookSourceService
let zlibService: ZLibraryService
let updaterService: UpdaterService

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#1a1a2e',
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    console.log('Loading URL:', process.env.ELECTRON_RENDERER_URL)
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    console.log('Loading file:', htmlPath)
    mainWindow.loadFile(htmlPath)
  }

  mainWindow.webContents.on('did-finish-load', () => {})

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  db = new DatabaseService()
  await db.ensureReady()
  library = new LibraryService(db)

  const userDataPath = app.getPath('userData')
  protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    const { resolve } = require('path')
    const normalizedPath = resolve(filePath)
    if (!normalizedPath.startsWith(userDataPath)) {
      callback({ error: -6 })
      return
    }
    callback({ path: normalizedPath })
  })

  registerFileHandlers(library)
  registerDbHandlers(db)

  bookSourceService = new BookSourceService(db, library)
  registerBookSourceHandlers(db, bookSourceService)

  zlibService = new ZLibraryService(library)

  createWindow()

  registerZlibHandlers(zlibService, mainWindow!)

  updaterService = new UpdaterService()
  updaterService.setWindow(mainWindow!)
  registerUpdaterHandlers(updaterService)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') app.quit()
})

// Suppress EPIPE from broken pipes (VS Code / npm terminal)
function isEpipe(e: any): boolean {
  return e?.code === 'EPIPE' || (typeof e?.message === 'string' && e.message.includes('EPIPE'))
}

const _origLog = console.log
const _origError = console.error
const _origWarn = console.warn
const noop = () => {}
function safeLog(fn: Function) {
  return (...args: any[]) => { try { return fn(...args) } catch (e: any) { if (!isEpipe(e)) throw e } }
}
console.log = safeLog(_origLog) as any
console.error = safeLog(_origError) as any
console.warn = safeLog(_origWarn) as any

process.on('uncaughtException', (err: any) => {
  if (isEpipe(err)) return
  _origError('Uncaught exception:', err)
})

process.on('unhandledRejection', (reason: any) => {
  if (isEpipe(reason)) return
  _origError('Unhandled rejection:', reason)
})
