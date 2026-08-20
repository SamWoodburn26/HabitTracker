export type EraseFieldHit = {
  field: string
  index?: number
  entryId?: string
}

type Point = { x: number; y: number }

/** Find typed fields under an erase scribble (coords relative to `surfaceRect`). */
export function fieldsHitByScribble(
  root: ParentNode,
  surfaceRect: DOMRect,
  scribble: Point[],
  radius: number,
): EraseFieldHit[] {
  if (scribble.length === 0) return []
  const nodes = root.querySelectorAll<HTMLElement>('[data-erase-field]')
  if (nodes.length === 0) return []

  const sampled = samplePoints(scribble, 48)
  const hits = new Map<string, EraseFieldHit>()

  for (const el of nodes) {
    const box = fieldHitBox(el, surfaceRect, radius)
    if (!box) continue

    const over = sampled.some(
      (p) =>
        p.x >= box.left &&
        p.x <= box.right &&
        p.y >= box.top &&
        p.y <= box.bottom,
    )
    if (!over) continue

    const field = el.dataset.eraseField
    if (!field) continue
    const indexRaw = el.dataset.eraseIndex
    const entryId = el.dataset.eraseEntry
    const index = indexRaw != null && indexRaw !== '' ? Number(indexRaw) : undefined
    const key = `${field}:${entryId ?? ''}:${index ?? ''}`
    hits.set(key, {
      field,
      ...(entryId ? { entryId } : {}),
      ...(index != null && !Number.isNaN(index) ? { index } : {}),
    })
  }

  return [...hits.values()]
}

function fieldHitBox(
  el: HTMLElement,
  surfaceRect: DOMRect,
  radius: number,
): { left: number; right: number; top: number; bottom: number } | null {
  const r = el.getBoundingClientRect()
  const left = r.left - surfaceRect.left - radius
  const right = r.right - surfaceRect.left + radius
  const top = r.top - surfaceRect.top - radius

  // Full-bleed journal text: only the written content area is erasable.
  if (
    el instanceof HTMLTextAreaElement &&
    el.dataset.eraseField === 'journal-text'
  ) {
    if (!el.value.trim()) return null
    const contentHeight = measureTextareaContentHeight(el)
    if (contentHeight <= 0) return null
    return {
      left,
      right,
      top,
      bottom: r.top - surfaceRect.top + contentHeight + radius,
    }
  }

  return {
    left,
    right,
    top,
    bottom: r.bottom - surfaceRect.top + radius,
  }
}

function measureTextareaContentHeight(textarea: HTMLTextAreaElement): number {
  const clone = textarea.cloneNode(false) as HTMLTextAreaElement
  clone.value = textarea.value
  clone.style.position = 'absolute'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.height = '0'
  clone.style.minHeight = '0'
  clone.style.maxHeight = 'none'
  clone.style.overflow = 'hidden'
  clone.setAttribute('aria-hidden', 'true')
  const parent = textarea.parentElement
  if (!parent) return 0
  parent.appendChild(clone)
  const height = clone.scrollHeight
  clone.remove()
  return height
}

function samplePoints(points: Point[], maxSamples: number): Point[] {
  if (points.length <= maxSamples) return points
  const step = Math.max(1, Math.floor(points.length / maxSamples))
  const sampled: Point[] = []
  for (let i = 0; i < points.length; i += step) sampled.push(points[i])
  const last = points[points.length - 1]
  if (sampled[sampled.length - 1] !== last) sampled.push(last)
  return sampled
}
