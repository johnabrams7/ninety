import type { DateStr, Habit, HabitKind, LoggingMode, ModeChange } from '../engine'
import { supabase } from './supabase'
import { rowsToHabits } from './mapping'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function fetchHabits(): Promise<Habit[]> {
  const [h, p, l, r] = await Promise.all([
    supabase.from('habits').select('id,name,kind,category,mode_history').order('created_at'),
    supabase.from('habit_periods').select('habit_id,start_date,end_date'),
    supabase.from('habit_logs').select('habit_id,log_date,adhered,edited'),
    supabase.from('habit_resets').select('habit_id,reset_on'),
  ])
  return rowsToHabits(check(h) ?? [], check(p) ?? [], check(l) ?? [], check(r) ?? [])
}

/** `start` may be in the past (backdating). `fill` = past days to record as wins (manual-log habits only). */
export async function addHabit(name: string, kind: HabitKind, start: DateStr, mode: LoggingMode, fill: DateStr[] = []): Promise<void> {
  const mode_history: ModeChange[] = [{ from: start, mode }]
  const row = check(await supabase.from('habits').insert({ name, kind, mode_history }).select('id').single<{ id: string }>())
  if (!row) throw new Error('Could not create habit')
  check(await supabase.from('habit_periods').insert({ habit_id: row.id, start_date: start }))
  await fillWins(row.id, fill)
}

async function fillWins(habitId: string, dates: DateStr[]): Promise<void> {
  if (!dates.length) return
  const rows = dates.map((d) => ({ habit_id: habitId, log_date: d, adhered: true, edited: false }))
  check(await supabase.from('habit_logs').upsert(rows, { onConflict: 'habit_id,log_date' }))
}

/** Move the start of the habit's first period. `fill` = newly covered days to record as wins. */
export async function setStartDate(habitId: string, oldStart: DateStr, newStart: DateStr, fill: DateStr[]): Promise<void> {
  await fillWins(habitId, fill)
  check(await supabase.from('habit_periods').update({ start_date: newStart }).eq('habit_id', habitId).eq('start_date', oldStart))
}

/**
 * adhered = null clears the day (it falls back to the habit's mode default).
 * edited = true marks a change made after the fact. user_id comes from the column default (auth.uid()).
 */
export async function setLog(habitId: string, date: DateStr, adhered: boolean | null, edited = false): Promise<void> {
  if (adhered === null) {
    check(await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', date))
    return
  }
  check(
    await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, log_date: date, adhered, edited }, { onConflict: 'habit_id,log_date' }),
  )
}

export async function archiveHabit(habitId: string, date: DateStr): Promise<void> {
  check(await supabase.from('habit_periods').update({ end_date: date }).eq('habit_id', habitId).is('end_date', null))
}

export async function restartHabit(habitId: string, date: DateStr): Promise<void> {
  check(await supabase.from('habit_periods').insert({ habit_id: habitId, start_date: date }))
}

/** Forgive and restart: clears logs and periods, records the reflection. The 14-day gate is enforced by the engine before calling this. */
export async function setModeHistory(habitId: string, modeHistory: ModeChange[]): Promise<void> {
  check(await supabase.from('habits').update({ mode_history: modeHistory }).eq('id', habitId))
}

export async function resetHabit(habitId: string, date: DateStr, reflection: string, modeHistory: ModeChange[]): Promise<void> {
  check(await supabase.from('habit_logs').delete().eq('habit_id', habitId))
  check(await supabase.from('habit_periods').delete().eq('habit_id', habitId))
  check(await supabase.from('habit_periods').insert({ habit_id: habitId, start_date: date }))
  check(await supabase.from('habit_resets').insert({ habit_id: habitId, reset_on: date, reflection }))
  await setModeHistory(habitId, modeHistory)
}

export async function deleteHabit(habitId: string): Promise<void> {
  check(await supabase.from('habits').delete().eq('id', habitId))
}
