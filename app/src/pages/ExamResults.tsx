import { Link } from 'react-router-dom'
import type { ExamRecord } from '../types/progress'
import { allQuestions } from '../lib/questionEngine'
import { sourceLabel } from '../lib/statistics'

export function ExamResults({ exam, onAgain }: { exam: ExamRecord; onAgain: () => void }) {
  const byId = Object.fromEntries(allQuestions.map((q) => [q.id, q]))
  const incorrect = exam.answers.filter((a) => !a.isCorrect)

  return (
    <div className="space-y-6 animate-rise">
      <section className="surface p-6 md:p-8">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)] mb-2">
          Results
        </p>
        <h1 className="brand text-3xl font-bold mb-5">Exam review</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Correct" value={String(exam.correct)} />
          <Stat label="Incorrect" value={String(exam.incorrect)} />
          <Stat label="Score" value={`${exam.percentage}%`} />
          <Stat
            label="Duration"
            value={exam.durationSeconds != null ? `${exam.durationSeconds}s` : '—'}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          <button type="button" onClick={onAgain} className="btn-amber">
            New exam
          </button>
          <Link to="/weakness" className="btn-secondary">
            Weakness Hunt
          </Link>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <h2 className="brand text-xl font-bold mb-3">Topic performance</h2>
        <div className="space-y-2">
          {Object.entries(exam.topicPerformance).map(([topic, v]) => (
            <div
              key={topic}
              className="flex justify-between text-sm border-b border-[var(--line)] py-2"
            >
              <span>{topic}</span>
              <span className="mono text-[var(--muted)]">
                {v.correct}/{v.total} ({Math.round((v.correct / v.total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="brand text-xl font-bold">Incorrect</h2>
        {incorrect.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">None — strong run.</p>
        ) : (
          incorrect.map((a) => {
            const q = byId[a.questionId]
            if (!q) return null
            return (
              <div key={a.questionId} className="surface p-5 text-sm space-y-2">
                <div className="font-semibold">{q.question}</div>
                <div className="text-[var(--bad)]">
                  Yours:{' '}
                  {Array.isArray(a.selected) ? a.selected.join('; ') : String(a.selected || '—')}
                </div>
                <div className="text-[var(--good)]">
                  Correct:{' '}
                  {Array.isArray(q.correctAnswer)
                    ? q.correctAnswer.join('; ')
                    : q.correctAnswer}
                </div>
                {q.explanation && <div className="text-[var(--muted)]">{q.explanation}</div>}
                <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {q.topic} · {sourceLabel(q)}
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] px-3 py-3">
      <div className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="brand text-xl font-bold mt-1">{value}</div>
    </div>
  )
}
