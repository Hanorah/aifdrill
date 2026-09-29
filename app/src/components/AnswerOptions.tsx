type Props = {
  options: string[]
  selected: string | string[]
  multi?: boolean
  /** Max selections allowed for multiple-select questions. */
  selectCount?: number
  disabled?: boolean
  correctAnswer?: string | string[]
  showResult?: boolean
  onChange: (value: string | string[]) => void
}

function asSet(v: string | string[] | undefined) {
  if (!v) return new Set<string>()
  return new Set(Array.isArray(v) ? v : [v])
}

export function AnswerOptions({
  options,
  selected,
  multi = false,
  selectCount,
  disabled,
  correctAnswer,
  showResult,
  onChange,
}: Props) {
  const selectedSet = asSet(selected)
  const correctSet = asSet(correctAnswer)
  const max = selectCount ?? Infinity

  function toggle(opt: string) {
    if (disabled) return
    if (!multi) {
      onChange(opt)
      return
    }
    const next = new Set(selectedSet)
    if (next.has(opt)) {
      next.delete(opt)
    } else if (next.size < max) {
      next.add(opt)
    } else {
      return
    }
    onChange([...next])
  }

  return (
    <div className="space-y-2.5">
      {options.map((opt, i) => {
        const isSelected = selectedSet.has(opt)
        const isCorrect = correctSet.has(opt)
        let cls =
          'border-[var(--line)] bg-white/70 hover:border-[var(--ink)] hover:bg-white'
        if (isSelected && !showResult) {
          cls = 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
        }
        if (showResult && isCorrect) {
          cls = 'border-[var(--good)] bg-emerald-50 text-[var(--good)]'
        }
        if (showResult && isSelected && !isCorrect) {
          cls = 'border-[var(--bad)] bg-red-50 text-[var(--bad)]'
        }

        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt)}
            className={`w-full text-left px-4 py-3.5 rounded-2xl border transition duration-150 ${cls}`}
          >
            <span className="mono text-[11px] opacity-60 mr-3">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="leading-snug">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}
