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
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

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
