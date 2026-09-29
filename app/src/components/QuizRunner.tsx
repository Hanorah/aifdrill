import { useMemo, useRef, useState } from 'react'
import type { PresentedQuestion, Question } from '../types/question'
import { formatAnswerList, presentQuestion } from '../lib/questionEngine'
import { recordAttempt, recordSession } from '../lib/progress'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'

type AttemptLog = {
  question: PresentedQuestion
  selected: string | string[]
  isCorrect: boolean
}

type Props = {
  questions: Question[]
  modeLabel: string
  onFinished?: (result: { correct: number; total: number }) => void
  /** When true, full answer + option explanations only appear after an incorrect answer. */
  revealOnFailOnly?: boolean
}

export function QuizRunner({ questions, modeLabel, onFinished, revealOnFailOnly = false }: Props) {
  const presented = useMemo(() => questions.map(presentQuestion), [questions])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | string[]>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const correctRef = useRef(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const attemptsRef = useRef<AttemptLog[]>([])
  const [attempts, setAttempts] = useState<AttemptLog[]>([])

  const current: PresentedQuestion | undefined = presented[index]
  const incorrectCount = attempts.length - correctCount
  const pct = presented.length ? Math.round((correctCount / presented.length) * 100) : 0

  function finish(totalCorrect: number) {
    setDone(true)
    setAttempts([...attemptsRef.current])
    recordSession(modeLabel, totalCorrect, presented.length)
  }

  function leave() {
    onFinished?.({ correct: correctRef.current, total: presented.length })
  }

  function submit() {
    if (!current) return
    const multi = current.type === 'multiple' || current.selectCount > 1
    if (multi) {
      if (!Array.isArray(selected) || selected.length !== current.selectCount) return
    } else if (typeof selected !== 'string' || !selected) {
      return
    }
    const result = recordAttempt(current, selected)
    setIsCorrect(result.isCorrect)
    setShowResult(true)
    attemptsRef.current = [
      ...attemptsRef.current,
      { question: current, selected, isCorrect: result.isCorrect },
    ]
    if (result.isCorrect) {
      correctRef.current += 1
      setCorrectCount(correctRef.current)
    }
  }

  function next() {
    if (index + 1 >= presented.length) {
      finish(correctRef.current)
      return
    }
    setIndex(index + 1)
    setSelected('')
    setShowResult(false)
  }

  if (!questions.length) {
    return (
      <div className="surface p-8 text-[var(--muted)]">
        No questions match this filter yet.
      </div>
    )
  }

  if (done && reviewing) {
    return (
      <div className="space-y-4 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--amber-deep)]">
              Review
            </p>
            <h2 className="brand text-2xl font-bold">Session review</h2>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setReviewing(false)}>
            Back to summary
          </button>
          <button type="button" className="btn-primary" onClick={leave}>
            Done
          </button>
        </div>
        {attempts.map((a, i) => (
          <div key={`${a.question.id}-${i}`} className="surface p-5 text-sm space-y-2">
            <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Q {i + 1} · {a.question.domainName ?? a.question.topic} · {a.question.topic} ·{' '}
              <span className={a.isCorrect ? 'text-[var(--good)]' : 'text-[var(--bad)]'}>
                {a.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <div className="font-semibold text-[var(--ink)]">{a.question.question}</div>
            <div>
              <span className="font-medium">Your answer:</span> {formatAnswerList(a.selected)}
            </div>
            <div className="text-[var(--good)]">
              <span className="font-medium">Correct answer:</span>{' '}
              {formatAnswerList(a.question.correctAnswer)}
            </div>
            {a.question.explanation && (
              <div className="text-[var(--muted)] leading-relaxed">
                <span className="font-medium text-[var(--ink)]">Why this is correct: </span>
                {a.question.explanation}
              </div>
            )}
            <div className="space-y-1.5 pt-1">
              <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                What each option means
              </div>
              {a.question.options.map((opt) => (
                <div key={opt} className="text-[var(--ink-2)]/80">
                  <span className="font-medium text-[var(--ink)]">
                    {opt}
                    {a.question.correctAnswer.includes(opt) ? ' (correct)' : ''}:
                  </span>{' '}
                  {a.question.optionExplanations[opt] ?? '—'}
                </div>
              ))}
            </div>
            {a.question.examTip && (
              <div className="text-[var(--warn)]">
                <span className="font-medium">Exam tip:</span> {a.question.examTip}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (done) {
    return (
      <div className="surface p-8 md:p-10 space-y-4 animate-rise max-w-xl">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--amber-deep)]">
          Session complete
        </p>
        <h2 className="brand text-3xl font-bold">Nice work.</h2>
        <p className="text-lg">
          You scored <strong>{correctCount}</strong> of <strong>{presented.length}</strong> ({pct}
          %).
        </p>
        <p className="text-sm text-[var(--muted)]">
          Answered {presented.length} · Correct {correctCount} · Incorrect {incorrectCount} · Score{' '}
          {pct}%
        </p>
        <p className="text-sm text-[var(--muted)]">
          Progress, mistakes, and mastery updates are saved on this device.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-amber" onClick={() => setReviewing(true)}>
            Review answers
          </button>
          <button type="button" className="btn-secondary" onClick={leave}>
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {modeLabel}
          </p>
          <p className="mono text-[11px] text-[var(--muted)] mt-1">
            Score {correctCount}/{index + (showResult ? 1 : 0)} correct so far
          </p>
        </div>
        <div className="w-full md:w-72">
          <ProgressBar value={index + (showResult ? 1 : 0)} max={presented.length} />
        </div>
      </div>
      <QuestionCard
        key={current.id + index}
        question={current}
        index={index}
        total={presented.length}
        selected={selected}
        showResult={showResult}
        isCorrect={isCorrect}
        revealOnFailOnly={revealOnFailOnly}
        onSelect={setSelected}
        onSubmit={submit}
        onNext={next}
      />
    </div>
  )
}
