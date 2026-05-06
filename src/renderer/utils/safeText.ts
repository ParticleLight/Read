/**
 * Safely convert any value to a display string.
 * Handles XML parser objects like { '#text': 'value', '@_attr': '...' }
 */
export function safeText(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return safeText(value[0])
  if (typeof value === 'object' && value['#text']) return String(value['#text'])
  return String(value)
}
