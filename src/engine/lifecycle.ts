import { diffDays } from './dates'
import {
  EARLY_WARNING_DAYS,
  RESET_COOLDOWN_DAYS,
  type DateStr,
  type Habit,
} from './types'

export function logDay(habit: Habit, date: DateStr, adhered: boolean): Habit {
  return { ...habit, logs: { ...habit.logs, [date]: adhered } }
}

export const isArchived = (habit: Habit): boolean => {
  const last = habit.periods[habit.periods.length - 1]
  return !!last && last.end !== undefined
}

/** Habit age in days across active time only (archived gaps don't age it). */
export function habitAgeDays(habit: Habit, today: DateStr): number {
  let age = 0
  for (const p of habit.periods) {
    const end = p.end ?? today
    age += Math.max(0, diffDays(p.start, end) + 1)
  }
  return age
}

/** True if archiving/deleting now should trigger the "it hasn't even been 14 days" prompt. */
export const needsEarlyWarning = (habit: Habit, today: DateStr): boolean =>
  habitAgeDays(habit, today) < EARLY_WARNING_DAYS

export function archive(habit: Habit, date: DateStr): Habit {
  if (isArchived(habit)) return habit
  const periods = habit.periods.slice()
  const last = periods[periods.length - 1]
  periods[periods.length - 1] = { ...last, end: date }
  return { ...habit, periods }
}

/** Restart an archived habit. History is kept; the archived gap is simply never counted. */
export function restart(habit: Habit, date: DateStr): Habit {
  if (!isArchived(habit)) return habit
  return { ...habit, periods: [...habit.periods, { start: date }] }
}

export function canReset(habit: Habit, today: DateStr, cooldown = RESET_COOLDOWN_DAYS): boolean {
  return habit.lastResetOn === undefined || diffDays(habit.lastResetOn, today) >= cooldown
}

export function daysUntilResetAllowed(habit: Habit, today: DateStr, cooldown = RESET_COOLDOWN_DAYS): number {
  if (habit.lastResetOn === undefined) return 0
  return Math.max(0, cooldown - diffDays(habit.lastResetOn, today))
}

/** Reset = wipe logs and start a fresh period; blocked during cooldown. Returns null if blocked. */
export function reset(habit: Habit, today: DateStr): Habit | null {
  if (!canReset(habit, today)) return null
  return { ...habit, logs: {}, periods: [{ start: today }], lastResetOn: today }
}
