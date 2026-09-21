import rawQuestions from '../data/questions.json'
import type { PresentedQuestion, Question } from '../types/question'
import type { ProgressState, QuestionProgress } from '../types/progress'
import { getQuestionProgress } from './progress'
import { loadProgress } from './storage'

type RawQuestion = Question & {
  options?: string[] | Record<string, string>
  optionsArray?: string[]
  correct_answer?: string
  correctAnswer?: string | string[]
}

function normalizeQuestion(raw: RawQuestion): Question {
  let options: string[] = []
  let correctAnswer: string | string[] = raw.correctAnswer ?? ''

  if (Array.isArray(raw.optionsArray) && raw.optionsArray.length) {
    options = raw.optionsArray
  } else if (Array.isArray(raw.options)) {
    options = raw.options
  } else if (raw.options && typeof raw.options === 'object') {
    const letters = ['A', 'B', 'C', 'D'] as const
    options = letters.map((l) => (raw.options as Record<string, string>)[l]).filter(Boolean)
    if (raw.correct_answer && (raw.options as Record<string, string>)[raw.correct_answer]) {
      correctAnswer = (raw.options as Record<string, string>)[raw.correct_answer]
    }
  }

  return {
    id: raw.id,
    question: raw.question,
    options,
    correctAnswer,
    explanation: raw.explanation,
    topic: raw.topic,
    subtopic: raw.subtopic,
    sourcePage: raw.sourcePage,
    sourceSection: raw.sourceSection,
    source: raw.source ?? 'course-pdf',
    difficulty: raw.difficulty,
    confusionPoints: raw.confusionPoints,
    tags: raw.tags,
    selectCount: raw.selectCount ?? 1,
    status: raw.status ?? 'ok',
  }
}

export const allQuestions = (rawQuestions as unknown as RawQuestion[])
  .map(normalizeQuestion)
  .filter((q) => q.status !== 'NEEDS_REVIEW' && q.options.length >= 2)

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function presentQuestion(q: Question): PresentedQuestion {
  return { ...q, shuffledOptions: shuffle(q.options) }
}

export function getQuestions(): Question[] {
  return allQuestions
}

export function getTopics(): string[] {
  return [...new Set(allQuestions.map((q) => q.topic))].sort()
}

export function getQuestionsByTopic(topic: string): Question[] {
  return allQuestions.filter((q) => q.topic === topic)
}

export function getRandomQuestions(count: number, pool = allQuestions): Question[] {
  return shuffle(pool).slice(0, Math.min(count, pool.length))
}

export type PracticeFilter =
  | 'all'
  | 'unanswered'
  | 'weak'
  | 'incorrect'
  | 'developing'
  | 'topic'
  | 'random'
  | 'confusion'

export function filterQuestions(
  filter: PracticeFilter,
  opts: { topic?: string; state?: ProgressState } = {},
): Question[] {
  const state = opts.state ?? loadProgress()

  switch (filter) {
    case 'unanswered':
      return allQuestions.filter((q) => getQuestionProgress(state, q.id).attempts === 0)
    case 'weak':
      return allQuestions.filter((q) => {
        const p = getQuestionProgress(state, q.id)
        return p.mastery === 'WEAK' || p.mastery === 'LEARNING'
      })
    case 'incorrect':
      return allQuestions.filter((q) => getQuestionProgress(state, q.id).incorrect > 0)
    case 'developing':
      return allQuestions.filter((q) => getQuestionProgress(state, q.id).mastery === 'DEVELOPING')
    case 'topic':
      return opts.topic ? getQuestionsByTopic(opts.topic) : allQuestions
    case 'confusion':
      return allQuestions.filter((q) => (q.confusionPoints?.length ?? 0) > 0)
    case 'random':
    case 'all':
    default:
      return allQuestions
  }
}

