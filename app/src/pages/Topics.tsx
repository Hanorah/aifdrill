import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { topicStats } from '../lib/examEngine'
import { allQuestions, getQuestionsByDomain } from '../lib/questionEngine'
import { loadProgress } from '../lib/storage'
import type { Question } from '../types/question'
import type { ProgressState } from '../types/progress'
import { getQuestionProgress } from '../lib/progress'

function domainStats(questions: Question[], state: ProgressState) {
  const map = new Map<
    string,
    { domain: string; questions: number; attempts: number; correct: number; weak: number; mastered: number }
  >()

  for (const q of questions) {
    const domain = q.domainName ?? q.topic
    const row = map.get(domain) ?? {
      domain,
      questions: 0,
      attempts: 0,
      correct: 0,
      weak: 0,
      mastered: 0,
    }
    const p = getQuestionProgress(state, q.id)
    row.questions++
    row.attempts += p.attempts
    row.correct += p.correct
    if (p.mastery === 'WEAK') row.weak++
    if (p.mastery === 'MASTERED') row.mastered++
    map.set(domain, row)
  }

  return [...map.values()].map((r) => ({
    ...r,
    accuracy: r.attempts ? r.correct / r.attempts : 0,
  }))
}

export function Topics() {
  const [tick, setTick] = useState(0)
  const state = useMemo(() => loadProgress(), [tick])
  const domains = useMemo(() => domainStats(allQuestions, state), [state])
  const topics = useMemo(() => topicStats(allQuestions, state), [state])
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  if (activeDomain) {
    return (
      <QuizRunner
        questions={getQuestionsByDomain(activeDomain)}
        modeLabel={`Domain · ${activeDomain}`}
        onFinished={() => {
          setActiveDomain(null)
          setTick((t) => t + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Coverage</p>
        <h1 className="brand text-3xl font-bold">Domain mastery</h1>
      </div>
      <div className="grid gap-3">
        {domains.map((t) => (
          <div
            key={t.domain}
            className="surface p-5 flex flex-wrap gap-3 justify-between items-center"
          >
            <div>
              <div className="font-semibold text-[var(--ink)]">{t.domain}</div>
              <div className="text-sm text-[var(--muted)] mt-1">
                {t.questions} Q · {Math.round(t.accuracy * 100)}% accuracy · weak {t.weak} ·
                mastered {t.mastered}
              </div>
            </div>
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => setActiveDomain(t.domain)}
            >
              Practice
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="brand text-xl font-bold mb-3">Topics</h2>
        <div className="grid gap-2">
          {topics.map((t) => (
            <div
              key={t.topic}
              className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm flex justify-between gap-3"
            >
              <span>{t.topic}</span>
              <span className="mono text-[var(--muted)] shrink-0">
                {t.questions} Q · {Math.round(t.accuracy * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
