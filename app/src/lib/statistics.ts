import type { Question } from '../types/question'
import type { ProgressState } from '../types/progress'
import { getQuestionProgress } from './progress'
import { allQuestions } from './questionEngine'
import { loadProgress } from './storage'
import { topicStats } from './examEngine'

export function mostDangerousWeaknesses(
  state: ProgressState = loadProgress(),
  limit = 8,
): Array<{ label: string; score: number; kind: 'topic' | 'question' | 'confusion' }> {
  const items: Array<{ label: string; score: number; kind: 'topic' | 'question' | 'confusion' }> = []

  for (const t of topicStats(allQuestions, state)) {
    if (t.attempts === 0) continue
    const score = (1 - t.accuracy) * t.attempts + t.weak * 4
    if (score > 0.5) items.push({ label: t.topic, score, kind: 'topic' })
  }

  for (const q of allQuestions) {
    const p = getQuestionProgress(state, q.id)
    if (p.incorrect === 0) continue
    items.push({
      label: q.question.slice(0, 80) + (q.question.length > 80 ? '…' : ''),
      score: p.incorrect * 3 + p.consecutiveIncorrect * 4,
      kind: 'question',
    })
  }

  const confusion = new Map<string, number>()
  for (const q of allQuestions) {
    const p = getQuestionProgress(state, q.id)
    for (const c of q.confusionPoints ?? []) {
      confusion.set(c, (confusion.get(c) ?? 0) + p.incorrect * 2 + (p.mastery === 'WEAK' ? 3 : 0))
    }
  }
  for (const [label, score] of confusion) {
    if (score > 0) items.push({ label, score, kind: 'confusion' })
  }

  return items.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function sourceLabel(q: Question): string {
  if (q.source === 'aif-c01-2026-bank') {
    return q.domainName ? `AIF-C01 2026 · ${q.domainName}` : 'AIF-C01 2026 practice bank'
  }
  if (q.source === 'course-pdf') {
    return `Course PDF${q.sourcePage ? ` · p.${q.sourcePage}` : ''}`
  }
  if (q.source === 'aws-official-practice') return 'AWS Official Practice Sample'
  if (q.source === 'instructor-bank') {
    return q.sourceSection ? `Instructor bank · ${q.sourceSection}` : 'Instructor practice bank'
  }
  return 'Exam-likely (guide-aligned)'
}
