import { useSettingsStore } from '../../stores/settingsStore'

interface GlobalSettingsProps {
  onBack: () => void
}

export function GlobalSettings({ onBack }: GlobalSettingsProps) {
  const {
    theme, setTheme,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    lineHeight, setLineHeight,
    margin, setMargin,
    textAlign, setTextAlign,
  } = useSettingsStore()

  const fonts = [
    { label: '衬线体', value: 'Georgia, Noto Serif SC, serif' },
    { label: '无衬线', value: 'Inter, Noto Sans SC, sans-serif' },
    { label: '等宽', value: 'JetBrains Mono, monospace' },
  ]

  const themes = [
    { id: 'light' as const, label: '亮色模式', desc: '适合白天阅读', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'dark' as const, label: '暗色模式', desc: '适合夜间阅读', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    { id: 'sepia' as const, label: '护眼模式', desc: '降低蓝光，缓解疲劳', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  ]

  return (
    <div className="h-screen flex flex-col bg-[var(--reader-bg)]">
      {/* Header */}
      <header className="drag-region flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)] bg-[var(--reader-bg)]/80 backdrop-blur-sm">
        <div className="no-drag flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-60 hover:opacity-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[var(--reader-text)]">全局设置</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8 space-y-10">

          {/* Theme */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">外观主题</h2>
            <div className="grid grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === t.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[var(--reader-border)] hover:border-gray-500 bg-[var(--reader-sidebar)]'
                  }`}
                >
                  <svg className="w-6 h-6 mb-2 text-[var(--reader-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  <p className="font-medium text-[var(--reader-text)]">{t.label}</p>
                  <p className="text-xs text-[var(--reader-text)] opacity-50 mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Font Family */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">字体</h2>
            <div className="flex flex-wrap gap-3">
              {fonts.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value)}
                  className={`px-5 py-3 rounded-xl text-sm transition-all border-2 ${
                    fontFamily === f.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-[var(--reader-text)]'
                      : 'border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100'
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font Size */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">字号</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="w-10 h-10 rounded-lg bg-[var(--reader-sidebar)] border border-[var(--reader-border)] text-[var(--reader-text)] hover:bg-[var(--reader-border)] transition-colors font-bold"
              >
                A-
              </button>
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 1))}
                className="w-10 h-10 rounded-lg bg-[var(--reader-sidebar)] border border-[var(--reader-border)] text-[var(--reader-text)] hover:bg-[var(--reader-border)] transition-colors font-bold"
              >
                A+
              </button>
              <span className="text-[var(--reader-text)] opacity-60 w-12 text-center">{fontSize}px</span>
            </div>
          </section>

          {/* Line Height */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">行距</h2>
            <div className="flex items-center gap-4">
              <span className="text-[var(--reader-text)] opacity-50 text-sm">紧凑</span>
              <input
                type="range"
                min="1.2"
                max="3"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-[var(--reader-text)] opacity-50 text-sm">宽松</span>
              <span className="text-[var(--reader-text)] opacity-60 w-12 text-center">{lineHeight.toFixed(1)}</span>
            </div>
          </section>

          {/* Margin */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">边距</h2>
            <div className="flex items-center gap-4">
              <span className="text-[var(--reader-text)] opacity-50 text-sm">窄</span>
              <input
                type="range"
                min="0"
                max="100"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-[var(--reader-text)] opacity-50 text-sm">宽</span>
              <span className="text-[var(--reader-text)] opacity-60 w-12 text-center">{margin}px</span>
            </div>
          </section>

          {/* Text Align */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--reader-text)] mb-4">对齐方式</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setTextAlign('left')}
                className={`flex-1 py-3 rounded-xl text-sm transition-all border-2 ${
                  textAlign === 'left'
                    ? 'border-indigo-500 bg-indigo-500/10 text-[var(--reader-text)]'
                    : 'border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100'
                }`}
              >
                左对齐
              </button>
              <button
                onClick={() => setTextAlign('justify')}
                className={`flex-1 py-3 rounded-xl text-sm transition-all border-2 ${
                  textAlign === 'justify'
                    ? 'border-indigo-500 bg-indigo-500/10 text-[var(--reader-text)]'
                    : 'border-[var(--reader-border)] bg-[var(--reader-sidebar)] text-[var(--reader-text)] opacity-70 hover:opacity-100'
                }`}
              >
                两端对齐
              </button>
            </div>
          </section>

          {/* Info */}
          <section className="pt-6 border-t border-[var(--reader-border)]">
            <p className="text-sm text-[var(--reader-text)] opacity-40">
              此处的设置对所有书籍生效。如果在阅读某本书时单独修改了设置，该书将使用独立设置，不受此处更改影响。
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
