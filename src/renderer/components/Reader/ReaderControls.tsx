import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface ReaderControlsProps {
  bookId: number
  onOpenSettings: () => void
}

export function ReaderControls({ bookId, onOpenSettings }: ReaderControlsProps) {
  const { progress, toggleSidebar, setSidebarTab } = useReaderStore()
  const { theme, setTheme } = useSettingsStore()

  const themes = ['light', 'dark', 'sepia'] as const

  return (
    <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent px-6 py-4">
      {/* Progress bar */}
      <div className="max-w-2xl mx-auto mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress.progress || 0}
          onChange={(e) => {
            // Seek to position - renderer specific
          }}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{Math.round(progress.progress || 0)}%</span>
          <span>{progress.page ? `第 ${progress.page} 页` : ''}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* TOC */}
        <button
          onClick={() => setSidebarTab('toc')}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="目录"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        {/* Bookmarks */}
        <button
          onClick={() => setSidebarTab('bookmarks')}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="书签"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Notes */}
        <button
          onClick={() => setSidebarTab('notes')}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="笔记"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Theme toggle */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                theme === t ? 'bg-[var(--reader-accent)] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'light' ? '亮' : t === 'dark' ? '暗' : '护眼'}
            </button>
          ))}
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
