export interface SearchResult {
  sourceId: number
  sourceName: string
  bookUrl: string
  name: string
  author: string
  coverUrl?: string
  lastChapter?: string
  intro?: string
}

export interface DownloadProgress {
  status: 'fetching_toc' | 'downloading' | 'assembling' | 'importing' | 'done' | 'error'
  current: number
  total: number
  chapterName?: string
  error?: string
  bookId?: number
}

export interface BookSourceInfo {
  id: number
  bookSourceName: string
  bookSourceUrl: string
  bookSourceType: number
  enabled: boolean
  lastUsed?: string
  added_at: string
}
