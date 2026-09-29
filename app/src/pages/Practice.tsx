import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import {
  buildMixedPractice,
  filterQuestions,
  getDomains,
  getRandomQuestions,
  getTopics,
  type PracticeFilter,
} from '../lib/questionEngine'
import { loadProgress } from '../lib/storage'

export function Practice() {
  const topics = getTopics()
  const domains = getDomains()
  const [count, setCount] = useState(20)
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [topic, setTopic] = useState(topics[0] ?? '')
  const [domain, setDomain] = useState(domains[0] ?? '')
  const [session, setSession] = useState<ReturnType<typeof getRandomQuestions> | null>(null)

  const preview = useMemo(() => {
    const pool = filterQuestions(filter, { topic, domain, state: loadProgress() })
    return pool.length
  }, [filter, topic, domain])

  function start() {
    const pool = filterQuestions(filter, { topic, domain, state: loadProgress() })
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
        modeLabel={`Practice · ${filter}${
          filter === 'topic' ? `: ${topic}` : filter === 'domain' ? `: ${domain}` : ''
        }`}
        onFinished={() => setSession(null)}
      />
    )
  }

  return (
    <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Practice</p>
      <h1 className="brand text-3xl font-bold">Build reliability</h1>
      <p className="text-sm text-[var(--muted)]">
        Immediate feedback after every answer. Filter by domain, topic, or gaps across the 300-question
        bank.
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
          <option value="domain">Domain</option>
          <option value="topic">Topic</option>
          <option value="random">Random</option>
        </select>
      </Field>

      {filter === 'domain' && (
        <Field label="Domain">
          <select className="field" value={domain} onChange={(e) => setDomain(e.target.value)}>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      )}

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
