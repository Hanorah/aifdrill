import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentedQuestion } from '../types/question'
import type { ExamRecord } from '../types/progress'
import {
  EXAM_DURATION_MS,
  EXAM_QUESTION_COUNT,
  gradeExam,
  startExam,
} from '../lib/examEngine'
import { recordAttempt } from '../lib/progress'
import { AnswerOptions } from '../components/AnswerOptions'
import { ProgressBar } from '../components/ProgressBar'
import { ExamResults } from './ExamResults'

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Exam() {
  const [running, setRunning] = useState<{
    questions: PresentedQuestion[]
    startedAt: number
    endsAt: number
  } | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string | string[]>('')
  const [result, setResult] = useState<ExamRecord | null>(null)
  const [remainingMs, setRemainingMs] = useState(EXAM_DURATION_MS)
  const selectedRef = useRef(selected)
  const answersRef = useRef(answers)
  const indexRef = useRef(index)
  const finishingRef = useRef(false)

  selectedRef.current = selected
  answersRef.current = answers
  indexRef.current = index

  const finishExam = useCallback(
    (session: NonNullable<typeof running>, finalAnswers: Record<string, string | string[]>) => {
      if (finishingRef.current) return
      finishingRef.current = true
      const exam = gradeExam(session.questions, finalAnswers, true, session.startedAt)
      setResult(exam)
      setRunning(null)
    },
    [],
  )

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = running.endsAt - Date.now()
      setRemainingMs(left)
      if (left <= 0) {
        const q = running.questions[indexRef.current]
        const final = { ...answersRef.current }
        const cur = selectedRef.current
        if (q && cur && (Array.isArray(cur) ? cur.length : cur)) {
          final[q.id] = cur
        }
        finishExam(running, final)
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running, finishExam])

  function begin() {
    finishingRef.current = false
    const session = startExam(EXAM_QUESTION_COUNT)
    setRunning(session)
    setIndex(0)
    setAnswers({})
    setSelected('')
    setResult(null)
    setRemainingMs(EXAM_DURATION_MS)
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
      finishExam(running, nextAnswers)
      return
    }
    setIndex(index + 1)
    setSelected('')
  }

  if (result) {
    return (
      <ExamResults
        exam={result}
        onAgain={() => {
          finishingRef.current = false
          setResult(null)
        }}
      />
    )
  }

  if (!running) {
    return (
      <div className="surface p-6 md:p-8 space-y-5 max-w-lg animate-rise">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Simulation
        </p>
        <h1 className="brand text-3xl font-bold">Exam mode</h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {EXAM_QUESTION_COUNT} harder questions randomly drawn from the 300-question bank. Timed for
          60 minutes. No feedback until the end — review opens after submit or when time runs out.
        </p>
        <ul className="text-sm text-[var(--muted)] space-y-1.5 list-disc pl-5">
          <li>Biased toward Advanced / Intermediate and Select TWO items</li>
          <li>Options shuffled; domains hidden while you work</li>
          <li>Auto-submits when the clock hits 00:00</li>
        </ul>
        <button type="button" onClick={begin} className="btn-amber">
          Start {EXAM_QUESTION_COUNT}-question exam
        </button>
      </div>
    )
  }

  const q = running.questions[index]
  const multi = q.type === 'multiple' || q.selectCount > 1
  const canProceed = multi
    ? Array.isArray(selected) && selected.length === q.selectCount
    : typeof selected === 'string' && selected.length > 0
  const urgent = remainingMs <= 5 * 60 * 1000

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex justify-between items-center text-sm gap-3">
        <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Exam in progress
        </span>
        <span
          className={`mono text-base font-semibold tabular-nums ${
            urgent ? 'text-[var(--bad)]' : 'text-[var(--ink)]'
          }`}
        >
          {formatCountdown(remainingMs)}
        </span>
      </div>
      <ProgressBar value={index} max={running.questions.length} />
      <div className="surface p-6 md:p-8 space-y-5">
        <div className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Question {index + 1} / {running.questions.length}
          {multi ? ` · Select ${q.selectCount === 2 ? 'TWO' : q.selectCount}` : ''}
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
