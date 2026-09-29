import { describe, expect, it } from 'vitest'
import { answersMatch } from '../lib/progress'
import { allQuestions, formatAnswerList, getExamSets } from '../lib/questionEngine'
import { validateQuestionBank } from '../lib/validateBank'

describe('AIF-C01 Word-doc question bank', () => {
  it('loads all imported questions and passes validation', () => {
    expect(allQuestions.length).toBeGreaterThanOrEqual(250)
    const result = validateQuestionBank(allQuestions)
    expect(result.ok, result.issues.map((i) => `${i.id ?? '?'}: ${i.message}`).join('\n')).toBe(
      true,
    )
    expect(result.questionCount).toBe(allQuestions.length)
  })

  it('has unique ids', () => {
    const ids = allQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has four exam sets from the four documents', () => {
    const sets = getExamSets()
    expect(sets).toHaveLength(4)
    expect(sets[0].length).toBe(65)
    expect(sets[1].length).toBe(65)
    expect(sets[2].length).toBe(65)
    expect(sets[3].length).toBe(61)
    expect(sets.reduce((n, s) => n + s.length, 0)).toBe(allQuestions.length)
  })
})

describe('answersMatch scoring', () => {
  it('marks a correct single-select answer', () => {
    const q = allQuestions.find((item) => item.type === 'single')!
    expect(answersMatch(q.correctAnswer[0], q.correctAnswer)).toBe(true)
  })

  it('marks an incorrect single-select answer', () => {
    const q = allQuestions.find((item) => item.type === 'single')!
    const wrong = q.options.find((o) => !q.correctAnswer.includes(o))!
    expect(answersMatch(wrong, q.correctAnswer)).toBe(false)
  })

  it('requires exact match for multiple-select', () => {
    const correct = ['A', 'B']
    expect(answersMatch(['A', 'B'], correct)).toBe(true)
    expect(answersMatch(['B', 'A'], correct)).toBe(true)
  })

  it('marks partially correct multiple-select as incorrect', () => {
    expect(answersMatch(['A'], ['A', 'B'])).toBe(false)
    expect(answersMatch(['A', 'C'], ['A', 'B'])).toBe(false)
  })

  it('ignores answer order for multiple-select', () => {
    expect(answersMatch(['B', 'A'], ['A', 'B'])).toBe(true)
  })
})

describe('feedback content helpers', () => {
  const sample = allQuestions[0]

  it('exposes correct answer list for feedback panel', () => {
    expect(sample.correctAnswer.length).toBeGreaterThan(0)
    expect(formatAnswerList(sample.correctAnswer)).toContain(sample.correctAnswer[0])
  })

  it('exposes explanation text', () => {
    expect(sample.explanation.trim().length).toBeGreaterThan(0)
  })

  it('exposes per-option explanations', () => {
    for (const opt of sample.options) {
      expect(sample.optionExplanations[opt]?.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('score increment semantics', () => {
  it('awards one point only for full exact match', () => {
    const multi = allQuestions.find((q) => q.type === 'multiple')
    expect(multi).toBeTruthy()
    if (!multi) return

    let score = 0
    if (answersMatch(multi.correctAnswer, multi.correctAnswer)) score += 1
    expect(score).toBe(1)

    score = 0
    const partial = multi.correctAnswer.slice(0, 1)
    if (answersMatch(partial, multi.correctAnswer)) score += 1
    expect(score).toBe(0)
  })
})

describe('feedback panel contract', () => {
  it('supports correct/incorrect labels and required review fields', () => {
    const q = allQuestions.find((item) => item.type === 'single')!
    const selected = q.options.find((o) => !q.correctAnswer.includes(o)) ?? q.options[0]
    const isCorrect = answersMatch(selected, q.correctAnswer)
    const panel = {
      status: isCorrect ? '✓ Correct' : '✗ Incorrect',
      yourAnswer: formatAnswerList(selected),
      correctAnswer: formatAnswerList(q.correctAnswer),
      explanation: q.explanation,
      optionExplanations: q.options.map((opt) => q.optionExplanations[opt]),
    }
    expect(panel.status).toBe('✗ Incorrect')
    expect(panel.yourAnswer).toBe(selected)
    expect(panel.correctAnswer).toBe(formatAnswerList(q.correctAnswer))
    expect(panel.explanation.length).toBeGreaterThan(0)
    expect(panel.optionExplanations.every((e) => e && e.length > 0)).toBe(true)
  })
})
