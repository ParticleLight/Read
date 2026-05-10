import { useState, useEffect, useRef } from 'react'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [percent, setPercent] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const dismissedVersion = useRef<string | null>(null)

  useEffect(() => {
    const unsubs = [
      window.electronAPI.onUpdateAvailable((info) => {
        if (dismissedVersion.current !== info.version) {
          setUpdateInfo(info)
        }
      }),
      window.electronAPI.onUpdateDownloadProgress((p) => {
        setDownloading(true)
        setPercent(p.percent)
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setDownloading(false)
        setDownloaded(true)
      }),
      window.electronAPI.onUpdateNotAvailable(() => {}),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const handleDownload = () => {
    setDownloading(true)
    window.electronAPI.downloadUpdate()
  }

  const handleInstall = () => {
    window.electronAPI.quitAndInstall()
  }

  const handleDismiss = () => {
    if (updateInfo) {
      dismissedVersion.current = updateInfo.version
    }
    setUpdateInfo(null)
    setDownloaded(false)
    setDownloading(false)
    setPercent(0)
  }

  if (!updateInfo) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-6 py-3 shadow-lg border-b backdrop-blur-sm"
      style={{ backgroundColor: 'var(--color-green-bg)', color: 'var(--color-green)', borderColor: 'transparent' }}>
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7M7 7h5m5 10v-5" />
        </svg>
        <span className="text-sm font-medium">
          发现新版本 v{updateInfo.version}
        </span>
        {downloading && (
          <span className="text-xs opacity-70">下载中 {Math.round(percent)}%</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {downloaded ? (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs rounded-md font-medium"
            style={{ backgroundColor: 'var(--color-green)', color: '#fff' }}
          >
            立即重启安装
          </button>
        ) : downloading ? null : (
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs rounded-md font-medium"
            style={{ backgroundColor: 'var(--color-green)', color: '#fff' }}
          >
            下载更新
          </button>
        )}
        <button onClick={handleDismiss} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
