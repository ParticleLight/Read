import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

// Use the worker bundled alongside the renderer output
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', window.location.href).href

interface PdfRendererProps {
  book: any
  content: Uint8Array
  bookId: number
}

export function PdfRenderer({ book, content, bookId }: PdfRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(2)
  const [visiblePage, setVisiblePage] = useState(1)
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map())
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderedPages = useRef<Set<number>>(new Set())
  const renderingPages = useRef<Set<number>>(new Set())

  const { progress, setProgress, saveProgress, navigateTarget, clearNavigateTarget, turnPageDelta, clearTurnPage, seekTarget, clearSeekTarget } = useReaderStore()
  const { theme } = useSettingsStore()

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument({ data: content }).promise
      pdfDocRef.current = pdf
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      renderedPages.current.clear()
      renderingPages.current.clear()

      // Pre-fetch page dimensions for layout sizing
      const dims = new Map<number, { width: number; height: number }>()
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        dims.set(i, { width: viewport.width, height: viewport.height })
      }
      setPageDimensions(dims)
    }
    loadPdf()

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }
      canvasRefs.current.clear()
      renderedPages.current.clear()
      renderingPages.current.clear()
    }
  }, [content])

  // Render a single page into its canvas
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || renderingPages.current.has(pageNum) || renderedPages.current.has(pageNum)) return
    const canvas = canvasRefs.current.get(pageNum)
    if (!canvas) return

    renderingPages.current.add(pageNum)
    try {
      const page = await pdfDocRef.current.getPage(pageNum)
      const dpr = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: scale * dpr })

      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`

      const context = canvas.getContext('2d')!
      await page.render({ canvasContext: context, viewport }).promise
      renderedPages.current.add(pageNum)
    } finally {
      renderingPages.current.delete(pageNum)
    }
  }, [scale])

  // When scale changes, re-render all visible pages
  useEffect(() => {
    renderedPages.current.clear()
    renderingPages.current.clear()
    // Re-render pages that have canvases
    canvasRefs.current.forEach((_, pageNum) => {
      renderPage(pageNum)
    })
  }, [scale, renderPage])

  // Observe which page is visible in viewport
  useEffect(() => {
    if (!containerRef.current || totalPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page'))
            if (pageNum) {
              setVisiblePage((prev) => {
                if (prev !== pageNum) {
                  const progressPercent = (pageNum / totalPages) * 100
                  setProgress({ progress: progressPercent, page: pageNum })
                  saveProgress()
                }
                return pageNum
              })
              // Render this page and neighbors
              renderPage(pageNum)
              if (pageNum > 1) renderPage(pageNum - 1)
              if (pageNum < totalPages) renderPage(pageNum + 1)
            }
          }
        }
      },
      { root: containerRef.current, threshold: 0.3 }
    )

    const containers = containerRef.current.querySelectorAll('[data-page]')
    containers.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [totalPages, renderPage])

  // Handle navigation from sidebar bookmarks/TOC
  useEffect(() => {
    if (!navigateTarget || !pdfDoc || !containerRef.current) return
    if (navigateTarget.page) {
      const target = containerRef.current.querySelector(`[data-page="${navigateTarget.page}"]`)
      if (target) target.scrollIntoView({ behavior: 'smooth' })
    }
    clearNavigateTarget()
  }, [navigateTarget, pdfDoc])

  // Handle page turn from arrows
  useEffect(() => {
    if (turnPageDelta === null || !containerRef.current) return
    const targetPage = Math.max(1, Math.min(visiblePage + turnPageDelta, totalPages))
    const target = containerRef.current.querySelector(`[data-page="${targetPage}"]`)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
    clearTurnPage()
  }, [turnPageDelta, visiblePage, totalPages])

  // Handle seek from progress bar
  useEffect(() => {
    if (seekTarget === null || totalPages === 0 || !containerRef.current) return
    const targetPage = Math.max(1, Math.round((seekTarget / 100) * totalPages))
    const target = containerRef.current.querySelector(`[data-page="${targetPage}"]`)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
    clearSeekTarget()
  }, [seekTarget, totalPages])

  // Scroll to saved progress page on load
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || totalPages === 0) return
    const startPage = progress.page || 1
    // Wait for DOM to render
    requestAnimationFrame(() => {
      const target = containerRef.current?.querySelector(`[data-page="${startPage}"]`)
      if (target) target.scrollIntoView()
    })
  }, [pdfDoc, totalPages])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.5))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Ctrl+wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setScale((s) => Math.max(0.5, Math.min(4, s + (e.deltaY > 0 ? -0.1 : 0.1))))
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const registerCanvas = useCallback((pageNum: number, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasRefs.current.set(pageNum, canvas)
      renderPage(pageNum)
    } else {
      canvasRefs.current.delete(pageNum)
      renderedPages.current.delete(pageNum)
    }
  }, [renderPage])

  const filterStyle = theme === 'dark'
    ? 'invert(1) hue-rotate(180deg) brightness(0.9)'
    : theme === 'sepia'
      ? 'invert(1) hue-rotate(180deg) sepia(0.4) brightness(0.7)'
      : 'none'

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-[var(--reader-bg)]">
      <div className="flex flex-col items-center py-4" style={{ filter: filterStyle }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const dim = pageDimensions.get(pageNum)
          return (
            <div key={pageNum} data-page={pageNum} className="relative py-4">
              <canvas
                ref={(el) => registerCanvas(pageNum, el)}
                className="shadow-2xl"
                style={dim ? { width: `${dim.width * scale}px`, height: `${dim.height * scale}px` } : undefined}
              />
            </div>
          )
        })}
      </div>

      {/* Page indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full z-10">
        {visiblePage} / {totalPages}
      </div>
    </div>
  )
}
