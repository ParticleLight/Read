import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

interface PdfRendererProps {
  book: any
  content: Buffer
  bookId: number
}

export function PdfRenderer({ book, content, bookId }: PdfRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [isRendering, setIsRendering] = useState(false)

  const { progress, setProgress, saveProgress } = useReaderStore()
  const { theme } = useSettingsStore()

  useEffect(() => {
    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument({ data: content }).promise
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)

      const startPage = progress.page || 1
      setCurrentPage(startPage)
    }
    loadPdf()
  }, [content])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      setIsRendering(true)
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current!
      const context = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (theme === 'dark') {
        context.filter = 'invert(0.85) hue-rotate(180deg)'
      } else {
        context.filter = 'none'
      }

      await page.render({ canvasContext: context, viewport }).promise
      setIsRendering(false)

      const progressPercent = (currentPage / totalPages) * 100
      setProgress({ progress: progressPercent, page: currentPage })
      saveProgress()
    }
    renderPage()
  }, [pdfDoc, currentPage, scale, theme])

  const goNext = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }, [currentPage, totalPages])

  const goPrev = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }, [currentPage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev()
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'Home') setCurrentPage(1)
      if (e.key === 'End') setCurrentPage(totalPages)
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.5))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, totalPages])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX
    const w = window.innerWidth
    if (x < w * 0.3) goPrev()
    else if (x > w * 0.7) goNext()
  }, [goNext, goPrev])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      setScale((s) => Math.max(0.5, Math.min(4, s + (e.deltaY > 0 ? -0.1 : 0.1))))
    }
  }, [])

  return (
    <div className="h-full flex flex-col items-center overflow-auto bg-[var(--reader-bg)]" onClick={handleClick} onWheel={handleWheel}>
      <div className="relative py-8">
        <canvas ref={canvasRef} className="shadow-2xl" />
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Page indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
        {currentPage} / {totalPages}
      </div>
    </div>
  )
}
