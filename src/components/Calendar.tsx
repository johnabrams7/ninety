import { useState } from 'react'
import { dayResult, type DateStr, type Habit } from '../engine'

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const pad = (n: number) => String(n).padStart(2, '0')

/** Month grid for one habit. Days outside the habit's life are grey and locked; past active days are editable. */
export function Calendar({ habit, today, selected, onPick }: { habit: Habit; today: DateStr; selected?: DateStr; onPick: (d: DateStr) => void }) {
  const start = habit.periods[0]?.start ?? today
  const [ym, setYm] = useState(() => {
    const base = selected ?? today
    return { y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) }
  })
  const first = new Date(Date.UTC(ym.y, ym.m - 1, 1))
  const count = new Date(Date.UTC(ym.y, ym.m, 0)).getUTCDate()
  const key = (y: number, m: number) => y * 12 + m
  const canPrev = key(ym.y, ym.m) > key(Number(start.slice(0, 4)), Number(start.slice(5, 7)))
  const canNext = key(ym.y, ym.m) < key(Number(today.slice(0, 4)), Number(today.slice(5, 7)))
  const step = (n: number) => setYm((c) => { const t = c.y * 12 + (c.m - 1) + n; return { y: Math.floor(t / 12), m: (t % 12) + 1 } })

  const cells = []
  for (let i = 0; i < first.getUTCDay(); i++) cells.push(<i key={`b${i}`} className="blank" />)
  for (let n = 1; n <= count; n++) {
    const d = `${ym.y}-${pad(ym.m)}-${pad(n)}`
    const active = habit.periods.some((p) => d >= p.start && d <= (p.end ?? today))
    if (d > today || !active) { cells.push(<span key={d} className="day off" aria-hidden="true">{n}</span>); continue }
    if (d === today) { cells.push(<span key={d} className="day today">{n}</span>); continue }
    const hit = dayResult(habit, d)
    const edited = habit.edited?.[d] === true
    cells.push(
      <button
        key={d} type="button" className={`day ${hit ? 'hit' : 'miss'}${edited ? ' edited' : ''}${selected === d ? ' sel' : ''}`}
        aria-label={`${d}, ${hit ? 'good day' : 'slip'}${edited ? ', edited' : ''}. Edit this day.`}
        onClick={() => onPick(d)}
      >{n}</button>,
    )
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="link" disabled={!canPrev} onClick={() => step(-1)} aria-label="Previous month">‹</button>
        <b>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b>
        <button type="button" className="link" disabled={!canNext} onClick={() => step(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid" role="group" aria-label="Calendar">
        {WEEK.map((w, i) => <span key={i} className="wk">{w}</span>)}
        {cells}
      </div>
    </div>
  )
}
