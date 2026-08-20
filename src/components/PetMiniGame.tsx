import { useEffect, useRef } from 'react'
import { petGameBoosts, type PetGameBoosts } from '../lib/petGame'

type PetMiniGameProps = {
  totalChecks: number
  evolution: number
  highScore: number
  onHighScore: (score: number) => void
}

type Pipe = { x: number; gapY: number; scored: boolean }

type RunState = {
  mode: 'ready' | 'playing' | 'dead'
  y: number
  vy: number
  pipes: Pipe[]
  score: number
  shields: number
  invuln: number
  ground: number
  tick: number
  boosts: PetGameBoosts
}

const W = 360
const H = 500
const GROUND_H = 64
const PET_X = 86
const PET_R = 18
const PIPE_W = 50
const PIPE_SPACING = 196

function makeRun(boosts: PetGameBoosts): RunState {
  return {
    mode: 'ready',
    y: H * 0.42,
    vy: 0,
    pipes: [],
    score: 0,
    shields: boosts.shields,
    invuln: 0,
    ground: 0,
    tick: 0,
    boosts,
  }
}

function spawnPipe(x: number, gap: number): Pipe {
  const playH = H - GROUND_H
  const margin = 70
  const minY = margin + gap / 2
  const maxY = playH - margin - gap / 2
  return {
    x,
    gapY: minY + Math.random() * Math.max(8, maxY - minY),
    scored: false,
  }
}

