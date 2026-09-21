import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { getRandomQuestions } from '../lib/questionEngine'

export function RapidFire() {
  const [session, setSession] = useState<ReturnType<typeof getRandomQuestions> | null>(null)

  if (session) {
    return (
      <QuizRunner
        questions={session}
        modeLabel="Rapid Fire"
        onFinished={() => setSession(null)}
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-4 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        Daily revision
      </p>
      <h1 className="brand text-3xl font-bold">Rapid Fire</h1>
      <p className="text-sm text-[var(--muted)]">
        Short mixed set. Answer, check, move. Keep the loop tight.
      </p>
      <button type="button" className="btn-amber" onClick={() => setSession(getRandomQuestions(15))}>
        Start 15 rapid questions
      </button>
    </div>
  )
}
