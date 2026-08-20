export type Point = { x: number; y: number }

/** Ray-casting point-in-polygon */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function strokeIntersectsPolygon(
  points: Point[],
  polygon: Point[],
): boolean {
  if (points.length === 0 || polygon.length < 3) return false
  const sampleEvery = Math.max(1, Math.floor(points.length / 40))
  for (let i = 0; i < points.length; i += sampleEvery) {
    if (pointInPolygon(points[i], polygon)) return true
  }
  return pointInPolygon(points[points.length - 1], polygon)
}

/** True when two polylines come within `threshold` of each other. */
export function pathsWithinDistance(
  a: Point[],
  b: Point[],
  threshold: number,
): boolean {
  if (a.length === 0 || b.length === 0 || threshold <= 0) return false
  const sampleA = samplePoints(a, 48)
  const sampleB = samplePoints(b, 64)
  const t2 = threshold * threshold
  for (const p of sampleA) {
    for (const q of sampleB) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      if (dx * dx + dy * dy <= t2) return true
    }
  }
  return false
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

export function polygonToPath(points: Point[]): string {
  if (!points.length) return ''
  return (
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
    ' Z'
  )
}
