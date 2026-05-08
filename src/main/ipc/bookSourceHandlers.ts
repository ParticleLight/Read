import { ipcMain, BrowserWindow, dialog } from 'electron'
import { readFileSync } from 'fs'
import { DatabaseService } from '../services/database'
import { BookSourceService } from '../services/bookSource'

export function registerBookSourceHandlers(db: DatabaseService, bookSourceService: BookSourceService) {
  ipcMain.handle('bookSource:getAll', () => db.getBookSources())

  ipcMain.handle('bookSource:get', (_e, id: number) => db.getBookSource(id))

  ipcMain.handle('bookSource:insert', (_e, source: any) => db.insertBookSource(source))

  ipcMain.handle('bookSource:update', (_e, id: number, updates: any) => db.updateBookSource(id, updates))

  ipcMain.handle('bookSource:delete', (_e, id: number) => db.deleteBookSource(id))

  ipcMain.handle('bookSource:toggle', (_e, id: number) => db.toggleBookSource(id))

  ipcMain.handle('bookSource:clearAll', () => db.clearAllBookSources())

  ipcMain.handle('bookSource:importFile', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { imported: 0, total: 0 }
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || result.filePaths.length === 0) return { imported: 0, total: 0 }

    const content = readFileSync(result.filePaths[0], 'utf-8')
    const parsed = JSON.parse(content)
    const sourcesArray = Array.isArray(parsed) ? parsed : [parsed]

    const sources = sourcesArray.map((s: any) => ({
      bookSourceName: s.bookSourceName || '',
      bookSourceUrl: s.bookSourceUrl || '',
      bookSourceType: s.bookSourceType || 0,
      enabled: s.enabled !== false,
      searchUrl: s.searchUrl || '',
      ruleSearch: s.ruleSearch || { bookList: '', name: '', author: '', bookUrl: '' },
      ruleBookInfo: s.ruleBookInfo || {},
      ruleToc: s.ruleToc || { chapterList: '', chapterName: '', chapterUrl: '' },
      ruleContent: s.ruleContent || { content: '' },
    }))

    const imported = db.importBookSources(sources)
    return { imported, total: sources.length }
  })

  ipcMain.handle('bookSource:search', async (_e, keyword: string, page?: number) => {
    try {
      const results = await bookSourceService.searchAll(keyword, page || 1)
      return { results }
    } catch (e: any) {
      return { results: [], error: e?.message || '搜索失败' }
    }
  })

  ipcMain.handle('bookSource:searchOne', async (_e, sourceId: number, keyword: string, page?: number) => {
    return bookSourceService.search(sourceId, keyword, page || 1)
  })

  ipcMain.handle('bookSource:getBookInfo', async (_e, sourceId: number, bookUrl: string) => {
    return bookSourceService.getBookInfo(sourceId, bookUrl)
  })

  ipcMain.handle('bookSource:getChapterList', async (_e, sourceId: number, tocUrl: string) => {
    return bookSourceService.getChapterList(sourceId, tocUrl)
  })

  ipcMain.handle('bookSource:download', async (e, sourceId: number, bookUrl: string, bookName: string, format: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    return bookSourceService.downloadBook(sourceId, bookUrl, bookName, format as 'txt' | 'epub', (progress) => {
      win?.webContents.send('bookSource:downloadProgress', progress)
    })
  })
}
