export type QuestionSource =
  | 'course-pdf'
  | 'aws-official-practice'
  | 'exam-likely'
  | 'instructor-bank'
  | 'aif-c01-2026-bank'

export type QuestionType = 'single' | 'multiple'

export type QuestionDifficulty = 'Foundational' | 'Intermediate' | 'Advanced' | string

export type Question = {
  id: string
  question: string
  options: string[]
  /** Normalized from bank `correctAnswers`; always an array for exact-match scoring. */
  correctAnswer: string[]
  explanation: string
  optionExplanations: Record<string, string>
  examTip: string
  topic: string
  domain?: string
  domainName?: string
  type: QuestionType
  selectCount: number
  difficulty?: QuestionDifficulty
  confidenceTier?: string
  sourceBasis?: string[]
  source: QuestionSource
  subtopic?: string
  sourcePage?: number
  sourceSection?: string
  confusionPoints?: string[]
  tags?: string[]
  status?: 'ok' | 'NEEDS_REVIEW'
}

export type PresentedQuestion = Question & {
  shuffledOptions: string[]
}
