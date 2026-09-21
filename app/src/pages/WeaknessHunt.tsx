import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { buildWeaknessHunt } from '../lib/questionEngine'

export function WeaknessHunt() {
  const [session, setSession] = useState<ReturnType<typeof buildWeaknessHunt> | null>(null)

  if (session) {
    return (
      <QuizRunner
        questions={session}
        modeLabel="Weakness Hunt"
        onFinished={() => setSession(null)}
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-4 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        Attack mode
      </p>
      <h1 className="brand text-3xl font-bold">Weakness Hunt</h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        Prioritizes repeated misses, weak mastery, confusion pairs, then unanswered items. Skips
        what you already own.
      </p>
      <button type="button" className="btn-amber" onClick={() => setSession(buildWeaknessHunt(20))}>
        Hunt 20 weaknesses
      </button>
    </div>
  )
}
