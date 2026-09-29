import { useMemo, useState } from 'react'
import type { PresentedQuestion } from '../types/question'
import type { ExamRecord } from '../types/progress'
import { gradeExam, startExam } from '../lib/examEngine'
import { allQuestions } from '../lib/questionEngine'
import { recordAttempt } from '../lib/progress'
import { AnswerOptions } from '../components/AnswerOptions'
import { ProgressBar } from '../components/ProgressBar'
import { ExamResults } from './ExamResults'

export function Exam() {
  const [count, setCount] = useState(25)
  const [timed, setTimed] = useState(true)
  const [running, setRunning] = useState<{
    questions: PresentedQuestion[]
    startedAt: number
  } | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string | string[]>('')
  const [result, setResult] = useState<ExamRecord | null>(null)

  const remaining = useMemo(() => {
    if (!running || !timed) return null
    return Math.floor((Date.now() - running.startedAt) / 1000)
  }, [running, timed, index])

  function begin() {
    const session = startExam(Math.min(count, allQuestions.length))
    setRunning(session)
    setIndex(0)
    setAnswers({})
    setSelected('')
    setResult(null)
  }

  function next() {
    if (!running) return
    const q = running.questions[index]
    const multi = q.type === 'multiple' || q.selectCount > 1
    if (multi) {
      if (!Array.isArray(selected) || selected.length !== q.selectCount) return
    } else if (typeof selected !== 'string' || !selected) {
      return
    }
    const nextAnswers = { ...answers, [q.id]: selected }
    setAnswers(nextAnswers)
    recordAttempt(q, selected)

    if (index + 1 >= running.questions.length) {
      const exam = gradeExam(running.questions, nextAnswers, timed, running.startedAt)
      setResult(exam)
      setRunning(null)
      return
    }
    setIndex(index + 1)
    setSelected('')
  }

  if (result) {
    return <ExamResults exam={result} onAgain={() => setResult(null)} />
  }

  if (!running) {
    return (
      <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Simulation
        </p>
        <h1 className="brand text-3xl font-bold">Exam mode</h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          No explanations, hints, or topic labels while you work. Full review after submit.
        </p>
        <label className="block text-sm space-y-1.5">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Questions
          </span>
          <select
            className="field"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[10, 25, 50, 65].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Track elapsed time
        </label>
        <button type="button" onClick={begin} className="btn-amber">
          Start exam
        </button>
      </div>
    )
  }

  const q = running.questions[index]
  const multi = q.type === 'multiple' || q.selectCount > 1
  const canProceed = multi
    ? Array.isArray(selected) && selected.length === q.selectCount
    : typeof selected === 'string' && selected.length > 0

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex justify-between text-sm text-[var(--muted)]">
        <span className="mono text-[11px] uppercase tracking-[0.14em]">Exam in progress</span>
        {timed && remaining !== null && <span className="mono">Elapsed {remaining}s</span>}
      </div>
      <ProgressBar value={index} max={running.questions.length} />
      <div className="surface p-6 md:p-8 space-y-5">
        <div className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Question {index + 1} / {running.questions.length}
          {multi
            ? ` · Select ${q.selectCount === 2 ? 'TWO' : q.selectCount}`
            : ''}
        </div>
        <h2 className="text-xl font-semibold leading-relaxed">
          {q.question}
          {multi && (
            <span className="block mt-2 text-base font-medium text-[var(--amber-deep)]">
              (Select {q.selectCount === 2 ? 'TWO' : q.selectCount}.)
            </span>
          )}
        </h2>
        <AnswerOptions
          options={q.shuffledOptions}
          selected={selected}
          multi={multi}
          selectCount={q.selectCount}
          onChange={setSelected}
        />
        <button type="button" disabled={!canProceed} onClick={next} className="btn-primary">
          {index + 1 >= running.questions.length ? 'Submit exam' : 'Next'}
        </button>
      </div>
    </div>
  )
}
