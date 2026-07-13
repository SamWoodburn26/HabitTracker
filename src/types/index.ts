export type HabitId = string

export type Habit = {
  id: HabitId
  label: string
}

export type HabitChecks = Record<HabitId, Record<string, boolean>>

export type GratitudeEntry = {
  id: string
  date: string
  items: [string, string, string]
}

export type DailyPlannerEntry = {
  id: string
  date: string
  wantTo: string[]
  needTo: string[]
  goal: string
  highlight: string
}

export type InkPoint = {
  x: number
  y: number
  pressure: number
}

export type InkStroke = {
  id: string
  points: InkPoint[]
  color: string
  size: number
}

export type JournalPage = {
  id: string
  title: string
  text: string
  strokes: InkStroke[]
}

export type HabitTrackerSheet = {
  id: string
  title: string
  habitMonthLabel: string
  habitChecks: HabitChecks
  hobbyList: string[]
  monthHighlights: string
  strokes: InkStroke[]
}

export type GratitudeSheet = {
  id: string
  title: string
  entries: GratitudeEntry[]
  strokes: InkStroke[]
}

export type DailyPlannerSheet = {
  id: string
  title: string
  plans: DailyPlannerEntry[]
  strokes: InkStroke[]
}

export type TemplateId = 'habit-tracker' | 'gratitude' | 'daily-planner'

export type InputMode = 'write' | 'type'

/** @deprecated Prefer numeric evolution from petProgress */
export type PetStage = 'egg' | 'cracked' | 'hatchling' | 'juvenile' | 'grown'

export type ThemeColors = {
  habitTracker: string
  gratitudeTitle: string
  gratitudeAccent: string
  dailyPlanner: string
  ink: string
  paper: string
  text: string
}

export type AppData = {
  habits: Habit[]
  habitSheets: HabitTrackerSheet[]
  activeHabitSheetId: string
  gratitudeSheets: GratitudeSheet[]
  activeGratitudeSheetId: string
  dailySheets: DailyPlannerSheet[]
  activeDailySheetId: string
  journalPages: JournalPage[]
  coins: number
  activeTemplate: TemplateId
  inputMode: InputMode
  activeJournalPageId: string
  colors: ThemeColors
}
