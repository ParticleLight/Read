import { useSettingsStore } from '../../stores/settingsStore'

interface SettingsPanelProps {
  onClose: () => void
  format?: string
}

export function SettingsPanel({ onClose, format }: SettingsPanelProps) {
  const {
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    lineHeight, setLineHeight,
    margin, setMargin,
    textAlign, setTextAlign,
  } = useSettingsStore()

  const isTextFormat = !format || !['pdf', 'cbz', 'cbr'].includes(format)

  const fonts = [
    { label: '衬线体', value: 'Georgia, Noto Serif SC, serif' },
    { label: '无衬线', value: 'Inter, Noto Sans SC, sans-serif' },
    { label: '等宽', value: 'JetBrains Mono, monospace' },
  ]

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-[var(--reader-sidebar)] border-l border-[var(--reader-border)] shadow-2xl z-40 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">阅读设置</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isTextFormat && (
          <>
            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">字体</label>
              <div className="flex flex-wrap gap-2">
                {fonts.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontFamily(f.value)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      fontFamily === f.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                字号: {fontSize}px
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  className="px-3 py-1 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
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
                  className="px-3 py-1 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                行距: {lineHeight.toFixed(1)}
              </label>
              <input
                type="range"
                min="1.2"
                max="3"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Margin */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                边距: {margin}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Text Align */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">对齐方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                    textAlign === 'left'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  左对齐
                </button>
                <button
                  onClick={() => setTextAlign('justify')}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                    textAlign === 'justify'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  两端对齐
                </button>
              </div>
            </div>
          </>
        )}

        {!isTextFormat && (
          <div className="text-sm text-gray-500 bg-gray-800/50 rounded-lg p-4">
            PDF 和漫画格式使用固定版式，不支持调整字体和排版设置。可使用 <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">+</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">-</kbd> 键缩放。
          </div>
        )}

        {/* Keyboard shortcuts */}
        <div className="pt-4 border-t border-[var(--reader-border)]">
          <h3 className="text-sm font-medium text-gray-400 mb-3">快捷键</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>上一页</span>
              <kbd className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">←</kbd>
            </div>
            <div className="flex justify-between">
              <span>下一页</span>
              <kbd className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">→</kbd>
            </div>
            <div className="flex justify-between">
              <span>添加书签</span>
              <kbd className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">B</kbd>
            </div>
            <div className="flex justify-between">
              <span>返回</span>
              <kbd className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
