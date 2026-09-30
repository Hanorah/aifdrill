import bank from '../data/aif_c01_256_FULL_REAUDIT_2026-09-30.json'
import type { PresentedQuestion, Question, QuestionType } from '../types/question'
import type { ProgressState, QuestionProgress } from '../types/progress'
import { getQuestionProgress } from './progress'
import { loadProgress } from './storage'

type BankFile = {
  metadata?: { questionCount?: number }
  questions: BankQuestion[]
}

type BankQuestion = {
  id: string
  domain?: string
  domainName?: string
  topic: string
  difficulty?: string
  type?: QuestionType | string
  question: string
  selectCount?: number
  options: string[]
  correctAnswers: string[]
  explanation: string
  optionExplanations?: Record<string, string>
  examTip?: string
  confidenceTier?: string
  sourceBasis?: string[]
  examSet?: number
  sourceQuestionNumber?: number
}

function explanationForOption(
  option: string,
  rawMap: Record<string, string>,
  correct: string[],
  explanation: string,
): string {
  const direct = rawMap[option]?.trim()
  if (direct) return direct

  const paren = option.match(/\(([^)]+)\)/)?.[1]?.trim()
  const keys = Object.keys(rawMap).filter((k) => k.length <= 160)
  const key =
    keys.find((k) => k === paren) ??
    keys.find((k) => option.startsWith(k) || (paren && (k === paren || k.includes(paren))))

  const fromKey = key ? rawMap[key]?.trim() : ''
  if (fromKey) return fromKey

  const blobs = Object.keys(rawMap).filter((k) => k.length > 160)
  const esc = option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const blob of blobs) {
    const hit = blob.match(
      new RegExp(
        `${esc}\\s+is incorrect(?: because)?\\s*([\\s\\S]*?)(?=(?:[A-Z][^.]{0,60}\\s+is incorrect|$))`,
        'i',
      ),
    )
    if (hit?.[1]?.trim()) return hit[1].trim()
  }

  if (correct.includes(option)) {
    const beforeHence = explanation.split(/Hence,\s*the\s*correct/i)[0].trim()
    if (beforeHence) return beforeHence.slice(0, 1200)
  }

  const mentioned = explanation.match(
    new RegExp(
      `${esc}[^.]*is incorrect(?: because)?\\s*([\\s\\S]*?)(?=(?:[A-Z][^\\n.]{0,80}?\\s+is incorrect|References?:|Check out|$))`,
      'i',
    ),
  )
  if (mentioned?.[1]?.trim()) return mentioned[1].trim()

  return correct.includes(option)
    ? 'This is a correct answer for this question.'
    : `This option is incorrect. The correct answer is: ${correct.join('; ')}.`
}

function normalizeQuestion(raw: BankQuestion): Question {
  const options = Array.isArray(raw.options) ? raw.options.filter(Boolean) : []
  const correctAnswer = Array.isArray(raw.correctAnswers)
    ? raw.correctAnswers.filter(Boolean)
    : []
  const selectCount = raw.selectCount ?? correctAnswer.length ?? 1
  const type: QuestionType =
    raw.type === 'multiple' || selectCount > 1 ? 'multiple' : 'single'
  const rawMap = raw.optionExplanations ?? {}
  const optionExplanations = Object.fromEntries(
    options.map((opt) => [
      opt,
      explanationForOption(opt, rawMap, correctAnswer, raw.explanation ?? ''),
    ]),
  )

  return {
    id: raw.id,
    question: raw.question,
    options,
    correctAnswer,
    explanation: raw.explanation ?? '',
    optionExplanations,
    examTip: raw.examTip ?? '',
    topic: raw.topic,
    domain: raw.domain,
    domainName: raw.domainName,
    type,
    selectCount,
    difficulty: raw.difficulty,
    confidenceTier: raw.confidenceTier,
    sourceBasis: raw.sourceBasis,
    source: 'aif-c01-2026-bank',
    sourceSection: raw.domainName,
    status: 'ok',
    ...(raw.examSet != null ? { tags: [`exam-set-${raw.examSet}`] } : {}),
  }
}

const bankFile = bank as unknown as BankFile

export const allQuestions: Question[] = bankFile.questions
  .map(normalizeQuestion)
  .filter((q) => q.status !== 'NEEDS_REVIEW' && q.options.length >= 2)

/** Four document-based exam sittings (different questions each time).
 * Docs are 65 / 65 / 68 / 58 — redistribute leftover doc3 items into set 4
 * so the first three sittings are exactly 65 questions.
 */
export function getExamSets(): Question[][] {
  const bySet = new Map<number, Question[]>()
  for (const q of allQuestions) {
    const tag = q.tags?.find((t) => t.startsWith('exam-set-'))
    const n = tag ? Number(tag.replace('exam-set-', '')) : 1
    const list = bySet.get(n) ?? []
    list.push(q)
    bySet.set(n, list)
  }
  const doc1 = bySet.get(1) ?? []
  const doc2 = bySet.get(2) ?? []
  const doc3 = bySet.get(3) ?? []
  const doc4 = bySet.get(4) ?? []
  return [doc1, doc2, doc3.slice(0, 65), [...doc3.slice(65), ...doc4]]
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function presentQuestion(q: Question): PresentedQuestion {
  // Keep option order exactly as in the source documents
  return { ...q, shuffledOptions: [...q.options] }
}

export function getQuestions(): Question[] {
  return allQuestions
}

export function getTopics(): string[] {
  return [...new Set(allQuestions.map((q) => q.topic))].sort()
}

export function getDomains(): string[] {
  return [
    ...new Set(allQuestions.map((q) => q.domainName).filter(Boolean) as string[]),
  ].sort()
}

export function getQuestionsByTopic(topic: string): Question[] {
  return allQuestions.filter((q) => q.topic === topic)
}

export function getQuestionsByDomain(domainName: string): Question[] {
  return allQuestions.filter((q) => q.domainName === domainName)
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
  | 'domain'

export function filterQuestions(
  filter: PracticeFilter,
  opts: { topic?: string; domain?: string; state?: ProgressState } = {},
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
    case 'domain':
      return opts.domain ? getQuestionsByDomain(opts.domain) : allQuestions
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
    const key = q.domainName ?? q.topic
    const list = byTopic.get(key) ?? []
    list.push(q)
    byTopic.set(key, list)
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

export function formatAnswerList(value: string | string[] | undefined): string {
  if (value == null) return '—'
  const list = Array.isArray(value) ? value : [value]
  if (!list.length || (list.length === 1 && !list[0])) return '—'
  return list.join('; ')
}
