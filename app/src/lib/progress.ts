import type { Question } from '../types/question'
import type {
  ErrorLogEntry,
  ExamRecord,
  ProgressState,
  QuestionProgress,
} from '../types/progress'
import { computeMastery, scheduleNextReview } from './mastery'
import { loadProgress, saveProgress } from './storage'

function defaultProgress(questionId: string): QuestionProgress {
  return {
    questionId,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastAttempted: '',
    mastery: 'NEW',
  }
}

export function getQuestionProgress(
  state: ProgressState,
  questionId: string,
): QuestionProgress {
  return state.questions[questionId] ?? defaultProgress(questionId)
}

export function answersMatch(
  selected: string | string[],
  correct: string | string[],
): boolean {
  const a = Array.isArray(selected) ? [...selected].sort() : [selected]
  const b = Array.isArray(correct) ? [...correct].sort() : [correct]
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

export function recordAttempt(
  question: Question,
  selected: string | string[],
  state: ProgressState = loadProgress(),
): { state: ProgressState; isCorrect: boolean; progress: QuestionProgress } {
  const isCorrect = answersMatch(selected, question.correctAnswer)
  const prev = getQuestionProgress(state, question.id)
  const now = new Date().toISOString()

  const next: QuestionProgress = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
    consecutiveIncorrect: isCorrect ? 0 : prev.consecutiveIncorrect + 1,
    lastAttempted: now,
    mastery: prev.mastery,
  }
  next.mastery = computeMastery(next)
  next.nextReviewAt = scheduleNextReview(next.mastery, isCorrect, new Date(now))

  const questions = { ...state.questions, [question.id]: next }
  let errorLog = state.errorLog

  if (!isCorrect) {
    const entry: ErrorLogEntry = {
      id: `${question.id}-${Date.now()}`,
      questionId: question.id,
      topic: question.topic,
      myAnswer: selected,
      correctAnswer: question.correctAnswer,
      date: now,
      previousMistakes: prev.incorrect,
      mastery: next.mastery,
    }
    errorLog = [entry, ...errorLog].slice(0, 500)
  }

  const updated: ProgressState = { ...state, questions, errorLog }
  saveProgress(updated)
  return { state: updated, isCorrect, progress: next }
}

export function recordSession(
  mode: string,
  correct: number,
  total: number,
  state: ProgressState = loadProgress(),
): ProgressState {
  const updated: ProgressState = {
    ...state,
    sessionHistory: [
      { date: new Date().toISOString(), mode, correct, total },
      ...state.sessionHistory,
    ].slice(0, 100),
  }
  saveProgress(updated)
  return updated
}

export function recordExam(
  exam: ExamRecord,
  state: ProgressState = loadProgress(),
): ProgressState {
  const updated: ProgressState = {
    ...state,
    exams: [exam, ...state.exams].slice(0, 50),
  }
  saveProgress(updated)
  return updated
}
