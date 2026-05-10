import { Menu, app, BrowserWindow, dialog } from 'electron'

export function setupMenu(mainWindow: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入书籍',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow.isDestroyed()) return
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [{ name: '电子书', extensions: ['epub', 'pdf', 'mobi', 'txt', 'fb2', 'cbz', 'cbr', 'html', 'md'] }],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu:importBooks', result.filePaths)
            }
          },
        },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 ParticleBook',
          click: () => {
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:showAbout')
            }
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
