import { useState } from 'react'
import {
  EARLY_WARNING_DAYS, addDays, adherence, band, currentMode, dayResult, daysToRecover, daysUntilResetAllowed,
  habitAgeDays, modeOn, slackDays, streaks, type Band, type DateStr, type Habit, type LoggingMode,
} from '../engine'
import { Ring } from './Ring'

export const HUES = ['#6a5cff', '#12a8c9', '#e8528f', '#f08a24', '#3e9b4f']
export const BAND_LABEL: Record<Band, string> = { habit: 'In the zone', building: 'Building', lapsed: 'Lapsed' }
export type Confirm = { id: string; type: 'archive' | 'restart' | 'delete' | 'settings' | 'edit'; date?: DateStr } | null

export const MODE_COPY: Record<LoggingMode, { title: string; blurb: string }> = {
  auto: { title: 'Auto-track', blurb: 'Days count automatically. Just mark your slips.' },
  manual: { title: 'Manual log', blurb: 'You log each day. Days you skip count as misses.' },
}

const dayLabel = (d: DateStr) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })

interface Props {
  habit: Habit
  index: number
  today: DateStr
  showStreaks: boolean
  confirm: Confirm
  onLog: (v: boolean) => void
  onAsk: (type: 'archive' | 'restart' | 'delete' | 'settings' | 'edit', date?: DateStr) => void
  onSetMode: (mode: LoggingMode) => void
  onEditDay: (date: DateStr, value: boolean | null) => void
  onCancel: () => void
  onArchive: () => void
  onRestartFresh: (reflection: string) => void
}

function Strip({ habit, today, selected, onPick }: { habit: Habit; today: DateStr; selected?: DateStr; onPick: (d: DateStr) => void }) {
  const cells = []
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i)
    const active = habit.periods.some((p) => d >= p.start && d <= (p.end ?? today))
    if (!active) { cells.push(<i key={d} />); continue }
    const isToday = d === today
    const cls = isToday ? (d in habit.logs ? (habit.logs[d] ? 'hit' : 'miss') : 'pending') : dayResult(habit, d) ? 'hit' : 'miss'
    if (isToday) { cells.push(<i key={d} className={cls} title={`${dayLabel(d)} (today)`} />); continue }
    const edited = habit.edited?.[d] === true
    cells.push(
      <button
        key={d} type="button" className={`cell ${cls}${edited ? ' edited' : ''}${selected === d ? ' sel' : ''}`}
        title={`${dayLabel(d)}: ${cls === 'hit' ? 'good day' : 'slip'}${edited ? ' (edited)' : ''}. Tap to edit.`}
        aria-label={`${dayLabel(d)}, ${cls === 'hit' ? 'good day' : 'slip'}${edited ? ', edited' : ''}. Edit this day.`}
        onClick={() => onPick(d)}
      >{edited ? 'M' : ''}</button>,
    )
  }
  return (
    <>
      <div className="strip" aria-label="Last 14 days">{cells}</div>
      <div className="strip-cap"><span>14 days ago</span><span>today</span></div>
    </>
  )
}

