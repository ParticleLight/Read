import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { useReaderStore } from '../../stores/readerStore'

interface ComicRendererProps {
  book: any
  content: Uint8Array
  bookId: number
}

export function ComicRenderer({ book, content, bookId }: ComicRendererProps) {
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const { progress, setProgress, saveProgress, navigateTarget, clearNavigateTarget, turnPageDelta, clearTurnPage } = useReaderStore()

  useEffect(() => {
    if (!navigateTarget) return
    if (navigateTarget.page) setCurrentIndex(navigateTarget.page)
    clearNavigateTarget()
  }, [navigateTarget])

  useEffect(() => {
    if (turnPageDelta === null) return
    setCurrentIndex((i) => Math.max(0, Math.min(i + turnPageDelta, images.length - 1)))
    clearTurnPage()
  }, [turnPageDelta])

  useEffect(() => {
    const loadComic = async () => {
      try {
        const zip = await JSZip.loadAsync(content)
        const imageFiles: { name: string; file: JSZip.JSZipObject }[] = []

        zip.forEach((path, file) => {
          if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path) && !file.dir) {
            imageFiles.push({ name: path, file })
          }
        })

        imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

        const imageUrls: string[] = []
        for (const img of imageFiles) {
          const blob = await img.file.async('blob')
          imageUrls.push(URL.createObjectURL(blob))
        }

        setImages(imageUrls)
        setIsLoading(false)

        if (progress.page) {
          setCurrentIndex(progress.page)
        }
      } catch (e) {
        console.error('Failed to load comic:', e)
        setIsLoading(false)
      }
    }
    loadComic()

    return () => {
      images.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [content])

  useEffect(() => {
    if (images.length === 0) return
    const progressPercent = (currentIndex / images.length) * 100
    setProgress({ progress: progressPercent, page: currentIndex })
    saveProgress()
  }, [currentIndex, images.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        setCurrentIndex((i) => Math.min(i + 1, images.length - 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Home') setCurrentIndex(0)
      if (e.key === 'End') setCurrentIndex(images.length - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--reader-bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">正在解压漫画...</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--reader-bg)]">
        <p className="text-gray-500">未找到图片</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-black flex flex-col items-center">
      {/* Scroll mode - show all images */}
      <div className="w-full max-w-4xl">
        {images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`第 ${index + 1} 页`}
            className="w-full"
            loading="lazy"
          />
        ))}
      </div>

      {/* Page indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
