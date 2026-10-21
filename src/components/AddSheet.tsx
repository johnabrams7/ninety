import { useState, type FormEvent } from 'react'
import type { HabitKind } from '../engine'

const COMMON = ['Walk 20 minutes', 'Drink water', 'Stretch', 'Read 10 pages', 'Sleep by 11', 'No sugar']
const REPLACE = ['Walk 20 minutes', 'Stretch', 'Read 10 pages', 'Call a friend']

export function AddSheet({ onAdd, onCancel }: { onAdd: (name: string, kind: HabitKind, pair: string) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<HabitKind>('add')
  const [name, setName] = useState('')
  const [pair, setPair] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onAdd(name.trim(), kind, kind === 'remove' ? pair : '')
  }

  return (
    <form className="sheet" onSubmit={submit} aria-label="Add a habit">
      <h2>New habit</h2>
      <div className="seg" role="group" aria-label="Type">
        <button type="button" aria-pressed={kind === 'add'} onClick={() => { setKind('add'); setPair('') }}>Add something</button>
        <button type="button" aria-pressed={kind === 'remove'} onClick={() => { setKind('remove'); setPair('') }}>Quit something</button>
      </div>
      <label className="field" htmlFor="new-name">
        Name
        <input id="new-name" type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'remove' ? 'e.g. Soda' : 'e.g. Walk 20 minutes'} />
      </label>
      {kind === 'add' ? (
        <div>
          <p className="hint" style={{ marginBottom: 8 }}>Common picks</p>
          <div className="chips">{COMMON.map((c) => <button type="button" key={c} className="chip" onClick={() => setName(c)}>{c}</button>)}</div>
        </div>
      ) : (
        <div>
          <p className="hint" style={{ marginBottom: 8 }}>Quitting sticks better with a replacement you can hit about 90% of days. Pick one to add too (optional).</p>
          <div className="chips">{REPLACE.map((c) => <button type="button" key={c} className="chip" aria-pressed={pair === c} onClick={() => setPair(pair === c ? '' : c)}>{c}</button>)}</div>
        </div>
      )}
      <div className="row"><button type="submit" className="btn primary">Start tracking</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}
