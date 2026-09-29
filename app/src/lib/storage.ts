import type { ProgressState } from '../types/progress'

const KEY = 'aif-c01-progress-v2'
const PRACTICE_SESSION_KEY = 'aif-c01-practice-session-v1'

export type SavedPracticeSession = {
  modeLabel: string
  questionIds: string[]
  index: number
  selected: string | string[]
  showResult: boolean
  isCorrect: boolean
  correctCount: number
  attempts: Array<{
    questionId: string
    selected: string | string[]
    isCorrect: boolean
  }>
  updatedAt: string
}

export const emptyProgress = (): ProgressState => ({
  version: 1,
  questions: {},
  errorLog: [],
  exams: [],
  sessionHistory: [],
})

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as ProgressState
    if (!parsed.questions) return emptyProgress()
    return {
      ...emptyProgress(),
      ...parsed,
      questions: parsed.questions ?? {},
      errorLog: parsed.errorLog ?? [],
      exams: parsed.exams ?? [],
      sessionHistory: parsed.sessionHistory ?? [],
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetProgress(): ProgressState {
  const next = emptyProgress()
  saveProgress(next)
  return next
}

export function loadPracticeSession(): SavedPracticeSession | null {
  try {
    const raw = localStorage.getItem(PRACTICE_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedPracticeSession
  } catch {
    return null
  }
}

export function savePracticeSession(session: SavedPracticeSession): void {
  localStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(session))
}

export function clearPracticeSession(): void {
  localStorage.removeItem(PRACTICE_SESSION_KEY)
}

export function hasResumablePractice(modeLabel: string, questionIds: string[]): boolean {
  const saved = loadPracticeSession()
  if (!saved) return false
  if (saved.modeLabel !== modeLabel) return false
  if (saved.questionIds.length !== questionIds.length) return false
  return saved.questionIds.every((id, i) => id === questionIds[i])
}
