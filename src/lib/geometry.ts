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

export function polygonToPath(points: Point[]): string {
  if (!points.length) return ''
  return (
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
    ' Z'
  )
}
