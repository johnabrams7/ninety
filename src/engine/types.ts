/** ISO calendar date, "YYYY-MM-DD". Dates are plain strings so no timezone bugs. */
export type DateStr = string

export type HabitKind = 'add' | 'remove'

/** A stretch of time the habit was active. `end` undefined = still active. Inclusive. */
export interface ActivePeriod {
  start: DateStr
  end?: DateStr
}

/**
 * How days get classified when the user hasn't logged them.
 * - auto:   unlogged days count as hits; the user only logs slips.
 * - manual: unlogged days count as misses; the user logs wins.
 */
export type LoggingMode = 'auto' | 'manual'

/** From `from` onward (inclusive) the habit uses `mode`. Oldest first. */
export interface ModeChange {
  from: DateStr
  mode: LoggingMode
}

export interface Habit {
  id: string
  name: string
  kind: HabitKind
  category?: string
  /** Active periods, oldest first. Gaps between periods = archived time (not counted). */
  periods: ActivePeriod[]
  /** Explicit entries: true = adhered that day, false = slipped. Unlogged days follow the logging mode. */
  logs: Record<DateStr, boolean>
  /** Days whose entry was changed after the fact (drives the "M" badge). */
  edited?: Record<DateStr, boolean>
  /** Logging mode over time. Missing or empty means manual, the original behavior. */
  modeHistory?: ModeChange[]
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
