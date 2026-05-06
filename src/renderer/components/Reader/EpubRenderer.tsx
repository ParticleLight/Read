import { useEffect, useRef, useCallback, useState } from 'react'
import ePub, { Book, Rendition } from 'epubjs'
import { useReaderStore } from '../../stores/readerStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface EpubRendererProps {
  book: any
  content: Uint8Array
  bookId: number
}

export function EpubRenderer({ book, content, bookId }: EpubRendererProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const [isReady, setIsReady] = useState(false)

  const { progress, setProgress, saveProgress, setTableOfContents, addBookmark, addHighlight, navigateTarget, clearNavigateTarget, turnPageDelta, clearTurnPage } = useReaderStore()
  const { fontSize, fontFamily, lineHeight, margin, textAlign, theme } = useSettingsStore()

  // Handle navigation from sidebar bookmarks/TOC
  useEffect(() => {
    if (!navigateTarget || !renditionRef.current) return
    if (navigateTarget.cfi) {
      renditionRef.current.display(navigateTarget.cfi)
    }
    clearNavigateTarget()
  }, [navigateTarget])

  // Handle page turn from arrows
  useEffect(() => {
    if (!turnPageDelta || !renditionRef.current) return
    if (turnPageDelta > 0) renditionRef.current.next()
    else renditionRef.current.prev()
    clearTurnPage()
  }, [turnPageDelta])

  useEffect(() => {
    if (!viewerRef.current) return

    const epubBook = ePub(content.buffer as ArrayBuffer)
    bookRef.current = epubBook

    const rendition = epubBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    })

    renditionRef.current = rendition

    epubBook.ready.then(() => {
      const toc = epubBook.navigation?.toc || []
      setTableOfContents(toc)

      if (progress.cfi) {
        rendition.display(progress.cfi)
      } else {
        rendition.display()
      }
      setIsReady(true)
    })

    rendition.on('relocated', (location: any) => {
      const cfi = location?.start?.cfi
      const progressPercent = epubBook.locations?.percentageFromCfi(cfi) || 0
      setProgress({ progress: progressPercent * 100, cfi })
      saveProgress()
    })

    rendition.on('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') rendition.prev()
      if (e.key === 'ArrowRight') rendition.next()
    })

    epubBook.locations.generate(1024).then(() => {
      if (progress.cfi) {
        const pct = epubBook.locations.percentageFromCfi(progress.cfi)
        setProgress({ progress: pct * 100, cfi: progress.cfi })
      }
    })

    return () => {
      epubBook.destroy()
      bookRef.current = null
      renditionRef.current = null
    }
  }, [content])

  useEffect(() => {
    if (!renditionRef.current) return
    renditionRef.current.themes.fontSize(`${fontSize}px`)
    renditionRef.current.themes.font(fontFamily)
    renditionRef.current.themes.default({
      'body': {
        'line-height': `${lineHeight} !important`,
        'text-align': `${textAlign} !important`,
        'padding': `${margin}px !important`,
      },
      'p': {
        'line-height': `${lineHeight} !important`,
      }
    })
  }, [fontSize, fontFamily, lineHeight, margin, textAlign])

  useEffect(() => {
    if (!renditionRef.current) return
    const themes = renditionRef.current.themes
    switch (theme) {
      case 'dark':
        themes.override('color', '#e2e8f0')
        themes.override('background', '#1a1a2e')
        break
      case 'light':
        themes.override('color', '#1a202c')
        themes.override('background', '#ffffff')
        break
      case 'sepia':
        themes.override('color', '#5b4636')
        themes.override('background', '#f4ecd8')
        break
    }
  }, [theme])

  const goNext = useCallback(() => renditionRef.current?.next(), [])
  const goPrev = useCallback(() => renditionRef.current?.prev(), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'b') {
        const loc = renditionRef.current?.currentLocation() as any
        if (loc?.start?.cfi) {
          addBookmark({ book_id: bookId, cfi: loc.start.cfi, title: `书签 - ${new Date().toLocaleString('zh-CN')}` })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bookId, goNext, goPrev])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX
    const w = window.innerWidth
    if (x < w * 0.3) goPrev()
    else if (x > w * 0.7) goNext()
  }, [goNext, goPrev])

  return (
    <div className="h-full relative" onClick={handleClick}>
      <div ref={viewerRef} className="h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--reader-bg)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  )
}
