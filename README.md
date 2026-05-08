# ParticleBook

一款简洁优雅的全功能电子书阅读器，基于 Electron + React 构建，支持多种电子书格式。

## 支持格式

| 格式 | 说明 |
|------|------|
| EPUB | 电子书标准格式，支持目录、高亮、批注 |
| PDF | 便携式文档格式，支持缩放 |
| MOBI | Kindle 格式 |
| TXT | 纯文本格式 |
| FB2 | FictionBook 格式 |
| CBZ / CBR | 漫画压缩包格式 |
| HTML | 网页格式 |
| Markdown | Markdown 格式 |

## 功能特性

**书架管理**
- 网格 / 列表两种视图模式
- 按书名、作者、添加时间、最近阅读排序
- 搜索过滤
- 拖放导入文件
- 自定义书柜分组

**阅读功能**
- 目录导航
- 书签（支持重命名）
- 多色高亮标注（5 种颜色）
- 笔记
- 阅读进度自动保存
- 阅读时间统计
- 鼠标滚轮翻页（EPUB / PDF / CBZ / CBR）

**个性化设置**
- 三种主题：深色、浅色、护眼
- 字体切换（衬线体、无衬线、等宽）
- 字号、行距、边距调节
- 对齐方式选择（左对齐、两端对齐）
- 每本书独立设置

**在线书源**
- 兼容 Legado 书源格式（JSON 导入）
- 多源并发搜索
- 一键下载并导入书架

**Z-Library 集成**
- 内置 Z-Library 浏览器
- 登录状态持久化
- 下载自动导入书架

## 快捷键

| 按键 | 功能 |
|------|------|
| `←` / `→` | 上一页 / 下一页 |
| `鼠标滚轮` | 翻页（EPUB / PDF / CBZ / CBR） |
| `B` | 添加书签 |
| `Esc` | 返回书架 |
| `+` / `-` | 缩放（PDF） |
| `Ctrl + 滚轮` | 缩放（PDF） |
| `Space` | 下一页（PDF / 漫画） |
| `Home` / `End` | 首页 / 末页（PDF / 漫画） |

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 33 | 桌面应用运行时 |
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Zustand | 状态管理 |
| Tailwind CSS | 样式 |
| Vite + electron-vite | 构建工具 |
| epubjs | EPUB 渲染 |
| pdfjs-dist | PDF 渲染 |
| JSZip | CBZ / CBR 解压 |
| markdown-it | Markdown 渲染 |
| LowDB | JSON 文件数据库 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 打包 Windows 安装包
npm run package
```

## 项目结构

```
src/
  main/                    # Electron 主进程
    index.ts               # 应用入口、窗口创建、IPC 注册
    preload.ts             # 上下文桥接（暴露 83 个 API）
    ipc/                   # IPC 处理器（文件、数据库、书源、Z-Library）
    services/              # 核心服务（数据库、书库、书源、Z-Library）
  renderer/                # React 前端
    components/
      Library/             # 书架界面（8 个组件）
      Reader/              # 阅读器（5 个渲染器 + 侧边栏 + 控制栏）
      Settings/            # 设置界面
      ZLibrary/            # Z-Library 浏览器
    stores/                # Zustand 状态管理（4 个 store）
    styles/                # 全局样式与主题变量
    utils/                 # 工具函数
```

## 许可证

MIT