export function HabitCard(p: Props) {
  const { habit: h, today } = p
  const [why, setWhy] = useState('')
  const a = adherence(h, today)
  const b = band(a.pct)
  const st = streaks(h, today)
  const need = daysToRecover(a)
  const slack = slackDays(a)
  const age = habitAgeDays(h, today)
  const t = h.logs[today]
  const mine = p.confirm?.type
  const mode = currentMode(h)

  let note
  if (a.total === 0) note = <p><b>Day one.</b> Log today to start your percentage.</p>
  else if (need === 0)
    note = (
      <p>
        <b>{slack > 0 ? `Room for ${slack} slip${slack > 1 ? 's' : ''}` : 'Right on the line'}.</b>{' '}
        {slack > 0 ? 'You can miss that many days and stay above 90%.' : 'One more miss would dip you under 90%.'}
      </p>
    )
  else
    note = (
      <>
        <p><b>{need} clean day{need > 1 ? 's' : ''}</b> to get back to 90%.</p>
        <p>{age < 14 ? 'Early days. Keep compounding. A slip this young is just data.' : 'A slip is data, not a reset. Stack good days and the number climbs.'}</p>
      </>
    )

  let extra = null
  if (mine === 'settings')
    extra = (
      <div className="note align">
        <p><b>How do you track "{h.name}"?</b></p>
        <div className="seg" role="group" aria-label="Tracking mode">
          {(['auto', 'manual'] as LoggingMode[]).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => p.onSetMode(m)}>{MODE_COPY[m].title}</button>
          ))}
        </div>
        <p className="hint" style={{ margin: '8px 0' }}>{MODE_COPY[mode].blurb} Changes apply from today forward. Days already counted are not re-scored.</p>
        <div className="row"><button className="btn ghost" onClick={p.onCancel}>Done</button></div>
      </div>
    )
  else if (mine === 'edit' && p.confirm?.date) {
    const d = p.confirm.date
    const logged = d in h.logs
    const now = dayResult(h, d) ? 'a good day' : 'a slip'
    extra = (
      <div className="note align">
        <p><b>Edit {dayLabel(d)}</b></p>
        <p>Right now it counts as {now}{logged ? ' (logged)' : modeOn(h, d) === 'auto' ? ' (automatic)' : ' (nothing logged)'}.</p>
        <p>Are you sure you want to manually modify this day? Try to be accurate with yourself. Edited days show an M.</p>
        <div className="row">
          <button className="btn primary" onClick={() => p.onEditDay(d, true)}>Mark as done</button>
          <button className="btn slip" onClick={() => p.onEditDay(d, false)}>Mark as slipped</button>
          {logged && <button className="btn ghost" onClick={() => p.onEditDay(d, null)}>Back to {modeOn(h, d) === 'auto' ? 'automatic' : 'unlogged'}</button>}
          <button className="btn ghost" onClick={p.onCancel}>Cancel</button>
        </div>
      </div>
    )
  } else if (mine === 'archive')
    extra = (
      <div className="note align">
        <p><b>Archive "{h.name}"?</b></p>
        <p>{age < EARLY_WARNING_DAYS ? `It has only been ${age} day${age === 1 ? '' : 's'}. Are you sure? ` : ''}Its history is kept and it stops counting toward your overall number.</p>
        <div className="row"><button className="btn primary" onClick={p.onArchive}>Archive</button><button className="btn ghost" onClick={p.onCancel}>Keep it</button></div>
      </div>
    )
  else if (mine === 'restart')
    extra = (
      <div className="note align">
        <p><b>Forgive and restart</b></p>
        <label className="field" htmlFor={`why-${h.id}`}>
          What happened? A sentence is enough.
          <textarea id={`why-${h.id}`} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Travel week, stress, lost the routine..." />
        </label>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => p.onRestartFresh(why.trim())}>Restart with a clean slate</button>
          <button className="btn ghost" onClick={p.onCancel}>Cancel</button>
        </div>
      </div>
    )
  else if (b === 'lapsed' && a.total >= 10) {
    const wait = daysUntilResetAllowed(h, today)
    extra = (
      <div className="note align">
        <p><b>How important is this right now?</b></p>
        <p>It has been missed more than it has been done lately. You could shrink the target, pause it, or start fresh.</p>
        <div className="row">
          {wait > 0
            ? <button className="btn ghost" disabled>Forgive and restart in {wait} days</button>
            : <button className="btn ghost" onClick={() => p.onAsk('restart')}>Forgive and restart</button>}
          <button className="btn ghost" onClick={() => p.onAsk('archive')}>Archive</button>
        </div>
      </div>
    )
  }

  return (
    <article className={`habit band-${b}`} style={{ ['--hue' as string]: HUES[p.index % HUES.length] }}>
      <div className="habit-head">
        <div className="bubble" aria-hidden="true">{h.name.charAt(0).toUpperCase()}</div>
        <div className="grow"><h3>{h.name}</h3><div className="meta">{h.kind === 'remove' ? 'Quitting' : 'Adding'} · day {age}</div></div>
        <button className="link" onClick={() => p.onAsk('archive')}>Archive</button>
      </div>
      <div className="body">
        <Ring pct={a.pct} label={BAND_LABEL[b]} />
        <div className={`stats${p.showStreaks ? '' : ' hide-streaks'}`}>
          <div className="stat"><b>{a.hits}/{a.total}</b><span>good days</span></div>
          {p.showStreaks && <><div className="stat"><b>{st.current}</b><span>streak</span></div><div className="stat"><b>{st.longest}</b><span>best streak</span></div></>}
        </div>
      </div>
      <Strip habit={h} today={today} selected={p.confirm?.type === 'edit' ? p.confirm.date : undefined} onPick={(d) => p.onAsk('edit', d)} />
      <div className="note">{note}</div>
      {extra}
      {mode === 'auto' ? (
        <div className="actions single">
          <button className="btn slip" aria-pressed={t === false} onClick={() => p.onLog(false)}>{t === false ? 'Slipped today. Tap to undo' : 'I slipped today'}</button>
        </div>
      ) : (
        <div className="actions">
          <button className="btn done" aria-pressed={t === true} onClick={() => p.onLog(true)}>{t === true ? 'Done today ✓' : 'Done today'}</button>
          <button className="btn slip" aria-pressed={t === false} onClick={() => p.onLog(false)}>Slipped</button>
        </div>
      )}
      <p className="mode-line">
        {MODE_COPY[mode].title}: {MODE_COPY[mode].blurb}{' '}
        <button className="link inline" onClick={() => p.onAsk('settings')}>Change</button>
      </p>
    </article>
  )
}

export function ArchiveCard(p: {
  habit: Habit; index: number; today: DateStr; confirm: Confirm
  onRestart: () => void; onAsk: () => void; onDelete: () => void; onCancel: () => void
}) {
  const { habit: h } = p
  const a = adherence(h, p.today)
  return (
    <article className={`habit band-${band(a.pct)}`} style={{ ['--hue' as string]: HUES[p.index % HUES.length] }}>
      <div className="habit-head">
        <div className="bubble" aria-hidden="true">{h.name.charAt(0).toUpperCase()}</div>
        <div className="grow"><h3>{h.name}</h3><div className="meta">Archived · {Math.round(a.pct)}% over {a.total} active days</div></div>
      </div>
      {p.confirm?.type === 'delete' ? (
        <div className="note align">
          <p><b>Delete for good?</b></p>
          <p>If this record was authentic, it is worth keeping. Your history is part of the story. It is your call.</p>
          <div className="row"><button className="btn slip" onClick={p.onDelete}>Delete</button><button className="btn ghost" onClick={p.onCancel}>Keep it</button></div>
        </div>
      ) : (
        <>
          <p className="hint">Restarting keeps this history. The time spent archived is not counted against your percentage.</p>
          <div className="row"><button className="btn primary" onClick={p.onRestart}>Restart</button><button className="btn ghost" onClick={p.onAsk}>Delete</button></div>
        </>
      )}
    </article>
  )
}
