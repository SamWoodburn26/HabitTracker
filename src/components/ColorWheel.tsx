import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clamp, hexToHsv, hsvToHex, normalizeHex } from '../lib/color'

type ColorWheelProps = {
  value: string
  onChange: (hex: string) => void
  label?: string
  size?: number
}

export function ColorWheel({
  value,
  onChange,
  label,
  size = 180,
}: ColorWheelProps) {
  const wheelRef = useRef<HTMLCanvasElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const hsv = useMemo(() => hexToHsv(normalizeHex(value)), [value])
  const [hexDraft, setHexDraft] = useState(normalizeHex(value))
  const dragging = useRef<'hue' | 'sv' | null>(null)

  useEffect(() => {
    setHexDraft(normalizeHex(value))
  }, [value])

  useEffect(() => {
    const canvas = wheelRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = size / 2
    const cy = size / 2
    const outer = size / 2 - 2
    const inner = outer - 22

    ctx.clearRect(0, 0, size, size)
    for (let angle = 0; angle < 360; angle += 1) {
      const start = ((angle - 1) * Math.PI) / 180
      const end = ((angle + 1) * Math.PI) / 180
      ctx.beginPath()
      ctx.arc(cx, cy, outer, start, end)
      ctx.arc(cx, cy, inner, end, start, true)
      ctx.closePath()
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`
      ctx.fill()
    }

    // Hue marker
    const rad = (hsv.h * Math.PI) / 180
    const midR = (outer + inner) / 2
    const mx = cx + Math.cos(rad) * midR
    const my = cy + Math.sin(rad) * midR
    ctx.beginPath()
    ctx.arc(mx, my, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [size, hsv.h])

  const commit = useCallback(
    (h: number, s: number, v: number) => {
      onChange(hsvToHex(h, s, v))
    },
    [onChange],
  )

  const pickHue = (clientX: number, clientY: number) => {
    const canvas = wheelRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left - size / 2
    const y = clientY - rect.top - size / 2
    const dist = Math.sqrt(x * x + y * y)
    const outer = size / 2 - 2
    const inner = outer - 22
    if (dist < inner - 4 || dist > outer + 4) return false
    let angle = (Math.atan2(y, x) * 180) / Math.PI
    if (angle < 0) angle += 360
    commit(angle, hsv.s, hsv.v)
    return true
  }

  const pickSv = (clientX: number, clientY: number) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = clamp((clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
    commit(hsv.h, s, v)
  }

  const onWheelPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (pickHue(e.clientX, e.clientY)) dragging.current = 'hue'
  }

  const onSvPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragging.current = 'sv'
    pickSv(e.clientX, e.clientY)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current === 'hue') pickHue(e.clientX, e.clientY)
    if (dragging.current === 'sv') pickSv(e.clientX, e.clientY)
  }

  const onPointerUp = () => {
    dragging.current = null
  }

  const svBg = `linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`

  return (
    <div className="color-wheel" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {label && <div className="color-wheel-label">{label}</div>}
      <div className="color-wheel-body">
        <canvas
          ref={wheelRef}
          className="color-wheel-ring"
          width={size}
          height={size}
          onPointerDown={onWheelPointerDown}
          aria-label="Hue rainbow wheel"
        />
        <div
          ref={svRef}
          className="color-wheel-sv"
          style={{ background: svBg }}
          onPointerDown={onSvPointerDown}
          role="presentation"
        >
          <span
            className="color-wheel-sv-knob"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: normalizeHex(value),
            }}
          />
        </div>
      </div>
      <div className="color-wheel-hex-row">
        <span
          className="color-wheel-preview"
          style={{ background: normalizeHex(value) }}
        />
        <input
          className="color-wheel-hex"
          value={hexDraft}
          onChange={(e) => {
            const next = e.target.value
            setHexDraft(next.startsWith('#') ? next : `#${next}`)
          }}
          onBlur={() => {
            const n = normalizeHex(hexDraft)
            setHexDraft(n)
            onChange(n)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = normalizeHex(hexDraft)
              setHexDraft(n)
              onChange(n)
            }
          }}
          aria-label="Hex color"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
