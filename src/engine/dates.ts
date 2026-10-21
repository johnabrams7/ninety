import type { DateStr } from './types'

const MS_PER_DAY = 86_400_000

const toUtc = (d: DateStr): number => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

export const fromUtc = (ms: number): DateStr => new Date(ms).toISOString().slice(0, 10)

export const addDays = (d: DateStr, n: number): DateStr => fromUtc(toUtc(d) + n * MS_PER_DAY)

/** Whole days from a to b (b - a). */
export const diffDays = (a: DateStr, b: DateStr): number => Math.round((toUtc(b) - toUtc(a)) / MS_PER_DAY)

export const minDate = (a: DateStr, b: DateStr): DateStr => (a <= b ? a : b)

/** Every date from start to end inclusive. Empty if end < start. */
export function eachDay(start: DateStr, end: DateStr): DateStr[] {
  const out: DateStr[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
  return out
}

/** Today's date in the user's local calendar, as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): DateStr {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}
