import type { Question } from '../types/question'
import type { ExamRecord, ProgressState } from '../types/progress'
import { answersMatch, getQuestionProgress, recordExam } from './progress'
import { getExamSets, presentQuestion, shuffle } from './questionEngine'
import { loadProgress } from './storage'

export const EXAM_QUESTION_COUNT = 65
export const EXAM_DURATION_MS = 60 * 60 * 1000
export const EXAM_SET_COUNT = 4

const EXAM_SET_KEY = 'aif-c01-next-exam-set-v2'

export function getNextExamSetIndex(): number {
  try {
    const raw = localStorage.getItem(EXAM_SET_KEY)
    const n = raw == null ? 0 : Number(raw)
    if (!Number.isFinite(n) || n < 0) return 0
    return n % EXAM_SET_COUNT
  } catch {
    return 0
  }
}

export function peekExamSetInfo(): { index: number; count: number; label: string } {
  const index = getNextExamSetIndex()
  const sets = getExamSets()
  const count = sets[index]?.length ?? 0
  return {
    index,
    count,
    label: `Exam set ${index + 1} of ${EXAM_SET_COUNT}`,
  }
}

function advanceExamSetIndex(current: number) {
  const next = (current + 1) % EXAM_SET_COUNT
  try {
    localStorage.setItem(EXAM_SET_KEY, String(next))
  } catch {
    /* ignore */
  }
  return next
}

/** Next document set of questions (set 1 → 2 → 3 → 4 → 1…). */
export function pickExamSetQuestions(): { questions: Question[]; setIndex: number } {
  const setIndex = getNextExamSetIndex()
  const sets = getExamSets()
  const questions = sets[setIndex] ?? []
  return { questions, setIndex }
}

export function startExam(_questionCount = EXAM_QUESTION_COUNT) {
  const { questions, setIndex } = pickExamSetQuestions()
  advanceExamSetIndex(setIndex)
  return {
    questions: shuffle(questions).map(presentQuestion),
    startedAt: Date.now(),
    endsAt: Date.now() + EXAM_DURATION_MS,
    setIndex,
    setLabel: `Exam set ${setIndex + 1} of ${EXAM_SET_COUNT}`,
  }
}

export function gradeExam(
  questions: Question[],
  answers: Record<string, string | string[]>,
  timed: boolean,
  startedAt: number,
): ExamRecord {
  const topicPerformance: Record<string, { correct: number; total: number }> = {}
  const detailed: ExamRecord['answers'] = []
  let correct = 0

  for (const q of questions) {
    const selected = answers[q.id] ?? []
    const isCorrect = answersMatch(selected, q.correctAnswer)
    if (isCorrect) correct++
    detailed.push({ questionId: q.id, selected, isCorrect })
    const key = q.domainName ?? q.topic
    const tp = topicPerformance[key] ?? { correct: 0, total: 0 }
    tp.total++
    if (isCorrect) tp.correct++
    topicPerformance[key] = tp
  }

  const exam: ExamRecord = {
    id: `exam-${Date.now()}`,
    date: new Date().toISOString(),
    total: questions.length,
    correct,
    incorrect: questions.length - correct,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    timed,
    durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    topicPerformance,
    answers: detailed,
  }

  recordExam(exam)
  return exam
}

export type ReadinessStatus =
  | 'NOT READY'
  | 'BUILDING'
  | 'DEVELOPING'
  | 'STRONG'
  | 'EXAM READY'

export function calculateReadiness(state: ProgressState = loadProgress()): {
  status: ReadinessStatus
  reasons: string[]
  metrics: {
    attempted: number
    total: number
    accuracy: number
    weakCount: number
    masteredCount: number
    recentExamAvg: number | null
    topicCoverage: number
  }
} {
  const allIds = Object.keys(
    Object.fromEntries(
      Object.entries(state.questions),
    ),
  )

  const progressList = Object.values(state.questions)
  const attempted = progressList.filter((p) => p.attempts > 0).length
  const totalAttempts = progressList.reduce((s, p) => s + p.attempts, 0)
  const totalCorrect = progressList.reduce((s, p) => s + p.correct, 0)
  const accuracy = totalAttempts ? totalCorrect / totalAttempts : 0
  const weakCount = progressList.filter((p) => p.mastery === 'WEAK').length
  const masteredCount = progressList.filter((p) => p.mastery === 'MASTERED').length
  const recentExams = state.exams.slice(0, 3)
  const recentExamAvg = recentExams.length
    ? recentExams.reduce((s, e) => s + e.percentage, 0) / recentExams.length
    : null

  const topicsTouched = new Set(
    progressList
      .filter((p) => p.attempts > 0)
      .map((p) => p.questionId.split('-')[0]),
  )

  const reasons: string[] = []
  let status: ReadinessStatus = 'NOT READY'

  if (attempted < 15) {
    status = 'NOT READY'
    reasons.push('Attempt more questions across topics.')
  } else if (accuracy < 0.55 || weakCount > 8) {
    status = 'BUILDING'
    reasons.push('Accuracy or weak-question count still needs work.')
  } else if (accuracy < 0.7 || masteredCount < 8) {
    status = 'DEVELOPING'
    reasons.push('Build consistency and convert more items to mastered.')
  } else if (
    accuracy >= 0.8 &&
    weakCount <= 2 &&
    masteredCount >= 15 &&
    recentExamAvg !== null &&
    recentExamAvg >= 75 &&
    recentExams.length >= 2
  ) {
    status = 'EXAM READY'
    reasons.push('Strong accuracy, low weakness, and consistent mock exams.')
  } else {
    status = 'STRONG'
    reasons.push('Solid progress — keep mixed practice and mocks consistent.')
  }

  return {
    status,
    reasons,
    metrics: {
      attempted,
      total: Math.max(attempted, allIds.length),
      accuracy,
      weakCount,
      masteredCount,
      recentExamAvg,
      topicCoverage: topicsTouched.size,
    },
  }
}

export function topicStats(questions: Question[], state: ProgressState = loadProgress()) {
  const map = new Map<
    string,
    { topic: string; questions: number; attempts: number; correct: number; weak: number; mastered: number }
  >()

  for (const q of questions) {
    const row = map.get(q.topic) ?? {
      topic: q.topic,
      questions: 0,
      attempts: 0,
      correct: 0,
      weak: 0,
      mastered: 0,
    }
    const p = getQuestionProgress(state, q.id)
    row.questions++
    row.attempts += p.attempts
    row.correct += p.correct
    if (p.mastery === 'WEAK') row.weak++
    if (p.mastery === 'MASTERED') row.mastered++
    map.set(q.topic, row)
  }

  return [...map.values()].map((r) => ({
    ...r,
    accuracy: r.attempts ? r.correct / r.attempts : 0,
  }))
}
