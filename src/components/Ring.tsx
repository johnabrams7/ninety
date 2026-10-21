const C = 2 * Math.PI * 50
const TICK = ((0.9 * 360 - 90) * Math.PI) / 180

export function Ring({ pct, label, loading = false }: { pct: number; label: string; loading?: boolean }) {
  const at = (r: number) => [60 + r * Math.cos(TICK), 60 + r * Math.sin(TICK)] as const
  const [x1, y1] = at(43)
  const [x2, y2] = at(58)
  return (
    <div className="ring" role="img" aria-label={loading ? 'Loading' : `${Math.round(pct)} percent, ${label}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="track" cx="60" cy="60" r="50" fill="none" strokeWidth="12" />
        {!loading && <circle
          className="prog" cx="60" cy="60" r="50" fill="none" strokeWidth="12" strokeLinecap="round"
          transform="rotate(-90 60 60)" strokeDasharray={`${(pct / 100) * C} ${C}`}
        />}
        <line className="tick" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="center">
        {loading ? <div className="num">…</div> : <><div className="num">{Math.round(pct)}<sup>%</sup></div><div className="lbl">{label}</div></>}
      </div>
    </div>
  )
}
