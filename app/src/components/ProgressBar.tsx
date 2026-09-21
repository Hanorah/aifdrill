export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">
        <span>
          {value} / {max}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--paper-2)] overflow-hidden border border-[var(--line)]">
        <div
          className="h-full rounded-full bg-[var(--sky)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
