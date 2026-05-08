import * as cheerio from 'cheerio'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { DatabaseService } from './database'
import { LibraryService } from './library'

interface SearchResult {
  sourceId: number
  sourceName: string
  bookUrl: string
  name: string
  author: string
  coverUrl?: string
  lastChapter?: string
  intro?: string
}

interface DownloadProgress {
  status: 'fetching_toc' | 'downloading' | 'assembling' | 'importing' | 'done' | 'error'
  current: number
  total: number
  chapterName?: string
  error?: string
  bookId?: number
}

export class BookSourceService {
  private db: DatabaseService
  private library: LibraryService
  private downloadDir: string

  constructor(db: DatabaseService, library: LibraryService) {
    this.db = db
    this.library = library
    this.downloadDir = join(app.getPath('userData'), 'downloads')
    if (!existsSync(this.downloadDir)) mkdirSync(this.downloadDir, { recursive: true })
  }

  private async fetchHtml(url: string, timeout = 15000): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      if (!response.ok) {
        const statusText: Record<number, string> = { 403: '拒绝访问', 404: '页面不存在', 502: '网关错误', 503: '服务不可用' }
        throw new Error(`HTTP ${response.status} ${statusText[response.status] || ''}`.trim())
      }

      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || ''
      let text: string

      if (contentType.includes('gbk') || contentType.includes('gb2312')) {
        text = new TextDecoder('gbk').decode(buffer)
      } else {
        const preview = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1024))
        if (/charset\s*=\s*gbk/i.test(preview)) {
          text = new TextDecoder('gbk').decode(buffer)
        } else {
          text = new TextDecoder('utf-8').decode(buffer)
        }
      }
      return text
    } catch (e: any) {
      if (e?.name === 'AbortError') throw new Error('请求超时')
      if (e?.code === 'ENOTFOUND') throw new Error('域名无法解析')
      if (e?.code === 'ECONNREFUSED') throw new Error('连接被拒绝')
      if (e?.code === 'ENETUNREACH') throw new Error('网络不可达')
      throw new Error(e?.message || '网络请求失败')
    } finally {
      clearTimeout(timer)
    }
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    if (!relativeUrl) return ''
    try {
      return new URL(relativeUrl, baseUrl).href
    } catch {
      return relativeUrl
    }
  }

  private extractFromElement($el: cheerio.Cheerio<any>, selector: string): string {
    if (!selector) return ''
    const atIndex = selector.lastIndexOf('@')
    if (atIndex !== -1) {
      const cssSel = selector.substring(0, atIndex)
      const attr = selector.substring(atIndex + 1)
      const target = cssSel ? $el.find(cssSel) : $el
      if (attr === 'text') return target.first().text().trim()
      if (attr === 'html') return target.first().html()?.trim() || ''
      return target.first().attr(attr)?.trim() || ''
    }
    return $el.find(selector).first().text().trim()
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  private cleanHtmlContent(html: string): string {
    const $ = cheerio.load(html)
    $('script, style').remove()
    $('br').replaceWith('\n')
    $('p').replaceWith('\n')
    $('div').replaceWith('\n')
    return $.text()
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  async search(sourceId: number, keyword: string, page = 1): Promise<SearchResult[]> {
    const source = this.db.getBookSource(sourceId)
    if (!source || !source.enabled) return []

    const url = source.searchUrl
      .replace('{{key}}', encodeURIComponent(keyword))
      .replace('{{page}}', String(page))

    const html = await this.fetchHtml(url)
    const $ = cheerio.load(html)
    const rule = source.ruleSearch

    const results: SearchResult[] = []
    $(rule.bookList).each((_i, el) => {
      const $el = $(el)
      const name = this.extractFromElement($el, rule.name)
      const author = this.extractFromElement($el, rule.author)
      const bookUrl = this.extractFromElement($el, rule.bookUrl)

      if (name && bookUrl) {
        results.push({
          sourceId: source.id,
          sourceName: source.bookSourceName,
          bookUrl: this.resolveUrl(source.bookSourceUrl, bookUrl),
          name: this.cleanText(name),
          author: this.cleanText(author),
          coverUrl: rule.coverUrl ? this.resolveUrl(source.bookSourceUrl, this.extractFromElement($el, rule.coverUrl)) : undefined,
          lastChapter: rule.lastChapter ? this.cleanText(this.extractFromElement($el, rule.lastChapter)) : undefined,
          intro: rule.intro ? this.cleanText(this.extractFromElement($el, rule.intro)) : undefined,
        })
      }
    })

    this.db.updateBookSourceLastUsed(sourceId)
    return results
  }

  async searchAll(keyword: string, page = 1): Promise<SearchResult[]> {
    const sources = this.db.getBookSources().filter((s) => s.enabled)
    if (sources.length === 0) throw new Error('没有启用的书源，请先在源管理中启用书源')

    const results = await Promise.allSettled(
      sources.map((s) => this.search(s.id, keyword, page))
    )

    const allResults: SearchResult[] = []
    const errors: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        allResults.push(...r.value)
      } else {
        errors.push(`${sources[i].bookSourceName}: ${r.reason?.message || '请求失败'}`)
      }
    })

    if (allResults.length === 0 && errors.length > 0) {
      throw new Error(errors.join('\n'))
    }

    return allResults
  }

  async getBookInfo(sourceId: number, bookUrl: string): Promise<{ name: string; author: string; intro: string; coverUrl: string; tocUrl: string }> {
    const source = this.db.getBookSource(sourceId)
    if (!source) throw new Error('Source not found')

    const html = await this.fetchHtml(bookUrl)
    const $ = cheerio.load(html)
    const rule = source.ruleBookInfo

    return {
      name: rule.name ? this.cleanText(this.extractFromElement($('body'), rule.name)) : '',
      author: rule.author ? this.cleanText(this.extractFromElement($('body'), rule.author)) : '',
      intro: rule.intro ? this.cleanText(this.extractFromElement($('body'), rule.intro)) : '',
      coverUrl: rule.coverUrl ? this.resolveUrl(bookUrl, this.extractFromElement($('body'), rule.coverUrl)) : '',
      tocUrl: rule.tocUrl ? this.resolveUrl(bookUrl, this.extractFromElement($('body'), rule.tocUrl)) : bookUrl,
    }
  }

  async getChapterList(sourceId: number, tocUrl: string): Promise<{ name: string; url: string }[]> {
    const source = this.db.getBookSource(sourceId)
    if (!source) throw new Error('Source not found')

    const html = await this.fetchHtml(tocUrl)
    const $ = cheerio.load(html)
    const rule = source.ruleToc

    const chapters: { name: string; url: string }[] = []
    $(rule.chapterList).each((_i, el) => {
      const $el = $(el)
      const name = this.extractFromElement($el, rule.chapterName)
      const url = this.extractFromElement($el, rule.chapterUrl)

      if (name && url) {
        chapters.push({
          name: this.cleanText(name),
          url: this.resolveUrl(tocUrl, url),
        })
      }
    })

    return chapters
  }

  async getChapterContent(sourceId: number, chapterUrl: string): Promise<{ title: string; content: string }> {
    const source = this.db.getBookSource(sourceId)
    if (!source) throw new Error('Source not found')

    const html = await this.fetchHtml(chapterUrl)
    const $ = cheerio.load(html)
    const rule = source.ruleContent

    const content = this.extractFromElement($('body'), rule.content)
    const title = rule.title ? this.extractFromElement($('body'), rule.title) : ''

    return { title, content: this.cleanHtmlContent(content) }
  }

  async downloadBook(
    sourceId: number,
    bookUrl: string,
    bookName: string,
    format: 'txt' | 'epub',
    onProgress: (progress: DownloadProgress) => void
  ): Promise<number> {
    const source = this.db.getBookSource(sourceId)
    if (!source) throw new Error('Source not found')

    onProgress({ status: 'fetching_toc', current: 0, total: 0 })
    const bookInfo = await this.getBookInfo(sourceId, bookUrl)
    const chapters = await this.getChapterList(sourceId, bookInfo.tocUrl)

    if (chapters.length === 0) throw new Error('No chapters found')

    onProgress({ status: 'downloading', current: 0, total: chapters.length })
    const chapterContents: { title: string; content: string }[] = []
    const CONCURRENCY = 3

    for (let i = 0; i < chapters.length; i += CONCURRENCY) {
      const batch = chapters.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map(async (ch, j) => {
          const result = await this.getChapterContent(sourceId, ch.url)
          onProgress({
            status: 'downloading',
            current: i + j + 1,
            total: chapters.length,
            chapterName: ch.title,
          })
          return { title: ch.title, content: result.content }
        })
      )
      for (const r of results) {
        if (r.status === 'fulfilled') chapterContents.push(r.value)
      }
      if (i + CONCURRENCY < chapters.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    onProgress({ status: 'assembling', current: 0, total: 0 })
    const safeName = bookName.replace(/[<>:"/\\|?*]/g, '_')
    const filePath = join(this.downloadDir, `${safeName}.txt`)
    const text = chapterContents
      .map((ch) => `\n\n${ch.title}\n\n${ch.content}`)
      .join('')
    writeFileSync(filePath, text, 'utf-8')

    onProgress({ status: 'importing', current: 0, total: 0 })
    const book = await this.library.importBook(filePath)

    onProgress({ status: 'done', current: chapters.length, total: chapters.length, bookId: book.id })
    return book.id
  }
}
