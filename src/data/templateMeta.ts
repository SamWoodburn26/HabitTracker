import type { TemplateId } from '../types'

export const TEMPLATE_META: {
  id: TemplateId
  label: string
  accent: string
}[] = [
  { id: 'habit-tracker', label: 'Habit Tracker', accent: 'var(--accent-green)' },
  { id: 'gratitude', label: 'Gratitude', accent: 'var(--accent-purple)' },
  { id: 'daily-planner', label: 'Daily Planner', accent: 'var(--accent-orange)' },
]
