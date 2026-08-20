import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { fieldsHitByScribble, type EraseFieldHit } from '../lib/eraseFields'
import { pathsWithinDistance } from '../lib/geometry'
import type { InkPoint, InkStroke } from '../types'

export type InkTool = 'pen' | 'erase'
export type { EraseFieldHit }

type InkCanvasProps = {
  strokes: InkStroke[]
  onChange: (strokes: InkStroke[]) => void
  /** Called when erase scribble covers typed fields marked with data-erase-*. */
  onEraseFields?: (fields: EraseFieldHit[]) => void
  enabled: boolean
  tool?: InkTool
  color?: string
  size?: number
  className?: string
}

const MIN_POINT_DIST2 = 0.2
const PRESSURE_SMOOTH = 0.55

function uid(): string {
  return `stroke-${Math.random().toString(36).slice(2, 10)}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(round2(x0), round2(y0), round2((x0 + x1) / 2), round2((y0 + y1) / 2))
      return acc
    },
    ['M', round2(stroke[0][0]), round2(stroke[0][1]), 'Q'] as (string | number)[],
  )
  d.push('Z')
  return d.join(' ')
}

function pointsToPath(
  points: InkPoint[],
  size: number,
  opts: { complete: boolean; simulatePressure: boolean },
): string {
  const outline = getStroke(
    points.map((p) => [p.x, p.y, p.pressure]),
    {
      size,
      thinning: 0.5,
      smoothing: opts.complete ? 0.68 : 0.52,
      streamline: opts.complete ? 0.55 : 0.32,
      easing: (t) => t * t * (3 - 2 * t),
      simulatePressure: opts.simulatePressure,
      start: { taper: opts.complete ? size * 0.15 : 0, cap: true },
      end: { taper: opts.complete ? size * 0.35 : 0, cap: true },
      last: opts.complete,
    },
  )
  return getSvgPathFromStroke(outline)
}

function eraseRadius(penSize: number): number {
  return Math.max(16, penSize * 3.5)
}

function strokesHitByScribble(
  strokes: InkStroke[],
  scribble: InkPoint[],
  penSize: number,
): Set<string> {
  const hit = new Set<string>()
  const erasePath = scribble.map((p) => ({ x: p.x, y: p.y }))
  const base = eraseRadius(penSize)
  for (const stroke of strokes) {
    const threshold = base + stroke.size * 0.6
    const strokePath = stroke.points.map((p) => ({ x: p.x, y: p.y }))
    if (pathsWithinDistance(strokePath, erasePath, threshold)) {
      hit.add(stroke.id)
    }
  }
  return hit
}

function isPenPointer(type: string): boolean {
  return type === 'pen'
}

export function InkCanvas({
  strokes,
  onChange,
  onEraseFields,
  enabled,
  tool = 'pen',
  color = '#3a2f35',
  size = 4,
  className = '',
}: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draftPathRef = useRef<SVGPathElement>(null)
  const drawing = useRef(false)
  const pointerId = useRef<number | null>(null)
  const pointerType = useRef('')
  const draftPoints = useRef<InkPoint[]>([])
  const predictedPoints = useRef<InkPoint[]>([])
  const raf = useRef(0)
  const pathCache = useRef(new Map<string, string>())
  const strokesRef = useRef(strokes)
  const onChangeRef = useRef(onChange)
  const onEraseFieldsRef = useRef(onEraseFields)
  const toolRef = useRef(tool)
  const colorRef = useRef(color)
  const sizeRef = useRef(size)
  strokesRef.current = strokes
  onChangeRef.current = onChange
  onEraseFieldsRef.current = onEraseFields
  toolRef.current = tool
  colorRef.current = color
  sizeRef.current = size

  const erasing = tool === 'erase'
  const draftSize = erasing ? eraseRadius(size) * 1.1 : size
  const draftColor = erasing ? 'rgba(90, 60, 75, 0.22)' : color

  const toLocal = useCallback(
    (
      e: { clientX: number; clientY: number; pressure: number },
      rect: DOMRect,
      prevPressure: number,
    ): InkPoint => {
      const raw = e.pressure > 0 ? e.pressure : 0.5
      const pressure = isPenPointer(pointerType.current)
        ? Math.min(1, Math.max(0.1, prevPressure * (1 - PRESSURE_SMOOTH) + raw * PRESSURE_SMOOTH))
        : raw
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure,
      }
    },
    [],
  )

  const paintDraft = useCallback(() => {
    const el = draftPathRef.current
    if (!el) return
    const pts = draftPoints.current
    if (pts.length === 0) {
      el.setAttribute('d', '')
      return
    }
    const predicted = predictedPoints.current
    const renderPts = predicted.length > 0 ? pts.concat(predicted) : pts
    const simulatePressure = !isPenPointer(pointerType.current)
    el.setAttribute(
      'd',
      pointsToPath(renderPts, draftSize, { complete: false, simulatePressure }),
    )
  }, [draftSize])

  const schedulePaint = useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      paintDraft()
    })
  }, [paintDraft])

  const appendPoint = (point: InkPoint) => {
    const pts = draftPoints.current
    const last = pts[pts.length - 1]
    if (last) {
      const dx = point.x - last.x
      const dy = point.y - last.y
      if (dx * dx + dy * dy < MIN_POINT_DIST2) {
        last.pressure = point.pressure
        last.x = point.x
        last.y = point.y
        return
      }
    }
    pts.push(point)
  }

  const endStroke = () => {
    if (!drawing.current) return
    drawing.current = false
    pointerId.current = null
    if (raf.current) {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }

    const prev = draftPoints.current
    const erasingNow = toolRef.current === 'erase'
    draftPoints.current = []
    predictedPoints.current = []
    draftPathRef.current?.setAttribute('d', '')

    if (prev.length < 2) return

    if (erasingNow) {
      const current = strokesRef.current
      const hit = strokesHitByScribble(current, prev, sizeRef.current)
      if (hit.size > 0) {
        onChangeRef.current(current.filter((s) => !hit.has(s.id)))
      }

      const svg = svgRef.current
      const root = svg?.parentElement
      if (svg && root && onEraseFieldsRef.current) {
        const fields = fieldsHitByScribble(
          root,
          svg.getBoundingClientRect(),
          prev,
          eraseRadius(sizeRef.current),
        )
        if (fields.length > 0) onEraseFieldsRef.current(fields)
      }
      return
    }

    const stroke: InkStroke = {
      id: uid(),
      points: prev,
      color: colorRef.current,
      size: sizeRef.current,
    }
    onChangeRef.current([...strokesRef.current, stroke])
  }

  const finishPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointerId.current !== null && e.pointerId !== pointerId.current) return
    endStroke()
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    if (drawing.current) return

    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drawing.current = true
    pointerId.current = e.pointerId
    pointerType.current = e.pointerType
    const rect = svgRef.current?.getBoundingClientRect() ?? new DOMRect()
    draftPoints.current = [toLocal(e, rect, 0.5)]
    predictedPoints.current = []
    schedulePaint()
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled || !drawing.current) return
    if (pointerId.current !== null && e.pointerId !== pointerId.current) return
    e.preventDefault()

    const native = e.nativeEvent
    const rect = svgRef.current?.getBoundingClientRect() ?? new DOMRect()
    const coalesced =
      typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length > 0
        ? native.getCoalescedEvents()
        : [native]

    let prevPressure = draftPoints.current[draftPoints.current.length - 1]?.pressure ?? 0.5
    for (const ev of coalesced) {
      const point = toLocal(ev, rect, prevPressure)
      prevPressure = point.pressure
      appendPoint(point)
    }

    if (typeof native.getPredictedEvents === 'function') {
      const predicted = native.getPredictedEvents()
      const preds: InkPoint[] = []
      let pPress = prevPressure
      for (const ev of predicted) {
        const point = toLocal(ev, rect, pPress)
        pPress = point.pressure
        preds.push(point)
      }
      predictedPoints.current = preds
    } else {
      predictedPoints.current = []
    }

    schedulePaint()
  }

  useLayoutEffect(() => {
    paintDraft()
  }, [paintDraft])

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  useEffect(() => {
    const prevent = (ev: TouchEvent) => {
      if (enabled && drawing.current) ev.preventDefault()
    }
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => document.removeEventListener('touchmove', prevent)
  }, [enabled])

  const liveIds = new Set(strokes.map((s) => s.id))
  for (const id of pathCache.current.keys()) {
    if (!liveIds.has(id)) pathCache.current.delete(id)
  }

  return (
    <svg
      ref={svgRef}
      className={`ink-layer${enabled ? '' : ' disabled'}${erasing ? ' erase-mode' : ''} ${className}`.trim()}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      {strokes.map((s) => {
        let d = pathCache.current.get(s.id)
        if (!d) {
          d = pointsToPath(s.points, s.size, {
            complete: true,
            simulatePressure: s.points.every((p) => p.pressure === 0.5),
          })
          pathCache.current.set(s.id, d)
        }
        return <path key={s.id} d={d} fill={s.color} />
      })}
      <path ref={draftPathRef} fill={draftColor} />
    </svg>
  )
}

type InkToolsProps = {
  tool: InkTool
  onToolChange: (tool: InkTool) => void
  onUndo: () => void
  onClear: () => void
  canUndo?: boolean
  canClear?: boolean
}

export function InkTools({
  tool,
  onToolChange,
  onUndo,
  onClear,
  canUndo = false,
  canClear = false,
}: InkToolsProps) {
  return (
    <div className="ink-tools">
      <button
        type="button"
        className={`tool-btn${tool === 'pen' ? ' active' : ''}`}
        onClick={() => onToolChange('pen')}
        aria-pressed={tool === 'pen'}
      >
        Write
      </button>
      <button
        type="button"
        className={`tool-btn${tool === 'erase' ? ' active' : ''}`}
        onClick={() => onToolChange('erase')}
        aria-pressed={tool === 'erase'}
      >
        Erase
      </button>
      <button type="button" className="tool-btn" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" className="tool-btn" onClick={onClear} disabled={!canClear}>
        Clear ink
      </button>
    </div>
  )
}
