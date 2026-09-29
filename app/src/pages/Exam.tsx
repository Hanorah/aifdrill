import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PresentedQuestion } from '../types/question'
import type { ExamRecord } from '../types/progress'
import {
  EXAM_DURATION_MS,
  EXAM_SET_COUNT,
  gradeExam,
  peekExamSetInfo,
  startExam,
} from '../lib/examEngine'
import { answersMatch, recordAttempt } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'
import { ProgressBar } from '../components/ProgressBar'
import { ExamResults } from './ExamResults'

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Exam() {
  const peek = peekExamSetInfo()
  const [running, setRunning] = useState<{
    questions: PresentedQuestion[]
    startedAt: number
    endsAt: number
    setLabel: string
  } | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string | string[]>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [result, setResult] = useState<ExamRecord | null>(null)
  const [remainingMs, setRemainingMs] = useState(EXAM_DURATION_MS)
  const [nextPeek, setNextPeek] = useState(peek)
  const selectedRef = useRef(selected)
  const answersRef = useRef(answers)
  const indexRef = useRef(index)
  const showResultRef = useRef(showResult)
  const finishingRef = useRef(false)

  selectedRef.current = selected
  answersRef.current = answers
  indexRef.current = index
  showResultRef.current = showResult

  const finishExam = useCallback(
    (session: NonNullable<typeof running>, finalAnswers: Record<string, string | string[]>) => {
      if (finishingRef.current) return
      finishingRef.current = true
      const exam = gradeExam(session.questions, finalAnswers, true, session.startedAt)
      setResult(exam)
      setRunning(null)
      setShowResult(false)
      setNextPeek(peekExamSetInfo())
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
        // If they already submitted this question, answer is in `answers`.
        // Otherwise lock in the current selection if present.
        if (q && !final[q.id] && cur && (Array.isArray(cur) ? cur.length : cur)) {
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
    const session = startExam()
    setRunning(session)
    setIndex(0)
    setAnswers({})
    setSelected('')
    setShowResult(false)
    setIsCorrect(false)
    setResult(null)
    setRemainingMs(EXAM_DURATION_MS)
  }

  function submit() {
    if (!running || showResult) return
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
    setIsCorrect(answersMatch(selected, q.correctAnswer))
    setShowResult(true)
  }

  function next() {
    if (!running || !showResult) return
    if (index + 1 >= running.questions.length) {
      finishExam(running, answers)
      return
    }
    setIndex(index + 1)
    setSelected('')
    setShowResult(false)
    setIsCorrect(false)
  }

  function abandon() {
    if (!window.confirm('Leave this exam? Your current answers will not be scored.')) return
    finishingRef.current = false
    setRunning(null)
    setIndex(0)
    setAnswers({})
    setSelected('')
    setShowResult(false)
    setIsCorrect(false)
    setResult(null)
    setRemainingMs(EXAM_DURATION_MS)
    setNextPeek(peekExamSetInfo())
  }

  if (result) {
    return (
      <ExamResults
        exam={result}
        onAgain={() => {
          finishingRef.current = false
          setResult(null)
          setNextPeek(peekExamSetInfo())
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
          Timed mock using one of {EXAM_SET_COUNT} fixed question sets from the Word documents (about
          65 each). Sets rotate so you get different questions each sitting. After each question you
          see the correct answer and explanations, then move on.
        </p>
        <ul className="text-sm text-[var(--muted)] space-y-1.5 list-disc pl-5">
          <li>
            Next up: <strong className="text-[var(--ink)]">{nextPeek.label}</strong> (
            {nextPeek.count} questions)
          </li>
          <li>60-minute timer · auto-submits at 00:00</li>
          <li>Per-question review plus a full results summary at the end</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="btn-secondary">
            Back
          </Link>
          <button type="button" onClick={begin} className="btn-amber">
            Start {nextPeek.label} ({nextPeek.count} questions)
          </button>
        </div>
      </div>
    )
  }

  const q = running.questions[index]
  const urgent = remainingMs <= 5 * 60 * 1000

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex justify-between items-center text-sm gap-3">
        <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {running.setLabel}
        </span>
        <span
          className={`mono text-base font-semibold tabular-nums ${
            urgent ? 'text-[var(--bad)]' : 'text-[var(--ink)]'
          }`}
        >
          {formatCountdown(remainingMs)}
        </span>
      </div>
      <ProgressBar value={index + (showResult ? 1 : 0)} max={running.questions.length} />
      <QuestionCard
        key={q.id + index}
        question={q}
        index={index}
        total={running.questions.length}
        selected={selected}
        showResult={showResult}
        isCorrect={isCorrect}
        onSelect={setSelected}
        onSubmit={submit}
        onNext={next}
        onBack={abandon}
      />
    </div>
  )
}
