import { addDays, eachDay, minDate } from './dates'
import {
  FLOOR_PCT,
  HABIT_PCT,
  type Adherence,
  type Band,
  type DateStr,
  type Habit,
} from './types'

/**
 * Days that count toward adherence, oldest first.
 * - Only days inside active periods (archived time is skipped).
 * - Past days count whether logged or not (unlogged = missed).
 * - Today only counts once the user has logged it, so the day isn't a miss before it's over.
 */
export function evaluatedDays(habit: Habit, today: DateStr): DateStr[] {
  const lastFullDay = addDays(today, -1)
  const days: DateStr[] = []
  for (const p of habit.periods) {
    const end = minDate(p.end ?? today, today)
    for (const d of eachDay(p.start, end)) {
      if (d <= lastFullDay || d in habit.logs) days.push(d)
    }
  }
  return days
}

export function adherence(habit: Habit, today: DateStr): Adherence {
  const days = evaluatedDays(habit, today)
  const hits = days.filter((d) => habit.logs[d] === true).length
  const total = days.length
  return { hits, total, pct: total === 0 ? 100 : (hits / total) * 100 }
}

export function band(pct: number): Band {
  if (pct >= HABIT_PCT) return 'habit'
  if (pct >= FLOOR_PCT) return 'building'
  return 'lapsed'
}

/**
 * Fewest additional good days needed to get back to `targetPct`, assuming every
 * upcoming day is a hit. Integer math, so no floating-point off-by-ones.
 * Returns 0 if already there, Infinity if the target is 100 and a miss exists.
 */
export function daysToRecover(
  { hits, total }: Pick<Adherence, 'hits' | 'total'>,
  targetPct: number = HABIT_PCT,
): number {
  const deficit = targetPct * total - 100 * hits
  if (deficit <= 0) return 0
  if (targetPct >= 100) return Infinity
  return Math.ceil(deficit / (100 - targetPct))
}

/** Streaks run over evaluated (active) days; archived gaps neither extend nor break them. */
export function streaks(habit: Habit, today: DateStr): { current: number; longest: number } {
  const days = evaluatedDays(habit, today)
  let current = 0
  let longest = 0
  for (const d of days) {
    if (habit.logs[d] === true) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return { current, longest }
}

/** Overall adherence across habits: pooled hits / pooled days, so longer histories weigh more. */
export function globalAdherence(habits: Habit[], today: DateStr): Adherence {
  let hits = 0
  let total = 0
  for (const h of habits) {
    const a = adherence(h, today)
    hits += a.hits
    total += a.total
  }
  return { hits, total, pct: total === 0 ? 100 : (hits / total) * 100 }
}

/** How many slips you can absorb right now and still stay at or above `targetPct`. */
export function slackDays(
  { hits, total }: Pick<Adherence, 'hits' | 'total'>,
  targetPct: number = HABIT_PCT,
): number {
  return Math.max(0, Math.floor((100 * hits - targetPct * total) / targetPct))
}
