import { useState, type FormEvent } from 'react'
import { addDays, defaultModeFor, type DateStr, type HabitKind, type LoggingMode } from '../engine'
import { DatePick, longDate } from './DatePick'
import { MODE_COPY } from './HabitCard'

const ADD_SUGGESTIONS = ['Walking', 'Weightlifting', 'Stretching', 'Reading', 'Meditation', 'Journaling', 'Gallon of water', 'Cold shower', 'Floss', 'Bed by 10pm']
const QUIT_SUGGESTIONS = ['Alcohol', 'Smoking', 'Vaping', 'Soda', 'Sweets', 'Junk food', 'Caffeine', 'Social media', 'Phone in bed', 'Nail biting']
const REPLACE = ['Walking', 'Stretching', 'Reading', 'Meditation']

export function AddSheet({ today, onAdd, onCancel }: { today: DateStr; onAdd: (name: string, kind: HabitKind, pair: string, mode: LoggingMode, start: DateStr) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<HabitKind>('add')
  const [mode, setMode] = useState<LoggingMode>(defaultModeFor('add'))
  const [name, setName] = useState('')
  const [pair, setPair] = useState('')
  const [start, setStart] = useState<DateStr>(today)

  const pickKind = (k: HabitKind) => { setKind(k); setMode(defaultModeFor(k)); setPair('') }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onAdd(name.trim(), kind, kind === 'remove' ? pair : '', mode, start)
  }

  return (
    <form className="sheet" onSubmit={submit} aria-label="Add a habit">
      <h2>New habit</h2>
      <div className="seg" role="group" aria-label="Type">
        <button type="button" aria-pressed={kind === 'add'} onClick={() => pickKind('add')}>Add something</button>
        <button type="button" aria-pressed={kind === 'remove'} onClick={() => pickKind('remove')}>Quit something</button>
      </div>
      <label className="field" htmlFor="new-name">
        Name
        <input id="new-name" type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'remove' ? 'e.g. Soda' : 'e.g. Walking'} />
      </label>
      <label className="field" htmlFor="started-on">
        Started on
        <DatePick id="started-on" value={start} min={addDays(today, -1825)} max={today} label="Started on" onChange={setStart} />
        <span className="hint">
          {start < today ? `Every day from ${longDate(start)} until today counts as done. You can fix any day afterward. ` : ''}
          Be honest with yourself. The best results come from accuracy.
        </span>
      </label>
      <label className="field" htmlFor="suggest">
        Common suggestions
        <select id="suggest" value="" onChange={(e) => { if (e.target.value) setName(e.target.value) }}>
          <option value="">Pick one to start…</option>
          {(kind === 'add' ? ADD_SUGGESTIONS : QUIT_SUGGESTIONS).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="hint">Pick one to start, then edit the name to make it more specific.</span>
      </label>
      {kind === 'remove' && (
        <div>
          <p className="hint" style={{ marginBottom: 8 }}>Quitting sticks better with a replacement you can hit about 90% of days. Pick one to add too (optional).</p>
          <div className="chips">{REPLACE.map((c) => <button type="button" key={c} className="chip" aria-pressed={pair === c} onClick={() => setPair(pair === c ? '' : c)}>{c}</button>)}</div>
        </div>
      )}
      <div>
        <p className="hint" style={{ marginBottom: 8 }}>How do you want to track it? You can change this later.</p>
        <div className="modes" role="group" aria-label="Tracking mode">
          {(['auto', 'manual'] as LoggingMode[]).map((m) => (
            <button type="button" key={m} className="mode" aria-pressed={mode === m} onClick={() => setMode(m)}>
              <b>{MODE_COPY[m].title}{defaultModeFor(kind) === m ? ' (recommended)' : ''}</b>
              <span>{MODE_COPY[m].blurb}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="row"><button type="submit" className="btn primary">Start tracking</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}