function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const nx = Math.max(rx, Math.min(cx, rx + rw))
  const ny = Math.max(ry, Math.min(cy, ry + rh))
  const dx = cx - nx
  const dy = cy - ny
  return dx * dx + dy * dy < r * r
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  a: number,
) {
  ctx.save()
  ctx.globalAlpha = a
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x, y, 12 * s, 0, Math.PI * 2)
  ctx.arc(x + 14 * s, y + 2 * s, 16 * s, 0, Math.PI * 2)
  ctx.arc(x + 28 * s, y, 11 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  flap: number,
  evolution: number,
  flash: boolean,
) {
  const e = Math.min(75, Math.max(1, evolution))
  const egg = e <= 6
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  if (flash) ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 80))

  const fur = '#C9B0E8'
  const furLight = '#E4D4F5'

  if (!egg) {
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(-6, 4 + flap * 6, 9, 5, -0.5 + flap, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(8, 4 + flap * 6, 9, 5, 0.5 - flap, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = egg ? '#F5EDE0' : fur
  ctx.beginPath()
  if (egg) ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2)
  else ctx.ellipse(0, 1, 17, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  if (egg) {
    ctx.fillStyle = '#D4B8E8'
    ctx.beginPath()
    ctx.ellipse(-5, -2, 3.5, 3, 0, 0, Math.PI * 2)
    ctx.ellipse(6, 4, 2.8, 2.4, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(-5, -4, 7, 5, -0.4, 0, Math.PI * 2)
    ctx.fill()
    if (e >= 12) {
      ctx.fillStyle = '#F0D9C8'
      ctx.beginPath()
      ctx.moveTo(-8, -12)
      ctx.quadraticCurveTo(-12, -22, -4, -11)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(8, -12)
      ctx.quadraticCurveTo(12, -22, 4, -11)
      ctx.fill()
    }
  }

  ctx.fillStyle = '#2A1F3D'
  ctx.beginPath()
  ctx.ellipse(-5, -2, 2.2, 2.6, 0, 0, Math.PI * 2)
  ctx.ellipse(5, -2, 2.2, 2.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-4.2, -2.8, 0.8, 0, Math.PI * 2)
  ctx.arc(5.8, -2.8, 0.8, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#5A4068'
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, 3.5, 4, 0.15, Math.PI - 0.15)
  ctx.stroke()

  ctx.restore()

  if (e >= 48 && !egg) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.fillStyle = '#9B6FD4'
    ctx.beginPath()
    ctx.moveTo(0, -20)
    ctx.lineTo(4, -12)
    ctx.lineTo(-4, -12)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

function drawHedge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cap: 'top' | 'bottom',
) {
  const grd = ctx.createLinearGradient(x, y, x + w, y)
  grd.addColorStop(0, '#5ea87a')
  grd.addColorStop(0.45, '#4a8f6a')
  grd.addColorStop(1, '#3d7a58')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 10)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(x + 6, y + 8, 8, Math.max(0, h - 16))

  const flowerY = cap === 'bottom' ? y + 10 : y + h - 14
  ctx.fillStyle = '#E8A8B8'
  ctx.beginPath()
  ctx.arc(x + w * 0.35, flowerY, 3.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#F0D9C8'
  ctx.beginPath()
  ctx.arc(x + w * 0.68, flowerY + (cap === 'bottom' ? 8 : -8), 2.6, 0, Math.PI * 2)
  ctx.fill()
}

export function PetMiniGame({
  totalChecks,
  evolution,
  highScore,
  onHighScore,
}: PetMiniGameProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const checksRef = useRef(totalChecks)
  const evoRef = useRef(evolution)
  const highRef = useRef(highScore)
  const onHighRef = useRef(onHighScore)
  checksRef.current = totalChecks
  evoRef.current = evolution
  highRef.current = highScore
  onHighRef.current = onHighScore

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let run = makeRun(petGameBoosts(checksRef.current))
    let raf = 0
    let last = performance.now()
    let running = true

    const resize = () => {
      const cssW = wrap.clientWidth
      const cssH = Math.round((cssW * H) / W)
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr * (cssW / W), 0, 0, dpr * (cssH / H), 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const flap = () => {
      if (run.mode === 'dead') {
        run = makeRun(petGameBoosts(checksRef.current))
        run.mode = 'playing'
        run.vy = -run.boosts.flap
        run.pipes = [spawnPipe(W + 20, run.boosts.gap)]
        return
      }
      if (run.mode === 'ready') {
        run = makeRun(petGameBoosts(checksRef.current))
        run.mode = 'playing'
        run.pipes = [spawnPipe(W + 20, run.boosts.gap)]
      }
      run.vy = -run.boosts.flap
    }

    const hitPet = () => {
      if (run.mode !== 'playing' || run.invuln > 0) return
      if (run.shields > 0) {
        run.shields -= 1
        run.invuln = 1.15
        run.vy = -run.boosts.flap * 0.7
        return
      }
      run.mode = 'dead'
      if (run.score > highRef.current) onHighRef.current(run.score)
    }

    const onPointer = (e: PointerEvent) => {
      e.preventDefault()
      flap()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      e.preventDefault()
      flap()
    }

    canvas.addEventListener('pointerdown', onPointer, { passive: false })
    canvas.addEventListener('keydown', onKey)

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(32, now - last) / 16.67
      last = now
      run.tick += dt
      const b = run.boosts
      const playH = H - GROUND_H

      if (run.mode === 'playing') {
        run.vy = Math.min(11, run.vy + b.gravity * dt)
        run.y += run.vy * dt
        run.ground = (run.ground + b.speed * dt) % 24
        run.invuln = Math.max(0, run.invuln - (dt * 16.67) / 1000)

        for (const p of run.pipes) p.x -= b.speed * dt
        if (run.pipes.length === 0 || run.pipes[run.pipes.length - 1].x < W - PIPE_SPACING) {
          run.pipes.push(spawnPipe(W + PIPE_W, b.gap))
        }
        run.pipes = run.pipes.filter((p) => p.x > -PIPE_W - 8)

        const r = PET_R * b.hitboxScale
        for (const p of run.pipes) {
          if (!p.scored && p.x + PIPE_W < PET_X) {
            p.scored = true
            run.score += 1
          }
          const topH = p.gapY - b.gap / 2
          const botY = p.gapY + b.gap / 2
          if (
            run.mode === 'playing' &&
            (circleHitsRect(PET_X, run.y, r, p.x, 0, PIPE_W, topH) ||
              circleHitsRect(PET_X, run.y, r, p.x, botY, PIPE_W, playH - botY))
          ) {
            hitPet()
          }
        }
        if (run.mode === 'playing' && (run.y - r < 0 || run.y + r > playH)) hitPet()
      } else if (run.mode === 'ready') {
        run.y = H * 0.42 + Math.sin(run.tick * 0.08) * 6
        run.ground = (run.ground + 0.6 * dt) % 24
      } else {
        run.vy = Math.min(12, run.vy + 0.45 * dt)
        run.y = Math.min(playH - 10, run.y + run.vy * dt)
      }

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#fdeef4')
      sky.addColorStop(0.55, '#e8d4f5')
      sky.addColorStop(1, '#d4bce8')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      drawCloud(ctx, (80 - run.ground * 0.35 + W) % (W + 60) - 30, 70, 1.1, 0.55)
      drawCloud(ctx, (220 - run.ground * 0.5 + W) % (W + 80) - 40, 120, 0.85, 0.4)
      drawCloud(ctx, (300 - run.ground * 0.25 + W) % (W + 70) - 30, 48, 0.7, 0.5)

      for (const p of run.pipes) {
        const topH = p.gapY - b.gap / 2
        const botY = p.gapY + b.gap / 2
        drawHedge(ctx, p.x, 0, PIPE_W, topH, 'top')
        drawHedge(ctx, p.x, botY, PIPE_W, playH - botY, 'bottom')
      }

      // Ground
      ctx.fillStyle = '#E8D5B8'
      ctx.fillRect(0, playH, W, GROUND_H)
      ctx.fillStyle = '#4a8f6a'
      ctx.fillRect(0, playH, W, 10)
      ctx.fillStyle = '#6bb08c'
      for (let i = -24; i < W + 24; i += 24) {
        ctx.beginPath()
        ctx.moveTo(i - run.ground, playH + 10)
        ctx.lineTo(i + 12 - run.ground, playH)
        ctx.lineTo(i + 24 - run.ground, playH + 10)
        ctx.closePath()
        ctx.fill()
      }

      const rot = Math.max(-0.5, Math.min(0.7, run.vy * 0.06))
      const flapWing = run.mode === 'playing' ? Math.max(0, -run.vy) / 10 : (Math.sin(run.tick * 0.12) + 1) / 6
      drawPet(
        ctx,
        PET_X,
        run.y,
        rot,
        flapWing,
        evoRef.current,
        run.invuln > 0,
      )

      if (run.shields > 0 && run.mode !== 'dead') {
        ctx.strokeStyle = 'rgba(240, 211, 120, 0.85)'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.arc(PET_X, run.y, PET_R + 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = '#e0a84a'
        ctx.font = '700 13px Nunito, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`✨ ${run.shields}`, 12, 28)
      }

      if (run.mode === 'playing' || run.mode === 'dead') {
        ctx.fillStyle = '#5c3d4f'
        ctx.font = '700 28px Caveat, cursive'
        ctx.textAlign = 'center'
        ctx.fillText(String(run.score), W / 2, 42)
      }

      if (run.mode === 'ready' || run.mode === 'dead') {
        ctx.fillStyle = 'rgba(255, 250, 252, 0.94)'
        roundRectPath(ctx, 28, H * 0.34, W - 56, run.mode === 'dead' ? 148 : 92, 18)
        ctx.fill()
        ctx.strokeStyle = 'rgba(90, 60, 75, 0.16)'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = '#5c3d4f'
        ctx.textAlign = 'center'
        ctx.font = '700 28px Caveat, cursive'
        ctx.fillText(run.mode === 'dead' ? 'Oof!' : 'Sky Hop', W / 2, H * 0.34 + 38)
        ctx.font = '700 14px Nunito, system-ui, sans-serif'
        ctx.fillStyle = '#7a6570'
        if (run.mode === 'dead') {
          ctx.fillText(`Score ${run.score}  ·  Best ${Math.max(highRef.current, run.score)}`, W / 2, H * 0.34 + 68)
          ctx.fillText('Tap to hop again', W / 2, H * 0.34 + 96)
          if (run.score >= highRef.current && run.score > 0) {
            ctx.fillStyle = '#7b5ea7'
            ctx.fillText('New best!', W / 2, H * 0.34 + 122)
          }
        } else {
          ctx.fillText('Tap to hop through the garden', W / 2, H * 0.34 + 68)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onPointer)
      canvas.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={wrapRef} className="pet-game-wrap">
      <canvas
        ref={canvasRef}
        className="pet-game-canvas"
        tabIndex={0}
        aria-label="Sky Hop mini-game. Tap or press space to hop."
      />
    </div>
  )
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
