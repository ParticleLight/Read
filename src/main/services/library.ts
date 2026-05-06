import { DatabaseService } from './database'
import { readFileSync, existsSync } from 'fs'
import { extname, basename } from 'path'
import { XMLParser } from 'fast-xml-parser'

export interface BookMetadata {
  title: string
  author?: string
  format: string
  filePath: string
  fileSize: number
  coverPath?: string
  description?: string
  publisher?: string
  publishDate?: string
  isbn?: string
  language?: string
}

export class LibraryService {
  private db: DatabaseService
  private xmlParser: XMLParser

  constructor(db: DatabaseService) {
    this.db = db
    this.xmlParser = new XMLParser({ ignoreAttributes: false })
  }

  async importBook(filePath: string): Promise<any> {
    const existing = this.db.getBookByPath(filePath) as any
    if (existing) {
      this.db.updateBookLastOpened(existing.id)
      return existing
    }

    const format = this.detectFormat(filePath)
    if (!format) throw new Error(`Unsupported format: ${extname(filePath)}`)

    const metadata = await this.extractMetadata(filePath, format)
    const book = this.db.insertBook({
      title: metadata.title,
      author: metadata.author,
      format: metadata.format,
      file_path: metadata.filePath,
      file_size: metadata.fileSize,
      cover_path: metadata.coverPath,
      description: metadata.description,
      publisher: metadata.publisher,
      publish_date: metadata.publishDate,
      isbn: metadata.isbn,
      language: metadata.language,
    })
    return book
  }

  async importBooks(filePaths: string[]): Promise<any[]> {
    const results: any[] = []
    for (const filePath of filePaths) {
      try {
        const book = await this.importBook(filePath)
        results.push(book)
      } catch (e) {
        console.error(`Failed to import ${filePath}:`, e)
      }
    }
    return results
  }

  getBooks() {
    return this.db.getBooks()
  }

  getBook(id: number) {
    return this.db.getBook(id)
  }

  deleteBook(id: number) {
    this.db.deleteBook(id)
  }

  async getCoverImage(bookId: number): Promise<string | null> {
    const book = this.db.getBook(bookId) as any
    if (!book) return null

    if (book.cover_path && existsSync(book.cover_path)) {
      return book.cover_path
    }

    return await this.extractCover(book.file_path, book.format)
  }

  private detectFormat(filePath: string): string | null {
    const ext = extname(filePath).toLowerCase()
    const formatMap: Record<string, string> = {
      '.epub': 'epub',
      '.pdf': 'pdf',
      '.mobi': 'mobi',
      '.txt': 'txt',
      '.fb2': 'fb2',
      '.cbz': 'cbz',
      '.cbr': 'cbr',
      '.html': 'html',
      '.htm': 'html',
      '.md': 'markdown',
      '.markdown': 'markdown',
    }
    return formatMap[ext] || null
  }

  private async extractMetadata(filePath: string, format: string): Promise<BookMetadata> {
    const { statSync } = require('fs')
    const stats = statSync(filePath)
    const baseName = basename(filePath, extname(filePath))

    const metadata: BookMetadata = {
      title: baseName,
      format,
      filePath,
      fileSize: stats.size,
    }

    try {
      switch (format) {
        case 'epub':
          await this.extractEpubMetadata(filePath, metadata)
          break
        case 'pdf':
          await this.extractPdfMetadata(filePath, metadata)
          break
        case 'fb2':
          await this.extractFb2Metadata(filePath, metadata)
          break
      }
    } catch (e) {
      console.error('Metadata extraction failed:', e)
    }

    if (!metadata.title) metadata.title = baseName
    return metadata
  }

