import { useState, useEffect, useRef, useCallback } from 'react'

interface ZLibraryViewProps {
  onBack: () => void
}

interface DownloadNotification {
  type: 'progress' | 'complete' | 'error' | 'import'
  message: string
}

export function ZLibraryView({ onBack }: ZLibraryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [notification, setNotification] = useState<DownloadNotification | null>(null)
  const notificationTimer = useRef<ReturnType<typeof setTimeout>>()

  const syncBounds = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    window.electronAPI.zlibSetBounds({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
  }, [])

  useEffect(() => {
    window.electronAPI.zlibShow()

    const syncAfterLayout = () => {
      requestAnimationFrame(() => {
        syncBounds()
        setTimeout(syncBounds, 200)
      })
    }

    syncAfterLayout()

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => syncBounds())
    observer.observe(container)

    window.addEventListener('resize', syncBounds)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncBounds)
      window.electronAPI.zlibHide()
    }
  }, [syncBounds])

  useEffect(() => {
    const unsub = window.electronAPI.onZlibUrlChanged((url) => setCurrentUrl(url))
    return unsub
  }, [])

  useEffect(() => {
    const unsubs = [
      window.electronAPI.onZlibDownloadProgress((p) => {
        showNotification('progress', `下载中: ${p.fileName} ${Math.round((p.received / p.total) * 100)}%`)
      }),
      window.electronAPI.onZlibDownloadComplete((d) => {
        showNotification('complete', `下载完成: ${d.fileName}`)
      }),
      window.electronAPI.onZlibImportComplete((d) => {
        showNotification('import', `已导入书架: ${d.fileName}`)
      }),
      window.electronAPI.onZlibImportError((d) => {
        showNotification('error', `导入失败: ${d.fileName} - ${d.error}`)
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const showNotification = (type: DownloadNotification['type'], message: string) => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current)
    setNotification({ type, message })
    notificationTimer.current = setTimeout(() => setNotification(null), 5000)
  }

  const handleNavigate = (action: 'back' | 'forward' | 'reload') => {
    window.electronAPI.zlibNavigate(action)
  }

  const handleClose = () => {
    window.electronAPI.zlibHide()
    onBack()
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--reader-bg)]">
      {/* Header */}
      <header className="drag-region flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)] bg-[var(--reader-bg)]/80 backdrop-blur-sm">
        <div className="no-drag flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors"
            title="返回书架"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[var(--reader-text)]">Z-Library</h1>
        </div>

        <div className="no-drag flex items-center gap-2">
          <button
            onClick={() => handleNavigate('back')}
            className="p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors"
            title="后退"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigate('forward')}
            className="p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors"
            title="前进"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigate('reload')}
            className="p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors"
            title="刷新"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={async () => { await window.electronAPI.zlibLogout(); window.electronAPI.zlibNavigate('reload') }}
            className="p-2 rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-sidebar)] transition-colors"
            title="退出登录"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <div className="ml-2 px-3 py-1.5 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg text-xs text-[var(--reader-text)] opacity-50 truncate max-w-sm">
            {currentUrl || 'Z-Library'}
          </div>
        </div>
      </header>

      {/* Download notification */}
      {notification && (
        <div
          className="px-4 py-2 text-sm flex-shrink-0"
          style={{
            color: notification.type === 'error' ? 'var(--notify-error-text)' :
                   notification.type === 'import' ? 'var(--notify-success-text)' :
                   'var(--notify-info-text)',
            backgroundColor: notification.type === 'error' ? 'var(--notify-error-bg)' :
                             notification.type === 'import' ? 'var(--notify-success-bg)' :
                             'var(--notify-info-bg)',
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Container for WebContentsView positioning */}
      <div ref={containerRef} className="flex-1 bg-[var(--reader-bg)]" />
    </div>
  )
}
