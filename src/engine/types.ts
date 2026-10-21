/** ISO calendar date, "YYYY-MM-DD". Dates are plain strings so no timezone bugs. */
export type DateStr = string

export type HabitKind = 'add' | 'remove'

/** A stretch of time the habit was active. `end` undefined = still active. Inclusive. */
export interface ActivePeriod {
  start: DateStr
  end?: DateStr
}

export interface Habit {
  id: string
  name: string
  kind: HabitKind
  category?: string
  /** Active periods, oldest first. Gaps between periods = archived time (not counted). */
  periods: ActivePeriod[]
  /** true = adhered that day, false = missed. Unlogged past days count as missed. */
  logs: Record<DateStr, boolean>
  /** Last time the user reset this habit, for the cooldown guardrail. */
  lastResetOn?: DateStr
}

export interface Adherence {
  hits: number
  total: number
  /** 0-100. 100 when there are no evaluated days yet. */
  pct: number
}

export type Band = 'habit' | 'building' | 'lapsed'

export const HABIT_PCT = 90
export const FLOOR_PCT = 70
export const RESET_COOLDOWN_DAYS = 14
export const EARLY_WARNING_DAYS = 14
