import { useCallback, useEffect, useState } from 'react'
import { addHabit, archiveHabit, deleteHabit, fetchHabits, resetHabit, restartHabit, setLog, setModeHistory } from '../data/repo'
import { band, currentMode, daysToRecover, globalAdherence, isArchived, localToday, setMode, type Habit, type HabitKind, type LoggingMode } from '../engine'
import { AddSheet } from './AddSheet'
import { ArchiveCard, BAND_LABEL, HabitCard, type Confirm } from './HabitCard'
import { Ring } from './Ring'

const STREAK_KEY = 'ninety-show-streaks'
const readStreakPref = (): boolean => {
  try { return localStorage.getItem(STREAK_KEY) !== '0' } catch { return true }
}

export function Tracker() {
  const [habits, setHabits] = useState<Habit[] | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'today' | 'archive'>('today')
  const [adding, setAdding] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [showStreaks, setShowStreaks] = useState(readStreakPref)
  const today = localToday()

  const refresh = useCallback(
    () => fetchHabits().then(setHabits).catch((e: Error) => setError(e.message)),
    [],
  )
  useEffect(() => { void refresh() }, [refresh])

  const run = (fn: () => Promise<void>) => {
    setError('')
    setConfirm(null)
    return fn().then(refresh).catch((e: Error) => setError(e.message))
  }

  const all = habits ?? []
  const active = all.filter((h) => !isArchived(h))
  const archived = all.filter(isArchived)
  const g = globalAdherence(active, today)
  const gBand = band(g.pct)
  const gNeed = daysToRecover(g)

  useEffect(() => { document.body.className = `band-${gBand}` }, [gBand])

  const toggleStreaks = () => {
    const next = !showStreaks
    setShowStreaks(next)
    try { localStorage.setItem(STREAK_KEY, next ? '1' : '0') } catch { /* storage unavailable */ }
  }

  const add = (name: string, kind: HabitKind, pair: string, mode: LoggingMode) => {
    setAdding(false)
    void run(async () => {
      await addHabit(name, kind, today, mode)
      if (pair) await addHabit(pair, 'add', today, 'manual')
    })
  }

  // Mode changes keep the card's settings panel open so the new choice is visible.
  const changeMode = (h: Habit, mode: LoggingMode) => {
    const next = setMode(h, mode, today)
    setError('')
    void setModeHistory(h.id, next.modeHistory ?? []).then(refresh).catch((e: Error) => setError(e.message))
  }

  const log = (h: Habit, v: boolean) => void run(() => setLog(h.id, today, h.logs[today] === v ? null : v))

  const summary = !active.length
    ? 'Add a habit to get started.'
    : gNeed === 0
      ? `Across ${active.length} habit${active.length > 1 ? 's' : ''}, you are above the 90 line.`
      : `About ${gNeed} clean day${gNeed > 1 ? 's' : ''} across your habits to get back above 90.`

  return (
    <>
      <header className="top">
        <div className="brand">Ninety<small>Aim for 90%+. Perfect is not the goal.</small></div>
        <button className="add-btn" onClick={() => { setAdding(true); setTab('today') }}>+ Habit</button>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className={`summary band-${gBand}`} aria-label="Overall adherence">
        <Ring pct={g.pct} label="overall" />
        <div><h2>{BAND_LABEL[gBand]}</h2><p>{habits === null ? 'Loading your habits…' : summary}</p></div>
      </section>

      <nav className="tabs" aria-label="Views">
        <button aria-pressed={tab === 'today'} onClick={() => { setTab('today'); setConfirm(null) }}>Today</button>
        <button aria-pressed={tab === 'archive'} onClick={() => { setTab('archive'); setConfirm(null) }}>Archive{archived.length ? ` (${archived.length})` : ''}</button>
      </nav>

      {adding && <AddSheet onAdd={add} onCancel={() => setAdding(false)} />}

      {tab === 'today' && habits !== null && active.length === 0 && <div className="empty">No active habits. Add one to begin.</div>}
      {tab === 'today' && active.map((h) => (
        <HabitCard
          key={h.id} habit={h} index={all.indexOf(h)} today={today} showStreaks={showStreaks}
          confirm={confirm?.id === h.id ? confirm : null}
          onLog={(v) => log(h, v)}
          onAsk={(type, date) => setConfirm({ id: h.id, type, date })}
          onSetMode={(mode) => changeMode(h, mode)}
          onEditDay={(date, value) => void run(() => setLog(h.id, date, value, value !== null))}
          onCancel={() => setConfirm(null)}
          onArchive={() => void run(() => archiveHabit(h.id, today))}
          onRestartFresh={(why) => void run(() => resetHabit(h.id, today, why, [{ from: today, mode: currentMode(h) }]))}
        />
      ))}

      {tab === 'archive' && (archived.length === 0
        ? <div className="empty">Nothing archived yet. Archived habits keep their history and stop counting toward your overall number.</div>
        : archived.map((h) => (
          <ArchiveCard
            key={h.id} habit={h} index={all.indexOf(h)} today={today}
            confirm={confirm?.id === h.id ? confirm : null}
            onRestart={() => { setTab('today'); void run(() => restartHabit(h.id, today)) }}
            onAsk={() => setConfirm({ id: h.id, type: 'delete' })}
            onDelete={() => void run(() => deleteHabit(h.id))}
            onCancel={() => setConfirm(null)}
          />
        )))}

      <p className="fine">Ninety is built for habits where about 90% is a realistic target. Some habits, especially those tied to a medical condition or a clinical-level substance dependency, call for full abstinence rather than percentage adherence.</p>
      <div className="foot"><button className="link" onClick={toggleStreaks}>{showStreaks ? 'Hide streaks' : 'Show streaks'}</button></div>
    </>
  )
}

