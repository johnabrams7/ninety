import type { DateStr } from '../engine'

export const longDate = (d: DateStr) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** Shows a spelled-out date ("October 21, 2026"). Clicking opens the native calendar picker. */
export function DatePick({ id, value, min, max, label, onChange }: {
  id: string; value: DateStr; min: DateStr; max: DateStr; label: string; onChange: (d: DateStr) => void
}) {
  return (
    <span className="datepick">
      <span className="datepick-text">{longDate(value)} ▾</span>
      <input
        id={id} type="date" value={value} min={min} max={max} aria-label={label}
        onClick={(e) => { try { e.currentTarget.showPicker() } catch { /* picker opens natively */ } }}
        onChange={(e) => { const v = e.target.value; if (v && v >= min && v <= max) onChange(v) }}
      />
    </span>
  )
}
