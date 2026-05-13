let mupdf: any = null

async function getMupdf() {
  if (!mupdf) {
    try {
      mupdf = await import('mupdf')
      console.log('MuPDF loaded successfully, keys:', Object.keys(mupdf).slice(0, 10))
    } catch (e: any) {
      console.error('MuPDF import failed:', e?.message || e)
      throw e
    }
  }
  return mupdf
}

interface PdfDoc {
  doc: any
  pageCount: number
  pageBounds: Array<{ width: number; height: number }>
}

const docs = new Map<number, PdfDoc>()
let nextId = 1

export async function pdfOpen(filePath: string): Promise<{
  id: number
  pageCount: number
  pageBounds: Array<{ width: number; height: number }>
}> {
  const mu = await getMupdf()
  const doc = mu.PDFDocument.openDocument(filePath)
  const pageCount = doc.countPages()
  const pageBounds: Array<{ width: number; height: number }> = []
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i)
    const bounds = page.getBounds()
    pageBounds.push({
      width: bounds[2] - bounds[0],
      height: bounds[3] - bounds[1],
    })
  }
  const id = nextId++
  docs.set(id, { doc, pageCount, pageBounds })
  return { id, pageCount, pageBounds }
}

export async function pdfRenderPage(
  id: number,
  pageNum: number,
  pixelWidth: number,
  pixelHeight: number,
): Promise<string> {
  const mu = await getMupdf()
  const entry = docs.get(id)
  if (!entry) throw new Error('Document not found')

  const page = entry.doc.loadPage(pageNum)
  const bounds = page.getBounds()
  const pageW = bounds[2] - bounds[0]
  const pageH = bounds[3] - bounds[1]
  const scaleX = pixelWidth / pageW
  const scaleY = pixelHeight / pageH
  const scale = Math.min(scaleX, scaleY)
  const matrix = mu.Matrix.scale(scale, scale)
  const pixmap = page.toPixmap(matrix, mu.ColorSpace.DeviceRGB)
  const png = pixmap.asPNG() // returns Uint8Array
  const base64 = Buffer.from(png).toString('base64')
  return `data:image/png;base64,${base64}`
}

export async function pdfClose(id: number): Promise<void> {
  docs.delete(id)
}
