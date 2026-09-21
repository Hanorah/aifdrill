import type { MasteryLevel, QuestionProgress } from '../types/progress'

export function computeMastery(p: QuestionProgress): MasteryLevel {
  if (p.attempts === 0) return 'NEW'

  const accuracy = p.correct / p.attempts

  if (p.consecutiveIncorrect >= 2 || (p.incorrect >= 3 && accuracy < 0.4)) {
    return 'WEAK'
  }

  if (
    p.consecutiveCorrect >= 3 &&
    p.attempts >= 4 &&
    accuracy >= 0.85 &&
    p.incorrect <= 1
  ) {
    return 'MASTERED'
  }

  if (p.consecutiveCorrect >= 2 && accuracy >= 0.8 && p.attempts >= 3) {
    return 'STRONG'
  }

  if (accuracy >= 0.6 && p.attempts >= 2) {
    return 'DEVELOPING'
  }

  return 'LEARNING'
}

export function scheduleNextReview(
  mastery: MasteryLevel,
  wasCorrect: boolean,
  now = new Date(),
): string {
  const hours =
    !wasCorrect
      ? mastery === 'WEAK'
        ? 0.5
        : 2
      : mastery === 'MASTERED'
        ? 72
        : mastery === 'STRONG'
          ? 36
          : mastery === 'DEVELOPING'
            ? 12
            : 4

  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
}
