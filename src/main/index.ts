import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { DatabaseService } from './services/database'
import { LibraryService } from './services/library'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerDbHandlers } from './ipc/dbHandlers'

let mainWindow: BrowserWindow | null = null
let db: DatabaseService
let library: LibraryService

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

  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('Page load failed:', code, desc)
  })

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['verbose', 'info', 'warning', 'error']
    console.log(`[renderer ${levels[level] || level}] ${message} (${sourceId}:${line})`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  db = new DatabaseService()
  library = new LibraryService(db)

  protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    callback({ path: filePath })
  })

  registerFileHandlers(library)
  registerDbHandlers(db)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') app.quit()
})
