export function highlightTextInDOM(container: HTMLElement, query: string): HTMLElement[] {
  const marks: HTMLElement[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

  const lowerQuery = query.toLowerCase()
  for (const node of textNodes) {
    const text = node.textContent || ''
    const lowerText = text.toLowerCase()
    let idx = lowerText.indexOf(lowerQuery)
    if (idx === -1) continue

    const parent = node.parentNode
    if (!parent) continue

    const fragments: (string | HTMLElement)[] = []
    let lastIdx = 0
    while (idx !== -1) {
      fragments.push(text.slice(lastIdx, idx))
      const mark = document.createElement('mark')
      mark.style.backgroundColor = 'rgba(251,191,36,0.3)'
      mark.style.borderRadius = '2px'
      mark.style.color = 'inherit'
      mark.textContent = text.slice(idx, idx + query.length)
      fragments.push(mark)
      marks.push(mark)
      lastIdx = idx + query.length
      const nextIdx = lowerText.indexOf(lowerQuery, lastIdx)
      idx = nextIdx
    }
    if (lastIdx < text.length) {
      fragments.push(text.slice(lastIdx))
    }
    for (const frag of fragments) {
      parent.insertBefore(typeof frag === 'string' ? document.createTextNode(frag) : frag, node)
    }
    parent.removeChild(node)
  }
  return marks
}
