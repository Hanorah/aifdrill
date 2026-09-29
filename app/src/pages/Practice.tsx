import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { allQuestions } from '../lib/questionEngine'

export function Practice() {
  const [session, setSession] = useState<typeof allQuestions | null>(null)

  if (session) {
    return (
      <QuizRunner
        questions={session}
        modeLabel="Practice · full bank"
        onFinished={() => setSession(null)}
        revealOnFailOnly
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Practice</p>
      <h1 className="brand text-3xl font-bold">Full bank</h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        All {allQuestions.length} questions from the Word documents, in document order. After you get
        one wrong, the correct answer and explanations for the other options are shown. Correct
        answers move you on without the full breakdown.
      </p>
      <button type="button" className="btn-amber" onClick={() => setSession([...allQuestions])}>
        Start practice ({allQuestions.length})
      </button>
    </div>
  )
}
