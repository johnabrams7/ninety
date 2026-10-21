import type { DateStr, Habit, HabitKind } from '../engine'
import { supabase } from './supabase'
import { rowsToHabits } from './mapping'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function fetchHabits(): Promise<Habit[]> {
  const [h, p, l, r] = await Promise.all([
    supabase.from('habits').select('id,name,kind,category').order('created_at'),
    supabase.from('habit_periods').select('habit_id,start_date,end_date'),
    supabase.from('habit_logs').select('habit_id,log_date,adhered'),
    supabase.from('habit_resets').select('habit_id,reset_on'),
  ])
  return rowsToHabits(check(h) ?? [], check(p) ?? [], check(l) ?? [], check(r) ?? [])
}

export async function addHabit(name: string, kind: HabitKind, today: DateStr): Promise<void> {
  const row = check(await supabase.from('habits').insert({ name, kind }).select('id').single<{ id: string }>())
  if (!row) throw new Error('Could not create habit')
  check(await supabase.from('habit_periods').insert({ habit_id: row.id, start_date: today }))
}

/** adhered = null clears the day. user_id is filled by the column default (auth.uid()). */
export async function setLog(habitId: string, date: DateStr, adhered: boolean | null): Promise<void> {
  if (adhered === null) {
    check(await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', date))
    return
  }
  check(
    await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, log_date: date, adhered }, { onConflict: 'habit_id,log_date' }),
  )
}

export async function archiveHabit(habitId: string, date: DateStr): Promise<void> {
  check(await supabase.from('habit_periods').update({ end_date: date }).eq('habit_id', habitId).is('end_date', null))
}

export async function restartHabit(habitId: string, date: DateStr): Promise<void> {
  check(await supabase.from('habit_periods').insert({ habit_id: habitId, start_date: date }))
}

/** Forgive and restart: clears logs and periods, records the reflection. The 14-day gate is enforced by the engine before calling this. */
export async function resetHabit(habitId: string, date: DateStr, reflection: string): Promise<void> {
  check(await supabase.from('habit_logs').delete().eq('habit_id', habitId))
  check(await supabase.from('habit_periods').delete().eq('habit_id', habitId))
  check(await supabase.from('habit_periods').insert({ habit_id: habitId, start_date: date }))
  check(await supabase.from('habit_resets').insert({ habit_id: habitId, reset_on: date, reflection }))
}

export async function deleteHabit(habitId: string): Promise<void> {
  check(await supabase.from('habits').delete().eq('id', habitId))
}
