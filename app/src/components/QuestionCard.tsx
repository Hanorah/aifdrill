import type { PresentedQuestion } from '../types/question'
import { formatAnswerList } from '../lib/questionEngine'
import { sourceLabel } from '../lib/statistics'
import { AnswerOptions } from './AnswerOptions'

type Props = {
  question: PresentedQuestion
  index: number
  total: number
  selected: string | string[]
  showResult?: boolean
  examMode?: boolean
  onSelect: (value: string | string[]) => void
  onSubmit?: () => void
  onNext?: () => void
  isCorrect?: boolean
}

export function QuestionCard({
  question,
  index,
  total,
  selected,
  showResult,
  examMode,
  onSelect,
  onSubmit,
  onNext,
  isCorrect,
}: Props) {
  const multi = question.type === 'multiple' || question.selectCount > 1
  const canSubmit = multi
    ? Array.isArray(selected) && selected.length === question.selectCount
    : typeof selected === 'string' && selected.length > 0

  return (
    <div className="surface p-6 md:p-8 space-y-5 animate-rise">
      <div className="flex flex-wrap gap-x-3 gap-y-1 mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        <span>
          Q {index + 1} / {total}
        </span>
        {!examMode && question.domainName && <span>{question.domainName}</span>}
        {!examMode && <span>{question.topic}</span>}
        {!examMode && <span>{sourceLabel(question)}</span>}
        {multi && (
          <span className="text-[var(--amber-deep)]">
            Select {question.selectCount === 2 ? 'TWO' : question.selectCount}
          </span>
        )}
      </div>

      <h2 className="text-xl md:text-[1.35rem] leading-relaxed font-semibold text-[var(--ink)]">
        {question.question}
        {multi && (
          <span className="block mt-2 text-base font-medium text-[var(--amber-deep)]">
            (Select {question.selectCount === 2 ? 'TWO' : question.selectCount}.)
          </span>
        )}
      </h2>

      <AnswerOptions
        options={question.shuffledOptions}
        selected={selected}
        multi={multi}
        selectCount={question.selectCount}
        disabled={!!showResult}
        correctAnswer={showResult ? question.correctAnswer : undefined}
        showResult={showResult && !examMode}
        onChange={onSelect}
      />

      {!examMode && showResult && (
        <div
          className={`rounded-2xl p-4 text-sm animate-rise-delay space-y-3 ${
            isCorrect
              ? 'bg-emerald-50 text-[var(--good)] border border-emerald-200'
              : 'bg-red-50 text-[var(--bad)] border border-red-200'
          }`}
        >
          <div className="font-semibold">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>
          <div className="text-[var(--ink-2)]">
            <span className="font-medium">Your answer:</span> {formatAnswerList(selected)}
          </div>
          <div className="text-[var(--ink-2)]">
            <span className="font-medium">Correct answer:</span>{' '}
            {formatAnswerList(question.correctAnswer)}
          </div>
          {question.explanation && (
            <div className="text-[var(--ink-2)]/90 leading-relaxed">{question.explanation}</div>
          )}
          {question.shuffledOptions.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-black/5">
              <div className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Option explanations
              </div>
              {question.shuffledOptions.map((opt) => (
                <div key={opt} className="text-[var(--ink-2)]/80 leading-relaxed">
                  <span className="font-medium text-[var(--ink)]">{opt}:</span>{' '}
                  {question.optionExplanations[opt] ?? '—'}
                </div>
              ))}
            </div>
          )}
          {question.examTip && (
            <div className="text-[var(--warn)] leading-relaxed">
              <span className="font-medium">Exam tip:</span> {question.examTip}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {!showResult && onSubmit && (
          <button type="button" disabled={!canSubmit} onClick={onSubmit} className="btn-amber">
            Submit answer
          </button>
        )}
        {showResult && onNext && (
          <button type="button" onClick={onNext} className="btn-primary">
            {index + 1 >= total ? 'Finish session' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  )
}
