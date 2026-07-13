import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { InkPoint, InkStroke } from '../types'

type InkCanvasProps = {
  strokes: InkStroke[]
  onChange: (strokes: InkStroke[]) => void
  enabled: boolean
  color?: string
  size?: number
  className?: string
}

function uid(): string {
  return `stroke-${Math.random().toString(36).slice(2, 10)}`
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[],
  )
  d.push('Z')
  return d.join(' ')
}

function pointsToPath(points: InkPoint[], size: number): string {
  const outline = getStroke(
    points.map((p) => [p.x, p.y, p.pressure]),
    {
      size,
      thinning: 0.55,
      smoothing: 0.5,
      streamline: 0.45,
      easing: (t) => t,
      start: { taper: 0, cap: true },
      end: { taper: size * 0.4, cap: true },
    },
  )
  return getSvgPathFromStroke(outline)
}

export function InkCanvas({
  strokes,
  onChange,
  enabled,
  color = '#3a2f35',
  size = 4,
  className = '',
}: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draft, setDraft] = useState<InkPoint[] | null>(null)
  const drawing = useRef(false)

  const toLocal = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0, pressure: 0.5 }
    const rect = svg.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled) return
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drawing.current = true
    setDraft([toLocal(e)])
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled || !drawing.current) return
    e.preventDefault()
    setDraft((prev) => (prev ? [...prev, toLocal(e)] : [toLocal(e)]))
  }

  const endStroke = () => {
    if (!drawing.current) return
    drawing.current = false
    setDraft((prev) => {
      if (prev && prev.length > 1) {
        const stroke: InkStroke = {
          id: uid(),
          points: prev,
          color,
          size,
        }
        onChange([...strokes, stroke])
      }
      return null
    })
  }

  useEffect(() => {
    const prevent = (ev: TouchEvent) => {
      if (enabled && drawing.current) ev.preventDefault()
    }
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => document.removeEventListener('touchmove', prevent)
  }, [enabled])

  return (
    <svg
      ref={svgRef}
      className={`ink-layer${enabled ? '' : ' disabled'} ${className}`.trim()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={endStroke}
    >
      {strokes.map((s) => (
        <path
          key={s.id}
          d={pointsToPath(s.points, s.size)}
          fill={s.color}
        />
      ))}
      {draft && draft.length > 1 && (
        <path d={pointsToPath(draft, size)} fill={color} />
      )}
    </svg>
  )
}

type InkToolsProps = {
  onUndo: () => void
  onClear: () => void
  disabled?: boolean
}

export function InkTools({ onUndo, onClear, disabled }: InkToolsProps) {
  return (
    <div className="ink-tools">
      <button type="button" className="tool-btn" onClick={onUndo} disabled={disabled}>
        Undo
      </button>
      <button type="button" className="tool-btn" onClick={onClear} disabled={disabled}>
        Clear ink
      </button>
    </div>
  )
}
