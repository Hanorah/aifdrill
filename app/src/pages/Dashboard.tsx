import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { calculateReadiness } from '../lib/examEngine'
import { allQuestions, buildDailySession, getTopics } from '../lib/questionEngine'
import { loadProgress, resetProgress } from '../lib/storage'
import { mostDangerousWeaknesses } from '../lib/statistics'
import { QuizRunner } from '../components/QuizRunner'

export function Dashboard() {
  const [tick, setTick] = useState(0)
  const state = useMemo(() => loadProgress(), [tick])
  const readiness = calculateReadiness(state)
  const dangers = mostDangerousWeaknesses(state, 5)
  const [daily, setDaily] = useState<ReturnType<typeof buildDailySession> | null>(null)

  if (daily) {
    return (
      <QuizRunner
        questions={daily}
        modeLabel="Daily Drill"
        onFinished={() => {
          setDaily(null)
          setTick((t) => t + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-10">
      <section className="animate-rise relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] px-6 py-10 md:px-12 md:py-14 shadow-[var(--shadow)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 85% 20%, rgba(217,119,6,0.45), transparent 40%), radial-gradient(circle at 10% 80%, rgba(14,116,144,0.35), transparent 35%)',
          }}
        />
        <div className="relative max-w-2xl">
          <p className="mono text-[11px] uppercase tracking-[0.2em] text-[rgba(243,239,230,0.65)] mb-3">
            Personal exam trainer
          </p>
          <h1 className="brand text-4xl md:text-6xl font-bold leading-[0.95] mb-4">
            AIF<span className="text-[var(--amber)]">Drill</span>
          </h1>
          <p className="text-base md:text-lg text-[rgba(243,239,230,0.82)] max-w-xl mb-8">
            {allQuestions.length} AIF-C01 practice questions from the Word-doc bank.
            Hunt weaknesses until mastery sticks.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-amber" onClick={() => setDaily(buildDailySession(state))}>
              Start daily drill
            </button>
            <Link to="/weakness" className="btn-secondary border-[rgba(243,239,230,0.35)] text-[var(--paper)] hover:bg-white/10">
              Weakness hunt
            </Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 animate-rise-delay">
        <Metric
          label="Readiness"
          value={readiness.status}
          accent
          pulse={readiness.status === 'EXAM READY'}
        />
        <Metric label="Accuracy" value={`${Math.round(readiness.metrics.accuracy * 100)}%`} />
        <Metric
          label="Weak / Mastered"
          value={`${readiness.metrics.weakCount} / ${readiness.metrics.masteredCount}`}
        />
      </section>

      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="surface p-6 md:p-8 space-y-4">
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Today's plan
          </p>
          <h2 className="brand text-2xl font-bold">Balanced session</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Weakness · mixed topics · spaced retests · a few mastered items for retention. Built from
            your live progress across {getTopics().length} topics.
          </p>
          <ul className="text-sm space-y-2 text-[var(--ink-2)]">
            {readiness.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-[var(--amber)]">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary" onClick={() => setDaily(buildDailySession(state))}>
            Begin training
          </button>
        </div>

        <div className="surface p-6 md:p-8 space-y-4">
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Needs attention
          </p>
          <h2 className="brand text-2xl font-bold">Focus next</h2>
          {dangers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No weakness data yet. Run a practice set to surface gaps.
            </p>
          ) : (
            <ul className="space-y-3">
              {dangers.map((d) => (
                <li key={d.label + d.kind} className="border-b border-[var(--line)] pb-2">
                  <div className="mono text-[10px] uppercase tracking-wider text-[var(--amber-deep)]">
                    {d.kind}
                  </div>
                  <div className="text-sm leading-snug">{d.label}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/exam" className="btn-secondary text-sm">
              Mock exam
            </Link>
            <Link to="/progress" className="btn-secondary text-sm">
              Error log
            </Link>
            <Link to="/topics" className="btn-secondary text-sm">
              Topics
            </Link>
          </div>
          <button
            type="button"
            className="text-xs text-[var(--bad)] underline underline-offset-2"
            onClick={() => {
              if (confirm('Reset all progress? Questions stay.')) {
                resetProgress()
                setTick((t) => t + 1)
              }
            }}
          >
            Reset progress
          </button>
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  accent,
  pulse,
}: {
  label: string
  value: string
  accent?: boolean
  pulse?: boolean
}) {
  return (
    <div className={`surface p-5 ${pulse ? 'ready-pulse' : ''}`}>
      <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] mb-2">
        {label}
      </div>
      <div
        className={`brand text-xl md:text-2xl font-bold leading-tight ${
          accent ? 'text-[var(--amber-deep)]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}