  private async extractEpubMetadata(filePath: string, metadata: BookMetadata) {
    const JSZip = (await import('jszip')).default
    const data = readFileSync(filePath)
    const zip = await JSZip.loadAsync(data)

    const containerXml = await zip.file('META-INF/container.xml')?.async('text')
    if (!containerXml) return

    const container = this.xmlParser.parse(containerXml)
    const rootFilePath = container?.container?.rootfiles?.rootfile?.['@_full-path']
    if (!rootFilePath) return

    const opfContent = await zip.file(rootFilePath)?.async('text')
    if (!opfContent) return

    const opf = this.xmlParser.parse(opfContent)
    const metadataNode = opf?.package?.metadata

    if (metadataNode) {
      metadata.title = this.extractText(metadataNode['dc:title']) || metadata.title
      metadata.author = this.extractText(metadataNode['dc:creator']) || metadata.author
      metadata.publisher = this.extractText(metadataNode['dc:publisher']) || metadata.publisher
      metadata.publishDate = this.extractText(metadataNode['dc:date']) || metadata.publishDate
      metadata.isbn = this.extractText(metadataNode['dc:identifier']) || metadata.isbn
      metadata.language = this.extractText(metadataNode['dc:language']) || metadata.language
      metadata.description = this.extractText(metadataNode['dc:description']) || metadata.description
    }
  }

  private async extractPdfMetadata(filePath: string, metadata: BookMetadata) {
    const pdfjsLib = await import('pdfjs-dist')
    const data = readFileSync(filePath)
    const pdf = await pdfjsLib.getDocument({ data }).promise
    const pdfMetadata = await pdf.getMetadata()

    if (pdfMetadata.info) {
      const info = pdfMetadata.info as any
      metadata.title = info.Title || metadata.title
      metadata.author = info.Author || metadata.author
      metadata.publisher = info.Producer || metadata.publisher
      metadata.publishDate = info.CreationDate || metadata.publishDate
      metadata.description = info.Subject || metadata.description
    }
  }

  private async extractFb2Metadata(filePath: string, metadata: BookMetadata) {
    const content = readFileSync(filePath, 'utf-8')
    const parsed = this.xmlParser.parse(content)
    const desc = parsed?.FictionBook?.description?.['title-info']

    if (desc) {
      metadata.title = desc['book-title'] || metadata.title
      metadata.language = desc.lang || metadata.language
      metadata.description = desc.annotation || metadata.description

      if (desc.author) {
        const author = Array.isArray(desc.author) ? desc.author[0] : desc.author
        const first = author['first-name'] || ''
        const last = author['last-name'] || ''
        metadata.author = `${first} ${last}`.trim() || metadata.author
      }
    }
  }

  private async extractCover(filePath: string, format: string): Promise<string | null> {
    try {
      if (format === 'epub') {
        const JSZip = (await import('jszip')).default
        const data = readFileSync(filePath)
        const zip = await JSZip.loadAsync(data)

        const containerXml = await zip.file('META-INF/container.xml')?.async('text')
        if (!containerXml) return null

        const container = this.xmlParser.parse(containerXml)
        const rootFilePath = container?.container?.rootfiles?.rootfile?.['@_full-path']
        if (!rootFilePath) return null

        const opfContent = await zip.file(rootFilePath)?.async('text')
        if (!opfContent) return null

        const opf = this.xmlParser.parse(opfContent)
        const manifest = opf?.package?.manifest?.item
        if (!manifest) return null

        const coverItem = Array.isArray(manifest)
          ? manifest.find((item: any) => item['@_id'] === 'cover-image' || item['@_properties'] === 'cover-image')
          : manifest

        if (coverItem?.['@_href']) {
          const coverPath = rootFilePath.includes('/')
            ? rootFilePath.substring(0, rootFilePath.lastIndexOf('/') + 1) + coverItem['@_href']
            : coverItem['@_href']

          const coverData = await zip.file(coverPath)?.async('base64')
          if (coverData) {
            const mediaType = coverItem['@_media-type'] || 'image/jpeg'
            return `data:${mediaType};base64,${coverData}`
          }
        }
      }
    } catch (e) {
      console.error('Cover extraction failed:', e)
    }
    return null
  }

  private extractText(value: any): string | undefined {
    if (!value) return undefined
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value['#text']) return String(value['#text'])
    return String(value)
  }
}
