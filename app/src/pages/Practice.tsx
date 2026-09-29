import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { allQuestions } from '../lib/questionEngine'
import {
  clearPracticeSession,
  hasResumablePractice,
  loadPracticeSession,
} from '../lib/storage'

const MODE_LABEL = 'Practice · full bank'

export function Practice() {
  const questionIds = allQuestions.map((q) => q.id)
  const canResume = hasResumablePractice(MODE_LABEL, questionIds)
  const saved = canResume ? loadPracticeSession() : null
  const [session, setSession] = useState<typeof allQuestions | null>(null)

  if (session) {
    return (
      <QuizRunner
        questions={session}
        modeLabel={MODE_LABEL}
        onFinished={() => setSession(null)}
        persistSession
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Practice</p>
      <h1 className="brand text-3xl font-bold">Full bank</h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        All {allQuestions.length} questions in document order. After each answer you see whether you
        passed or failed, the correct answer, and explanations for the options. Progress is saved in
        this browser so you can leave and resume.
      </p>
      {canResume && saved && (
        <p className="text-sm text-[var(--ink)]">
          Saved progress: question {saved.index + 1} of {saved.questionIds.length} ·{' '}
          {saved.correctCount} correct so far
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canResume ? (
          <>
            <button
              type="button"
              className="btn-amber"
              onClick={() => setSession([...allQuestions])}
            >
              Resume practice
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearPracticeSession()
                setSession([...allQuestions])
              }}
            >
              Start over
            </button>
          </>
        ) : (
          <button type="button" className="btn-amber" onClick={() => setSession([...allQuestions])}>
            Start practice ({allQuestions.length})
          </button>
        )}
      </div>
    </div>
  )
}
