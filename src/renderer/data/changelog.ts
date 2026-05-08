export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    type: 'feature' | 'fix' | 'improve'
    text: string
  }[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.5.0',
    date: '2026-05-08',
    changes: [
      { type: 'feature', text: '内置 Z-Library 网页浏览器，支持在应用内直接登录并浏览 Z-Library' },
      { type: 'feature', text: 'Z-Library 下载的书籍自动导入书架，无需手动操作' },
      { type: 'feature', text: 'Z-Library 登录状态持久保存，下次打开无需重复登录' },
      { type: 'feature', text: 'Z-Library 工具栏支持前进、后退、刷新导航操作' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-08',
    changes: [
      { type: 'feature', text: '书源管理：支持导入 Legado 格式 JSON 书源配置文件' },
      { type: 'feature', text: '在线搜索：通过书源在线搜索书籍，支持多源并发搜索' },
      { type: 'feature', text: '在线下载：搜索结果可一键下载到本地书架，支持下载进度显示' },
      { type: 'feature', text: '书源管理面板：启用/禁用、删除书源，查看源列表' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-08',
    changes: [
      { type: 'improve', text: '渲染器组件懒加载，主包从 2.5MB 降至 651KB，启动速度提升' },
      { type: 'improve', text: '排除 pdfjs-dist 冗余资源，减少约 25MB 安装包体积' },
      { type: 'improve', text: '排除 epubjs 冗余文件，减少约 2.7MB 安装包体积' },
      { type: 'improve', text: '精简 Chromium 语言包，减少约 35MB 安装包体积' },
      { type: 'improve', text: '移除未使用的 react-router-dom 依赖' },
      { type: 'fix', text: '提取重复代码到公共工具文件，消除多处代码冗余' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-07',
    changes: [
      { type: 'feature', text: '高亮和笔记支持点击跳转到对应位置' },
      { type: 'feature', text: '添加更新日志面板，记录每次更新内容' },
      { type: 'feature', text: '设置中新增"关于"页面，显示软件介绍和版本信息' },
      { type: 'improve', text: '降低护眼模式亮度，减少视觉疲劳' },
      { type: 'improve', text: '应用正式命名为 ParticleBook' },
      { type: 'fix', text: '修复拖拽文件到主界面无法导入的问题（Electron 35 移除了 File.path）' },
      { type: 'fix', text: '修复拖拽文件时界面闪烁的问题' },
      { type: 'fix', text: '清理残留调试日志' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-07',
    changes: [
      { type: 'feature', text: '阅读统计面板：显示所有书籍的阅读进度和阅读时间' },
      { type: 'feature', text: '书签支持重命名，双击或点击编辑按钮即可修改' },
      { type: 'feature', text: '书签右下角显示位置占全书的百分比，精确到一位小数' },
      { type: 'feature', text: '新建书柜改为弹窗输入方式' },
      { type: 'fix', text: '修复阅读时间统计始终为0的问题' },
      { type: 'fix', text: '修复统计界面中书籍不显示封面的问题' },
      { type: 'fix', text: '为TXT格式书籍添加文本预览封面' },
      { type: 'fix', text: '修复进入书柜后统计只显示书柜内书籍的问题' },
      { type: 'fix', text: '修复TXT阅读器中目录显示另一本书内容的问题' },
      { type: 'fix', text: '修复书签重命名后重新打开书籍失效的问题' },
      { type: 'fix', text: '修复翻页后书签图标状态不正确的问题' },
      { type: 'fix', text: '修复字体加载被CSP拒绝的问题' },
      { type: 'fix', text: '修复统计面板中进度显示超过100%的问题' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-06',
    changes: [
      { type: 'feature', text: '支持 EPUB、PDF、MOBI、TXT、FB2、CBZ/CBR、HTML、Markdown 格式' },
      { type: 'feature', text: '书架管理：书柜分类、拖放导入、搜索排序' },
      { type: 'feature', text: '阅读器：目录导航、书签、高亮标注、笔记' },
      { type: 'feature', text: '阅读进度自动保存与恢复' },
      { type: 'feature', text: '亮色/暗色/护眼三种主题切换' },
      { type: 'feature', text: '字体、字号、行距、边距等自定义设置' },
    ],
  },
]
