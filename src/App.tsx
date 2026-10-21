import { useCallback, useEffect, useState } from 'react'
import { AuthForm } from './auth/AuthForm'
import { useSession } from './auth/useSession'
import { addHabit, archiveHabit, fetchHabits, setLog } from './data/repo'
import { isConfigured, supabase } from './data/supabase'
import { adherence, band, daysToRecover, isArchived, localToday, streaks, type Habit } from './engine'
import './App.css'

function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const today = localToday()

  const refresh = useCallback(() => fetchHabits().then(setHabits).catch((e: Error) => setError(e.message)), [])
  useEffect(() => { void refresh() }, [refresh])

  const run = (fn: () => Promise<void>) => fn().then(refresh).catch((e: Error) => setError(e.message))

  return (
    <>
      {error && <p role="alert">{error}</p>}
      {habits.filter((h) => !isArchived(h)).map((h) => {
        const a = adherence(h, today)
        const s = streaks(h, today)
        const need = daysToRecover(a)
        return (
          <article key={h.id} className={`habit ${band(a.pct)}`}>
            <h3>{h.name}</h3>
            <p className="pct">{Math.round(a.pct)}%</p>
            <p>{need === 0 ? 'In the 90+ zone.' : `${need} good days to get back to 90%.`} Streak {s.current}, best {s.longest}.</p>
            <div className="row">
              <button onClick={() => run(() => setLog(h.id, today, true))}>Done today</button>
              <button onClick={() => run(() => setLog(h.id, today, false))}>Slipped</button>
              <button className="link" onClick={() => run(() => archiveHabit(h.id, today))}>Archive</button>
            </div>
          </article>
        )
      })}
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { void run(() => addHabit(name.trim(), 'add', today)); setName('') } }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New habit" maxLength={60} aria-label="New habit name" />
        <button type="submit">Add</button>
      </form>
    </>
  )
}

export default function App() {
  const session = useSession()
  return (
    <main>
      <h1>Ninety</h1>
      {!isConfigured ? (
        <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see README), then restart the dev server.</p>
      ) : session === undefined ? (
        <p>Loading…</p>
      ) : session === null ? (
        <AuthForm />
      ) : (
        <>
          <button className="link" onClick={() => supabase.auth.signOut()}>Sign out ({session.user.email})</button>
          <Habits />
        </>
      )}
    </main>
  )
}
