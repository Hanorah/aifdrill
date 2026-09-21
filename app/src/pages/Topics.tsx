import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { topicStats } from '../lib/examEngine'
import { allQuestions, getQuestionsByTopic } from '../lib/questionEngine'
import { loadProgress } from '../lib/storage'

export function Topics() {
  const [tick, setTick] = useState(0)
  const stats = useMemo(() => topicStats(allQuestions, loadProgress()), [tick])
  const [active, setActive] = useState<string | null>(null)

  if (active) {
    return (
      <QuizRunner
        questions={getQuestionsByTopic(active)}
        modeLabel={`Topic · ${active}`}
        onFinished={() => {
          setActive(null)
          setTick((t) => t + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Coverage</p>
        <h1 className="brand text-3xl font-bold">Topic mastery</h1>
      </div>
      <div className="grid gap-3">
        {stats.map((t) => (
          <div
            key={t.topic}
            className="surface p-5 flex flex-wrap gap-3 justify-between items-center"
          >
            <div>
              <div className="font-semibold text-[var(--ink)]">{t.topic}</div>
              <div className="text-sm text-[var(--muted)] mt-1">
                {t.questions} Q · {Math.round(t.accuracy * 100)}% accuracy · weak {t.weak} ·
                mastered {t.mastered}
              </div>
            </div>
            <button type="button" className="btn-primary text-sm" onClick={() => setActive(t.topic)}>
              Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
