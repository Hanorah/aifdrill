import { useMemo, useRef, useState } from 'react'
import type { PresentedQuestion, Question } from '../types/question'
import { presentQuestion } from '../lib/questionEngine'
import { recordAttempt, recordSession } from '../lib/progress'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'

type Props = {
  questions: Question[]
  modeLabel: string
  onFinished?: (result: { correct: number; total: number }) => void
}

export function QuizRunner({ questions, modeLabel, onFinished }: Props) {
  const presented = useMemo(() => questions.map(presentQuestion), [questions])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | string[]>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const correctRef = useRef(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const current: PresentedQuestion | undefined = presented[index]

  function finish(totalCorrect: number) {
    setDone(true)
    recordSession(modeLabel, totalCorrect, presented.length)
    onFinished?.({ correct: totalCorrect, total: presented.length })
  }

  function submit() {
    if (!current) return
    const result = recordAttempt(current, selected)
    setIsCorrect(result.isCorrect)
    setShowResult(true)
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

  if (done) {
    const pct = Math.round((correctCount / presented.length) * 100)
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
          Progress, mistakes, and mastery updates are saved on this device.
        </p>
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
        onSelect={setSelected}
        onSubmit={submit}
        onNext={next}
      />
    </div>
  )
}
