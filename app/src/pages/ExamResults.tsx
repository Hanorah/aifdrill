import { Link } from 'react-router-dom'
import type { ExamRecord } from '../types/progress'
import { allQuestions, formatAnswerList } from '../lib/questionEngine'
import { sourceLabel } from '../lib/statistics'

export function ExamResults({ exam, onAgain }: { exam: ExamRecord; onAgain: () => void }) {
  const byId = Object.fromEntries(allQuestions.map((q) => [q.id, q]))
  const incorrect = exam.answers.filter((a) => !a.isCorrect)
  const all = exam.answers

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
        <h2 className="brand text-xl font-bold mb-3">Domain performance</h2>
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
              <ReviewCard
                key={a.questionId}
                questionText={q.question}
                selected={a.selected}
                correct={q.correctAnswer}
                explanation={q.explanation}
                optionExplanations={q.optionExplanations}
                options={q.options}
                examTip={q.examTip}
                meta={`${q.domainName ?? q.topic} · ${q.topic} · ${sourceLabel(q)}`}
                status="Incorrect"
                statusClass="text-[var(--bad)]"
              />
            )
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="brand text-xl font-bold">Full review</h2>
        {all.map((a) => {
          const q = byId[a.questionId]
          if (!q) return null
          return (
            <ReviewCard
              key={`all-${a.questionId}`}
              questionText={q.question}
              selected={a.selected}
              correct={q.correctAnswer}
              explanation={q.explanation}
              optionExplanations={q.optionExplanations}
              options={q.options}
              examTip={q.examTip}
              meta={`${q.domainName ?? q.topic} · ${q.topic} · ${sourceLabel(q)}`}
              status={a.isCorrect ? 'Correct' : 'Incorrect'}
              statusClass={a.isCorrect ? 'text-[var(--good)]' : 'text-[var(--bad)]'}
            />
          )
        })}
      </section>
    </div>
  )
}

function ReviewCard({
  questionText,
  selected,
  correct,
  explanation,
  optionExplanations,
  options,
  examTip,
  meta,
  status,
  statusClass,
}: {
  questionText: string
  selected: string | string[]
  correct: string[]
  explanation: string
  optionExplanations: Record<string, string>
  options: string[]
  examTip: string
  meta: string
  status: string
  statusClass: string
}) {
  return (
    <div className="surface p-5 text-sm space-y-2">
      <div className={`mono text-[10px] uppercase tracking-wider ${statusClass}`}>{status}</div>
      <div className="font-semibold">{questionText}</div>
      <div>
        <span className="font-medium">Your answer:</span> {formatAnswerList(selected)}
      </div>
      <div className="text-[var(--good)]">
        <span className="font-medium">Correct answer:</span> {formatAnswerList(correct)}
      </div>
      {explanation && <div className="text-[var(--muted)] leading-relaxed">{explanation}</div>}
      <div className="space-y-1.5">
        {options.map((opt) => (
          <div key={opt} className="text-[var(--ink-2)]/80">
            <span className="font-medium text-[var(--ink)]">{opt}:</span>{' '}
            {optionExplanations[opt] ?? '—'}
          </div>
        ))}
      </div>
      {examTip && (
        <div className="text-[var(--warn)]">
          <span className="font-medium">Exam tip:</span> {examTip}
        </div>
      )}
      <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{meta}</div>
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
