import { describe, expect, it } from 'vitest'
import { adherence } from '../engine'
import { rowsToHabits } from './mapping'

describe('rowsToHabits', () => {
  const habits = [
    { id: 'a', name: 'Walk', kind: 'add' as const, category: 'fitness' },
    { id: 'b', name: 'Soda', kind: 'remove' as const, category: null },
  ]
  const periods = [
    { habit_id: 'a', start_date: '2026-07-01', end_date: null },
    { habit_id: 'b', start_date: '2026-06-01', end_date: '2026-06-10' },
    { habit_id: 'b', start_date: '2026-01-01', end_date: '2026-01-05' },
  ]
  const logs = [
    { habit_id: 'a', log_date: '2026-07-01', adhered: true },
    { habit_id: 'a', log_date: '2026-07-02', adhered: false },
    { habit_id: 'b', log_date: '2026-01-01', adhered: true },
  ]
  const resets = [
    { habit_id: 'b', reset_on: '2026-01-03' },
    { habit_id: 'b', reset_on: '2026-06-01' },
  ]
  const out = rowsToHabits(habits, periods, logs, resets)

  it('groups rows per habit and keeps periods oldest first', () => {
    expect(out[1].periods).toEqual([
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-06-01', end: '2026-06-10' },
    ])
    expect(out[0].periods).toEqual([{ start: '2026-07-01' }])
  })
  it('maps logs, category and the latest reset', () => {
    expect(out[0].logs).toEqual({ '2026-07-01': true, '2026-07-02': false })
    expect(out[0].category).toBe('fitness')
    expect(out[1].category).toBeUndefined()
    expect(out[1].lastResetOn).toBe('2026-06-01')
    expect(out[0].lastResetOn).toBeUndefined()
  })
  it('produces habits the engine can score', () => {
    expect(adherence(out[0], '2026-07-03')).toEqual({ hits: 1, total: 2, pct: 50 })
  })
})
