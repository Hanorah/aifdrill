import { answersMatch } from '../app/src/lib/progress.ts'
import { computeMastery } from '../app/src/lib/mastery.ts'
import { allQuestions } from '../app/src/lib/questionEngine.ts'
import { presentQuestion, shuffle } from '../app/src/lib/questionEngine.ts'

let failed = 0
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  } else console.log('OK:', msg)
}

assert(allQuestions.length >= 80, `question count ${allQuestions.length}`)
assert(
  allQuestions.every((q) => {
    const corrects = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
    return corrects.every((c) => q.options.includes(c))
  }),
  'all correct answers map to options',
)

assert(answersMatch('A', 'A'), 'single match')
assert(!answersMatch('A', 'B'), 'single mismatch')
assert(answersMatch(['B', 'A'], ['A', 'B']), 'multi order-insensitive')

const presented = presentQuestion(allQuestions[0])
assert(presented.shuffledOptions.length === allQuestions[0].options.length, 'shuffle keeps length')
assert(
  [...presented.shuffledOptions].sort().join() === [...allQuestions[0].options].sort().join(),
  'shuffle preserves options',
)

const mastered = computeMastery({
  questionId: 'x',
  attempts: 5,
  correct: 5,
  incorrect: 0,
  consecutiveCorrect: 4,
  consecutiveIncorrect: 0,
  lastAttempted: new Date().toISOString(),
  mastery: 'STRONG',
})
assert(mastered === 'MASTERED', `mastery got ${mastered}`)

const weak = computeMastery({
  questionId: 'y',
  attempts: 4,
  correct: 1,
  incorrect: 3,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 2,
  lastAttempted: new Date().toISOString(),
  mastery: 'LEARNING',
})
assert(weak === 'WEAK', `weak got ${weak}`)

assert(shuffle([1, 2, 3, 4]).length === 4, 'shuffle array length')

if (failed) {
  console.error(`\n${failed} failures`)
  process.exit(1)
}
console.log('\nAll engine smoke tests passed')
