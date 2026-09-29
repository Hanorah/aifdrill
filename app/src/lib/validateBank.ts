import type { Question } from '../types/question'
import { allQuestions } from './questionEngine'

export type BankValidationIssue = {
  id?: string
  code: string
  message: string
}

export type BankValidationResult = {
  ok: boolean
  questionCount: number
  issues: BankValidationIssue[]
}

export function validateQuestionBank(questions: Question[] = allQuestions): BankValidationResult {
  const issues: BankValidationIssue[] = []

  if (questions.length !== 300) {
    issues.push({
      code: 'count',
      message: `Expected 300 questions, found ${questions.length}`,
    })
  }

  const seen = new Set<string>()
  for (const q of questions) {
    if (!q.id) {
      issues.push({ code: 'missing-id', message: 'Question missing id' })
      continue
    }
    if (seen.has(q.id)) {
      issues.push({ id: q.id, code: 'duplicate-id', message: `Duplicate id ${q.id}` })
    }
    seen.add(q.id)

    if (!q.options || q.options.length < 4) {
      issues.push({
        id: q.id,
        code: 'options',
        message: `Expected at least 4 options, found ${q.options?.length ?? 0}`,
      })
    }

    if (!q.explanation?.trim()) {
      issues.push({ id: q.id, code: 'explanation', message: 'Empty explanation' })
    }

    for (const opt of q.options ?? []) {
      if (!q.optionExplanations?.[opt]?.trim()) {
        issues.push({
          id: q.id,
          code: 'option-explanation',
          message: `Missing optionExplanation for "${opt}"`,
        })
      }
    }

    for (const ans of q.correctAnswer) {
      if (!q.options.includes(ans)) {
        issues.push({
          id: q.id,
          code: 'correct-not-in-options',
          message: `Correct answer not in options: "${ans}"`,
        })
      }
    }

    if (q.type === 'single' && q.correctAnswer.length !== 1) {
      issues.push({
        id: q.id,
        code: 'single-correct-count',
        message: `Single question must have exactly 1 correct answer, found ${q.correctAnswer.length}`,
      })
    }

    if (q.type === 'multiple' && q.correctAnswer.length !== q.selectCount) {
      issues.push({
        id: q.id,
        code: 'multiple-correct-count',
        message: `Multiple question selectCount=${q.selectCount} but correctAnswers=${q.correctAnswer.length}`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    questionCount: questions.length,
    issues,
  }
}
