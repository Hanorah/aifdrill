import { useEffect, useMemo, useRef, useState } from 'react'
import type { PresentedQuestion, Question } from '../types/question'
import { formatAnswerList, presentQuestion } from '../lib/questionEngine'
import { recordAttempt, recordSession } from '../lib/progress'
import { clearPracticeSession, loadPracticeSession, savePracticeSession } from '../lib/storage'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'

type AttemptLog = {
  questionId: string
  selected: string | string[]
  isCorrect: boolean
}

type Props = {
  questions: Question[]
  modeLabel: string
  onFinished?: (result: { correct: number; total: number }) => void
  /** When true, full answer + option explanations only appear after an incorrect answer. */
  revealOnFailOnly?: boolean
  /** Persist in-progress practice session to localStorage. */
  persistSession?: boolean
}

export function QuizRunner({
  questions,
  modeLabel,
  onFinished,
  revealOnFailOnly = false,
  persistSession = false,
}: Props) {
  const presented = useMemo(() => questions.map(presentQuestion), [questions])
  const byId = useMemo(
    () => Object.fromEntries(presented.map((q) => [q.id, q])),
    [presented],
  )

  const saved = persistSession ? loadPracticeSession() : null
  const canResume =
    !!saved &&
    saved.modeLabel === modeLabel &&
    saved.questionIds.length === presented.length &&
    saved.questionIds.every((id, i) => presented[i]?.id === id)

  const [index, setIndex] = useState(canResume ? saved!.index : 0)
  const [selected, setSelected] = useState<string | string[]>(
    canResume ? saved!.selected : '',
  )
  const [showResult, setShowResult] = useState(canResume ? saved!.showResult : false)
  const [isCorrect, setIsCorrect] = useState(canResume ? saved!.isCorrect : false)
  const correctRef = useRef(canResume ? saved!.correctCount : 0)
  const [correctCount, setCorrectCount] = useState(canResume ? saved!.correctCount : 0)
  const [done, setDone] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const attemptsRef = useRef<AttemptLog[]>(canResume ? saved!.attempts : [])
  const [attempts, setAttempts] = useState<AttemptLog[]>(canResume ? saved!.attempts : [])

  const current: PresentedQuestion | undefined = presented[index]
  const incorrectAttempts = attempts.filter((a) => !a.isCorrect)
  const incorrectCount = attempts.length - correctCount
  const pct = presented.length ? Math.round((correctCount / presented.length) * 100) : 0

  useEffect(() => {
    if (!persistSession || done) return
    savePracticeSession({
      modeLabel,
      questionIds: presented.map((q) => q.id),
      index,
      selected,
      showResult,
      isCorrect,
      correctCount: correctRef.current,
      attempts: attemptsRef.current,
      updatedAt: new Date().toISOString(),
    })
  }, [
    persistSession,
    done,
    modeLabel,
    presented,
    index,
    selected,
    showResult,
    isCorrect,
    correctCount,
    attempts,
  ])

  function finish(totalCorrect: number) {
    setDone(true)
    setAttempts([...attemptsRef.current])
    recordSession(modeLabel, totalCorrect, presented.length)
    if (persistSession) clearPracticeSession()
  }

  function leave() {
    if (persistSession) clearPracticeSession()
    onFinished?.({ correct: correctRef.current, total: presented.length })
  }

  function back() {
    if (persistSession) {
      // Keep progress so they can resume later
      savePracticeSession({
        modeLabel,
        questionIds: presented.map((q) => q.id),
        index,
        selected,
        showResult,
        isCorrect,
        correctCount: correctRef.current,
        attempts: attemptsRef.current,
        updatedAt: new Date().toISOString(),
      })
    }
    onFinished?.({ correct: correctRef.current, total: presented.length })
  }

  function goNextFrom(nextIndex: number, nextCorrect: number) {
    if (nextIndex >= presented.length) {
      finish(nextCorrect)
      return
    }
    setIndex(nextIndex)
    setSelected('')
    setShowResult(false)
    setIsCorrect(false)
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
    attemptsRef.current = [
      ...attemptsRef.current,
      { questionId: current.id, selected, isCorrect: result.isCorrect },
    ]
    setAttempts([...attemptsRef.current])

    if (result.isCorrect) {
      correctRef.current += 1
      setCorrectCount(correctRef.current)
      if (revealOnFailOnly) {
        // No review on correct — advance immediately
        goNextFrom(index + 1, correctRef.current)
        return
      }
    }

    setShowResult(true)
  }

  function next() {
    goNextFrom(index + 1, correctRef.current)
  }

  if (!questions.length) {
    return (
      <div className="surface p-8 text-[var(--muted)]">
        No questions match this filter yet.
      </div>
    )
  }

  if (done && reviewing) {
    const reviewList = revealOnFailOnly ? incorrectAttempts : attempts
    return (
      <div className="space-y-4 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--amber-deep)]">
              Review
            </p>
            <h2 className="brand text-2xl font-bold">
              {revealOnFailOnly ? 'Failed questions' : 'Session review'}
            </h2>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setReviewing(false)}>
            Back to summary
          </button>
          <button type="button" className="btn-primary" onClick={leave}>
            Done
          </button>
        </div>
        {reviewList.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No failed questions to review.</p>
        ) : (
          reviewList.map((a, i) => {
            const q = byId[a.questionId]
            if (!q) return null
            return (
              <div key={`${a.questionId}-${i}`} className="surface p-5 text-sm space-y-2">
                <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Q {i + 1} · {q.domainName ?? q.topic} · {q.topic} ·{' '}
                  <span className="text-[var(--bad)]">Incorrect</span>
                </div>
                <div className="font-semibold text-[var(--ink)] whitespace-pre-wrap">{q.question}</div>
                <div>
                  <span className="font-medium">Your answer:</span> {formatAnswerList(a.selected)}
                </div>
                <div className="text-[var(--good)]">
                  <span className="font-medium">Correct answer:</span>{' '}
                  {formatAnswerList(q.correctAnswer)}
                </div>
                {q.explanation && (
                  <div className="text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
                    <span className="font-medium text-[var(--ink)]">Why this is correct: </span>
                    {q.explanation}
                  </div>
                )}
                <div className="space-y-1.5 pt-1">
                  <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    What each option means
                  </div>
                  {q.options.map((opt) => (
                    <div key={opt} className="text-[var(--ink-2)]/80">
                      <span className="font-medium text-[var(--ink)]">
                        {opt}
                        {q.correctAnswer.includes(opt) ? ' (correct)' : ''}:
                      </span>{' '}
                      {q.optionExplanations[opt] ?? '—'}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
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
          Progress is saved in this browser (localStorage).
        </p>
        <div className="flex flex-wrap gap-2">
          {incorrectCount > 0 && (
            <button type="button" className="btn-amber" onClick={() => setReviewing(true)}>
              Review failed ({incorrectCount})
            </button>
          )}
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
        onBack={back}
      />
    </div>
  )
}
