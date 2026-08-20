/** Habit-powered difficulty for the care-pet Sky Hop mini-game. */

export type PetGameBoosts = {
  /** Upward impulse per tap */
  flap: number
  gravity: number
  /** Vertical gap between hedges, in canvas pixels */
  gap: number
  /** World scroll speed */
  speed: number
  /** Extra hits you can take at the start of a run */
  shields: number
  /** 1 = full pet size; lower is a more forgiving hitbox */
  hitboxScale: number
}

const CHECKS_FOR_MAX = 360

export function petGameBoosts(totalChecks: number): PetGameBoosts {
  const checks = Math.max(0, Math.floor(totalChecks))
  const t = Math.min(1, checks / CHECKS_FOR_MAX)
  const ease = t * t * (3 - 2 * t)

  return {
    flap: 6.6 + ease * 1.7,
    gravity: 0.36 - ease * 0.09,
    gap: 150 + ease * 64,
    speed: 2.45 - ease * 0.55,
    shields: Math.min(3, Math.floor(checks / 25)),
    hitboxScale: 1 - ease * 0.2,
  }
}

export function petGameBoostLabels(totalChecks: number): string[] {
  const b = petGameBoosts(totalChecks)
  const labels: string[] = []
  if (b.shields > 0) {
    labels.push(
      `${b.shields} sparkle shield${b.shields === 1 ? '' : 's'}`,
    )
  }
  if (b.gap > 158) labels.push('Wider gaps')
  if (b.flap > 7.1) labels.push('Stronger hops')
  if (b.speed < 2.2) labels.push('Gentler breeze')
  if (labels.length === 0) {
    labels.push('Check habits to earn shields & easier hops')
  }
  return labels
}
