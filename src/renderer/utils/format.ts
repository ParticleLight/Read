export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
}

export async function extractTextPreview(filePath: string, maxLength = 120): Promise<string | null> {
  try {
    const content = await window.electronAPI.readFile(filePath)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(content))
    const cleaned = text.replace(/\s+/g, ' ').trim()
    return cleaned.slice(0, maxLength) || null
  } catch {
    return null
  }
}

export const formatColors: Record<string, string> = {
  epub: 'bg-blue-600',
  pdf: 'bg-red-600',
  mobi: 'bg-orange-600',
  txt: 'bg-gray-600',
  fb2: 'bg-green-600',
  cbz: 'bg-purple-600',
  cbr: 'bg-pink-600',
  html: 'bg-cyan-600',
  markdown: 'bg-teal-600',
}
