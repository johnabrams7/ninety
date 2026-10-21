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
