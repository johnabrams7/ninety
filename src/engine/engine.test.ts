import { describe, expect, it } from 'vitest'
import {
  adherence, archive, band, canReset, daysToRecover, globalAdherence, habitAgeDays,
  logDay, needsEarlyWarning, slackDays, reset, restart, streaks, daysUntilResetAllowed, addDays, eachDay,
  type Habit,
} from './index'

const mk = (start: string, hitsPattern: string, extra: Partial<Habit> = {}): Habit => {
  // pattern like "11101": one char per day from start; 1 = hit, 0 = miss
  const logs: Record<string, boolean> = {}
  ;[...hitsPattern].forEach((c, i) => (logs[addDays(start, i)] = c === '1'))
  return { id: 'h', name: 'Walk', kind: 'add', periods: [{ start }], logs, ...extra }
}

describe('adherence', () => {
  it('counts hits over past days; unlogged past days are misses', () => {
    const h = mk('2026-10-01', '1110') // Oct 1-4 logged, Oct 5 unlogged
    const a = adherence(h, '2026-10-06') // evaluates Oct 1..5
    expect(a).toEqual({ hits: 3, total: 5, pct: 60 })
  })
  it("today only counts once logged", () => {
    const h = mk('2026-10-01', '111')
    expect(adherence(h, '2026-10-04').total).toBe(3) // Oct 4 unlogged, not yet counted
    expect(adherence(logDay(h, '2026-10-04', false), '2026-10-04').total).toBe(4)
  })
  it('is 100% with no evaluated days', () => {
    expect(adherence(mk('2026-10-01', ''), '2026-10-01').pct).toBe(100)
  })
  it('bands', () => {
    expect(band(90)).toBe('habit')
    expect(band(89.9)).toBe('building')
    expect(band(70)).toBe('building')
    expect(band(69.9)).toBe('lapsed')
  })
})

describe('daysToRecover', () => {
  it('0 when already at or above target', () => {
    expect(daysToRecover({ hits: 9, total: 10 })).toBe(0)
  })
  it('matches brute force across many states', () => {
    for (let total = 0; total <= 60; total++) {
      for (let hits = 0; hits <= total; hits++) {
        let n = 0
        while (100 * (hits + n) < 90 * (total + n)) n++
        expect(daysToRecover({ hits, total })).toBe(n)
      }
    }
  })
  it('example: 17 of 20 needs 10 more good days (27/30 = 90%)', () => {
    expect(daysToRecover({ hits: 17, total: 20 })).toBe(10)
  })
  it('Infinity for a 100% target after a miss', () => {
    expect(daysToRecover({ hits: 9, total: 10 }, 100)).toBe(Infinity)
    expect(daysToRecover({ hits: 10, total: 10 }, 100)).toBe(0)
  })
})

describe('streaks', () => {
  it('tracks current and longest', () => {
    const h = mk('2026-10-01', '1101110')
    expect(streaks(h, '2026-10-08')).toEqual({ current: 0, longest: 3 })
    expect(streaks(mk('2026-10-01', '1101111'), '2026-10-08')).toEqual({ current: 4, longest: 4 })
  })
})

describe('archive / restart', () => {
  it('archived time never counts against the percentage', () => {
    let h = mk('2026-01-01', '1111111111') // 10 hits Jan 1-10
    h = archive(h, '2026-01-10')
    h = restart(h, '2026-07-01') // six-month gap
    h = logDay(h, '2026-07-01', true)
    const a = adherence(h, '2026-07-02')
    expect(a).toEqual({ hits: 11, total: 11, pct: 100 })
  })
  it('history is kept and age counts active time only', () => {
    let h = archive(mk('2026-01-01', '1111111111'), '2026-01-10')
    h = restart(h, '2026-07-01')
    expect(habitAgeDays(h, '2026-07-05')).toBe(10 + 5)
  })
  it('archive and restart are no-ops in the wrong state', () => {
    const h = mk('2026-01-01', '1')
    expect(restart(h, '2026-02-01')).toBe(h)
    const a = archive(h, '2026-01-05')
    expect(archive(a, '2026-01-06')).toBe(a)
  })
})

describe('guardrails', () => {
  it('early warning under 14 active days', () => {
    expect(needsEarlyWarning(mk('2026-10-10', '1'), '2026-10-20')).toBe(true) // 11 days
    expect(needsEarlyWarning(mk('2026-10-01', '1'), '2026-10-20')).toBe(false) // 20 days
  })
  it('reset enforces a 14-day cooldown', () => {
    const h = mk('2026-10-01', '1', { lastResetOn: '2026-10-10' })
    expect(canReset(h, '2026-10-23')).toBe(false)
    expect(daysUntilResetAllowed(h, '2026-10-23')).toBe(1)
    expect(canReset(h, '2026-10-24')).toBe(true)
    expect(reset(h, '2026-10-23')).toBeNull()
    const r = reset(h, '2026-10-24')!
    expect(r.logs).toEqual({})
    expect(r.lastResetOn).toBe('2026-10-24')
  })
  it('a never-reset habit can reset', () => {
    expect(canReset(mk('2026-10-01', '1'), '2026-10-02')).toBe(true)
  })
})

describe('globalAdherence', () => {
  it('pools hits and days across habits', () => {
    const a = mk('2026-10-01', '1111') // 4/4
    const b = mk('2026-10-01', '1000') // 1/4
    expect(globalAdherence([a, b], '2026-10-05')).toEqual({ hits: 5, total: 8, pct: 62.5 })
  })
})

describe('dates', () => {
  it('handles month and leap boundaries', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(eachDay('2026-10-30', '2026-11-02')).toHaveLength(4)
  })
})

describe('slackDays', () => {
  it('matches brute force: most misses you can absorb and stay >= 90%', () => {
    for (let total = 0; total <= 60; total++) {
      for (let hits = 0; hits <= total; hits++) {
        if (100 * hits < 90 * total) { expect(slackDays({ hits, total })).toBe(0); continue }
        let m = 0
        while (100 * hits >= 90 * (total + m + 1)) m++
        expect(slackDays({ hits, total })).toBe(m)
      }
    }
  })
})
