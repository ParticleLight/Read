import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export class ConverterService {
  async convertMobiToEpub(mobiPath: string): Promise<string | null> {
    const outputDir = dirname(mobiPath)
    const baseName = basename(mobiPath, extname(mobiPath))
    const epubPath = join(outputDir, `${baseName}.epub`)

    if (existsSync(epubPath)) return epubPath

    try {
      await execFileAsync('ebook-convert', [mobiPath, epubPath])
      if (existsSync(epubPath)) return epubPath
    } catch (e) {
      console.error('Calibre conversion failed:', e)
    }

    return null
  }

  isCalibreInstalled(): boolean {
    try {
      const { execFileSync } = require('child_process')
      execFileSync('ebook-convert', ['--version'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }
}
