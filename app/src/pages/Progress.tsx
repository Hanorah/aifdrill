import { useMemo, useState } from 'react'
import { allQuestions } from '../lib/questionEngine'
import { loadProgress, resetProgress } from '../lib/storage'
import { getQuestionProgress } from '../lib/progress'
import { mostDangerousWeaknesses } from '../lib/statistics'

export function ProgressPage() {
  const [tick, setTick] = useState(0)
  const [topicFilter, setTopicFilter] = useState('all')
  const state = useMemo(() => loadProgress(), [tick])
  const byId = Object.fromEntries(allQuestions.map((q) => [q.id, q]))

  const errors = state.errorLog.filter((e) =>
    topicFilter === 'all' ? true : e.topic === topicFilter,
  )

  const topics = [...new Set(state.errorLog.map((e) => e.topic))].sort()
  const dangers = mostDangerousWeaknesses(state, 10)

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap justify-between gap-3 items-end">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Tracking
          </p>
          <h1 className="brand text-3xl font-bold">Progress</h1>
        </div>
        <button
          type="button"
          className="text-sm text-[var(--bad)] underline underline-offset-2"
          onClick={() => {
            if (confirm('Reset all progress?')) {
              resetProgress()
              setTick((t) => t + 1)
            }
          }}
        >
          Reset progress
        </button>
      </div>

      <section className="surface p-6 md:p-8">
        <h2 className="brand text-xl font-bold mb-3">Most dangerous weaknesses</h2>
        <ul className="space-y-3 text-sm">
          {dangers.map((d) => (
            <li key={d.kind + d.label} className="border-b border-[var(--line)] pb-2">
              <span className="mono text-[10px] uppercase tracking-wider text-[var(--amber-deep)] mr-2">
                {d.kind}
              </span>
              {d.label}
            </li>
          ))}
          {!dangers.length && (
            <li className="text-[var(--muted)]">Practice more to surface weaknesses.</li>
          )}
        </ul>
      </section>

      <section className="surface p-6 md:p-8">
        <h2 className="brand text-xl font-bold mb-3">Mock exam history</h2>
        {state.exams.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No exams yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {state.exams.map((e) => (
              <div
                key={e.id}
                className="flex justify-between border-b border-[var(--line)] py-2"
              >
                <span>{new Date(e.date).toLocaleString()}</span>
                <span className="mono">
                  {e.correct}/{e.total} ({e.percentage}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface p-6 md:p-8 space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="brand text-xl font-bold">Error log</h2>
          <select
            className="field max-w-xs"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {errors.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No mistakes logged yet.</p>
        ) : (
          <div className="space-y-3">
            {errors.slice(0, 50).map((e) => {
              const q = byId[e.questionId]
              const p = getQuestionProgress(state, e.questionId)
              return (
                <div key={e.id} className="border border-[var(--line)] rounded-2xl p-4 text-sm bg-white/50">
                  <div className="font-medium mb-1">{q?.question ?? e.questionId}</div>
                  <div className="text-[var(--muted)]">{e.topic}</div>
                  <div className="text-[var(--bad)]">
                    Mine: {Array.isArray(e.myAnswer) ? e.myAnswer.join('; ') : e.myAnswer}
                  </div>
                  <div className="text-[var(--good)]">
                    Correct:{' '}
                    {Array.isArray(e.correctAnswer)
                      ? e.correctAnswer.join('; ')
                      : e.correctAnswer}
                  </div>
                  <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)] mt-2">
                    {new Date(e.date).toLocaleString()} · prior misses {e.previousMistakes} ·{' '}
                    {p.mastery}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
