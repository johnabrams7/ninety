import { addDays, eachDay } from './dates'
import type { DateStr, Habit, HabitKind, LoggingMode, ModeChange } from './types'

/** Recommended default: quitting suits auto-track, building suits manual log. */
export const defaultModeFor = (kind: HabitKind): LoggingMode => (kind === 'remove' ? 'auto' : 'manual')

/** The mode in force on a given day. Days before the first entry use the first entry's mode. */
export function modeOn(habit: Habit, date: DateStr): LoggingMode {
  const h = habit.modeHistory
  if (!h || h.length === 0) return 'manual'
  let mode = h[0].mode
  for (const c of h) {
    if (c.from <= date) mode = c.mode
    else break
  }
  return mode
}

export const currentMode = (habit: Habit): LoggingMode => {
  const h = habit.modeHistory
  return h && h.length ? h[h.length - 1].mode : 'manual'
}

/** Hit (true) or miss (false) for one day: an explicit entry wins, otherwise the mode's default. */
export function dayResult(habit: Habit, date: DateStr): boolean {
  if (date in habit.logs) return habit.logs[date]
  return modeOn(habit, date) === 'auto'
}

/**
 * Switch mode from `today` forward. Days before today keep the mode they were
 * evaluated under, so switching never re-scores history.
 */
export function setMode(habit: Habit, mode: LoggingMode, today: DateStr): Habit {
  const history: ModeChange[] = (habit.modeHistory && habit.modeHistory.length
    ? habit.modeHistory
    : [{ from: habit.periods[0]?.start ?? today, mode: 'manual' as LoggingMode }]
  ).filter((c) => c.from < today)
  if (history.length === 0 || history[history.length - 1].mode !== mode) history.push({ from: today, mode })
  return { ...habit, modeHistory: history }
}

/** Set or clear one day's explicit entry. A retroactive change is flagged as edited; clearing removes the flag. */
export function editDay(habit: Habit, date: DateStr, value: boolean | null): Habit {
  const logs = { ...habit.logs }
  const edited = { ...(habit.edited ?? {}) }
  if (value === null) {
    delete logs[date]
    delete edited[date]
  } else {
    logs[date] = value
    edited[date] = true
  }
  return { ...habit, logs, edited }
}

/**
 * Days that must be written as explicit wins when a habit starts on `start` and today is `today`.
 * Auto-track needs none (unlogged days already count as hits); manual log needs one per past day.
 */
export const backfillDays = (start: DateStr, today: DateStr, mode: LoggingMode): DateStr[] =>
  mode === 'manual' && start < today ? eachDay(start, addDays(today, -1)) : []

/**
 * Move the habit's start date (first period). Moving it earlier counts every new day as a success:
 * automatically under auto-track, via the returned `fill` list under manual log. Existing entries are
 * kept. Moving it later just stops counting the days before it. The date is clamped to the end of the
 * first period (or today).
 */
export function backdateStart(habit: Habit, newStart: DateStr, today: DateStr): { habit: Habit; fill: DateStr[] } {
  const first = habit.periods[0]
  if (!first) return { habit, fill: [] }
  const start = newStart > (first.end ?? today) ? (first.end ?? today) : newStart
  const fill = start < first.start
    ? eachDay(start, addDays(first.start, -1)).filter((d) => !(d in habit.logs) && modeOn(habit, d) === 'manual')
    : []
  const logs = { ...habit.logs }
  for (const d of fill) logs[d] = true
  return { habit: { ...habit, logs, periods: [{ ...first, start }, ...habit.periods.slice(1)] }, fill }
}
