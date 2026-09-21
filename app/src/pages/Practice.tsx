import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import {
  buildMixedPractice,
  filterQuestions,
  getRandomQuestions,
  getTopics,
  type PracticeFilter,
} from '../lib/questionEngine'
import { loadProgress } from '../lib/storage'

export function Practice() {
  const topics = getTopics()
  const [count, setCount] = useState(20)
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [topic, setTopic] = useState(topics[0] ?? '')
  const [session, setSession] = useState<ReturnType<typeof getRandomQuestions> | null>(null)

  const preview = useMemo(() => {
    const pool = filterQuestions(filter, { topic, state: loadProgress() })
    return pool.length
  }, [filter, topic])

  function start() {
    const pool = filterQuestions(filter, { topic, state: loadProgress() })
    const qs =
      filter === 'random' || filter === 'all'
        ? buildMixedPractice(count === 9999 ? pool.length : count)
        : getRandomQuestions(count === 9999 ? pool.length : count, pool)
    setSession(qs)
  }

  if (session) {
    return (
      <QuizRunner
        questions={session}
        modeLabel={`Practice · ${filter}${filter === 'topic' ? `: ${topic}` : ''}`}
        onFinished={() => setSession(null)}
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Practice</p>
      <h1 className="brand text-3xl font-bold">Build reliability</h1>
      <p className="text-sm text-[var(--muted)]">
        Randomized options every attempt. Filter to attack gaps or mix the full bank.
      </p>

      <Field label="Question count">
        <select className="field" value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {[10, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value={9999}>All available</option>
        </select>
      </Field>

      <Field label="Filter">
        <select
          className="field"
          value={filter}
          onChange={(e) => setFilter(e.target.value as PracticeFilter)}
        >
          <option value="all">All / mixed</option>
          <option value="unanswered">Unanswered</option>
          <option value="weak">Weak</option>
          <option value="incorrect">Incorrect</option>
          <option value="developing">Developing</option>
          <option value="topic">Topic</option>
          <option value="confusion">Confusion pairs</option>
          <option value="random">Random</option>
        </select>
      </Field>

      {filter === 'topic' && (
        <Field label="Topic">
          <select className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      )}

      <p className="mono text-xs text-[var(--muted)]">{preview} in pool</p>
      <button type="button" onClick={start} className="btn-amber">
        Start practice
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1.5">
      <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}
