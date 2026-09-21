export type MasteryLevel =
  | 'NEW'
  | 'LEARNING'
  | 'WEAK'
  | 'DEVELOPING'
  | 'STRONG'
  | 'MASTERED'

export type QuestionProgress = {
  questionId: string
  attempts: number
  correct: number
  incorrect: number
  consecutiveCorrect: number
  consecutiveIncorrect: number
  lastAttempted: string
  nextReviewAt?: string
  mastery: MasteryLevel
}

export type ErrorLogEntry = {
  id: string
  questionId: string
  topic: string
  myAnswer: string | string[]
  correctAnswer: string | string[]
  date: string
  previousMistakes: number
  mastery: MasteryLevel
}

export type ExamRecord = {
  id: string
  date: string
  total: number
  correct: number
  incorrect: number
  percentage: number
  timed: boolean
  durationSeconds?: number
  topicPerformance: Record<string, { correct: number; total: number }>
  answers: Array<{
    questionId: string
    selected: string | string[]
    isCorrect: boolean
  }>
}

export type ProgressState = {
  version: number
  questions: Record<string, QuestionProgress>
  errorLog: ErrorLogEntry[]
  exams: ExamRecord[]
  sessionHistory: Array<{ date: string; mode: string; correct: number; total: number }>
}
