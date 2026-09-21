export type QuestionSource = 'course-pdf' | 'aws-official-practice' | 'exam-likely'

export type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer: string | string[]
  explanation?: string
  topic: string
  subtopic?: string
  sourcePage?: number
  sourceSection?: string
  source: QuestionSource
  difficulty?: 'easy' | 'medium' | 'hard'
  confusionPoints?: string[]
  tags?: string[]
  selectCount?: number
  status?: 'ok' | 'NEEDS_REVIEW'
}

export type PresentedQuestion = Question & {
  shuffledOptions: string[]
}
