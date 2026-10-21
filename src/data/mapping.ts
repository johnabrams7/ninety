import type { DateStr, Habit, HabitKind } from '../engine'

export interface HabitRow { id: string; name: string; kind: HabitKind; category: string | null }
export interface PeriodRow { habit_id: string; start_date: DateStr; end_date: DateStr | null }
export interface LogRow { habit_id: string; log_date: DateStr; adhered: boolean }
export interface ResetRow { habit_id: string; reset_on: DateStr }

/** Assemble engine Habit objects from the four table reads. Pure, so it is unit-tested. */
export function rowsToHabits(
  habits: HabitRow[],
  periods: PeriodRow[],
  logs: LogRow[],
  resets: ResetRow[],
): Habit[] {
  return habits.map((h) => {
    const mine = periods
      .filter((p) => p.habit_id === h.id)
      .sort((a, b) => (a.start_date < b.start_date ? -1 : 1))
      .map((p) => (p.end_date ? { start: p.start_date, end: p.end_date } : { start: p.start_date }))

    const dayLogs: Record<DateStr, boolean> = {}
    for (const l of logs) if (l.habit_id === h.id) dayLogs[l.log_date] = l.adhered

    const lastReset = resets
      .filter((r) => r.habit_id === h.id)
      .map((r) => r.reset_on)
      .sort()
      .pop()

    return {
      id: h.id,
      name: h.name,
      kind: h.kind,
      ...(h.category ? { category: h.category } : {}),
      periods: mine,
      logs: dayLogs,
      ...(lastReset ? { lastResetOn: lastReset } : {}),
    }
  })
}