export function getWeakQuestions(state: ProgressState = loadProgress()): Question[] {
  return allQuestions
    .map((q) => ({ q, p: getQuestionProgress(state, q.id) }))
    .filter(({ p }) => p.incorrect > 0 || p.mastery === 'WEAK' || p.mastery === 'LEARNING')
    .sort((a, b) => weaknessScore(b.p) - weaknessScore(a.p))
    .map(({ q }) => q)
}

function weaknessScore(p: QuestionProgress): number {
  return (
    p.consecutiveIncorrect * 5 +
    p.incorrect * 3 +
    (p.mastery === 'WEAK' ? 10 : 0) +
    (p.mastery === 'LEARNING' ? 4 : 0) -
    p.consecutiveCorrect
  )
}

export function getIncorrectQuestions(state: ProgressState = loadProgress()): Question[] {
  return allQuestions.filter((q) => getQuestionProgress(state, q.id).incorrect > 0)
}

export function getUnansweredQuestions(state: ProgressState = loadProgress()): Question[] {
  return allQuestions.filter((q) => getQuestionProgress(state, q.id).attempts === 0)
}

export function getRetestQuestions(state: ProgressState = loadProgress(), now = new Date()): Question[] {
  return allQuestions
    .map((q) => ({ q, p: getQuestionProgress(state, q.id) }))
    .filter(({ p }) => {
      if (p.attempts === 0) return false
      if (!p.nextReviewAt) return p.incorrect > 0
      return new Date(p.nextReviewAt).getTime() <= now.getTime()
    })
    .sort((a, b) => weaknessScore(b.p) - weaknessScore(a.p))
    .map(({ q }) => q)
}

export function getMasteredQuestions(state: ProgressState = loadProgress()): Question[] {
  return allQuestions.filter((q) => getQuestionProgress(state, q.id).mastery === 'MASTERED')
}

export function buildDailySession(state: ProgressState = loadProgress()): Question[] {
  const weak = getWeakQuestions(state).slice(0, 10)
  const retest = getRetestQuestions(state)
    .filter((q) => !weak.some((w) => w.id === q.id))
    .slice(0, 10)
  const mixed = getRandomQuestions(
    10,
    allQuestions.filter((q) => ![...weak, ...retest].some((x) => x.id === q.id)),
  )
  const mastered = shuffle(getMasteredQuestions(state)).slice(0, 5)
  const remaining = getRandomQuestions(
    Math.max(0, 35 - weak.length - retest.length - mixed.length - mastered.length),
    allQuestions.filter(
      (q) => ![...weak, ...retest, ...mixed, ...mastered].some((x) => x.id === q.id),
    ),
  )
  return shuffle([...weak, ...retest, ...mixed, ...mastered, ...remaining])
}

export function buildWeaknessHunt(count: number, state: ProgressState = loadProgress()): Question[] {
  const prioritized = [
    ...getWeakQuestions(state),
    ...allQuestions.filter((q) => (q.confusionPoints?.length ?? 0) > 0),
    ...getUnansweredQuestions(state),
  ]
  const unique: Question[] = []
  const seen = new Set<string>()
  for (const q of prioritized) {
    if (seen.has(q.id)) continue
    seen.add(q.id)
    unique.push(q)
    if (unique.length >= count) break
  }
  if (unique.length < count) {
    for (const q of shuffle(allQuestions)) {
      if (seen.has(q.id)) continue
      unique.push(q)
      if (unique.length >= count) break
    }
  }
  return unique
}

export function buildMixedPractice(count: number): Question[] {
  const byTopic = new Map<string, Question[]>()
  for (const q of shuffle(allQuestions)) {
    const list = byTopic.get(q.topic) ?? []
    list.push(q)
    byTopic.set(q.topic, list)
  }
  const topics = [...byTopic.keys()]
  const picked: Question[] = []
  let i = 0
  while (picked.length < count && topics.length) {
    const topic = topics[i % topics.length]
    const list = byTopic.get(topic) ?? []
    const next = list.shift()
    if (next) picked.push(next)
    else topics.splice(i % topics.length, 1)
    i++
  }
  return picked
}
