export const TOTAL_EVOLUTIONS = 75
export const CHECKS_PER_EVOLUTION = 9

export type PetPhase =
  | 'egg'
  | 'hatching'
  | 'newborn'
  | 'fluffball'
  | 'sitting'
  | 'standing'
  | 'crystal'
  | 'elder'

export type PetProgress = {
  /** 1–75 */
  evolution: number
  phase: PetPhase
  phaseLabel: string
  totalChecks: number
  checksIntoEvolution: number
  nextThreshold: number | null
  progressInStage: number
}

export function countHabitChecks(
  habitChecks: Record<string, Record<string, boolean>>,
): number {
  let total = 0
  for (const days of Object.values(habitChecks)) {
    for (const checked of Object.values(days)) {
      if (checked) total += 1
    }
  }
  return total
}

/** Evolution 1 at 0 checks, +1 every 10 checks, capped at 75 */
export function evolutionFromChecks(totalChecks: number): number {
  const checks = Math.max(0, Math.floor(totalChecks))
  return Math.min(
    TOTAL_EVOLUTIONS,
    Math.floor(checks / CHECKS_PER_EVOLUTION) + 1,
  )
}

/**
 * Spread phases across 75 evolutions so the label/art change early and often.
 * ~4–12 evolutions per phase (40–120 habit checks each).
 */
export function phaseFromEvolution(evolution: number): PetPhase {
  const e = Math.min(TOTAL_EVOLUTIONS, Math.max(1, evolution))
  if (e <= 4) return 'egg'
  if (e <= 10) return 'hatching'
  if (e <= 18) return 'newborn'
  if (e <= 28) return 'fluffball'
  if (e <= 40) return 'sitting'
  if (e <= 52) return 'standing'
  if (e <= 64) return 'crystal'
  return 'elder'
}

export const PHASE_LABELS: Record<PetPhase, string> = {
  egg: 'Spotted Egg',
  hatching: 'Almost Here',
  newborn: 'Tiny Fluff',
  fluffball: 'Soft Blob',
  sitting: 'Little Friend',
  standing: 'On All Fours',
  crystal: 'Crystal Bloom',
  elder: 'Lavender Guardian',
}

export function petProgress(totalChecks: number): PetProgress {
  const checks = Math.max(0, Math.floor(totalChecks))
  const evolution = evolutionFromChecks(checks)
  const phase = phaseFromEvolution(evolution)
  const atMax = evolution >= TOTAL_EVOLUTIONS
  const checksIntoEvolution = atMax
    ? CHECKS_PER_EVOLUTION
    : checks % CHECKS_PER_EVOLUTION
  const nextThreshold = atMax ? null : evolution * CHECKS_PER_EVOLUTION
  const progressInStage = atMax
    ? 1
    : checksIntoEvolution / CHECKS_PER_EVOLUTION

  return {
    evolution,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    totalChecks: checks,
    checksIntoEvolution,
    nextThreshold,
    progressInStage,
  }
}
