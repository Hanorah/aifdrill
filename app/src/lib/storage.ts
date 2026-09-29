import type { ProgressState } from '../types/progress'

const KEY = 'aif-c01-progress-v2'

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
