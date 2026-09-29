# Cursor task: Replace the app's existing AWS AIF-C01 question bank with the supplied 300-question 2026 bank

You are editing an existing quiz/practice-exam application.

## Primary goal
Replace ALL current quiz questions with the questions in:

`aif_c01_300_question_bank_2026.json`

After the change, the application must use ONLY this bank for AIF-C01 practice. Do not keep, merge, randomly fall back to, or silently reference old question arrays, seed data, mock data, hard-coded examples, or API responses containing the previous questions.

## First: inspect the project
Before editing anything:
1. Identify the framework and language.
2. Locate every source of quiz questions (JSON, TS/JS arrays, database seed files, fixtures, mock APIs, localStorage seeds, server routes, etc.).
3. Identify the current question type/schema and quiz flow.
4. Identify the components responsible for:
   - rendering a question
   - selecting one or multiple answers
   - submitting/checking an answer
   - showing correct/incorrect feedback
   - showing explanations
   - tracking score/progress
   - review mode / results page
5. Preserve the existing UI design unless a small change is necessary to support the new schema.

Do NOT guess file locations. Search the repository.

## New bank schema
Each question contains fields similar to:

- `id`
- `domain`
- `domainName`
- `topic`
- `difficulty`
- `type`: `"single"` or `"multiple"`
- `question`
- `selectCount`
- `options`
- `correctAnswers`
- `explanation`
- `optionExplanations`
- `examTip`
- `confidenceTier`
- `sourceBasis`

Treat `correctAnswers` as the source of truth.

## Required behavior

### 1. Use only the new 300 questions
- Remove or disconnect the old question bank.
- The app must load all questions from `aif_c01_300_question_bank_2026.json`.
- There must be exactly 300 available questions.
- Do not alter question wording, options, correct answers, explanations, or IDs unless needed only for escaping/serialization.
- Do not generate additional questions at runtime.
- Do not call an LLM/API to invent questions.

### 2. Support single-select questions
For `type: "single"`:
- Allow exactly one selected answer.
- On submit, compare it against `correctAnswers`.
- Lock the answer after submission unless the existing app intentionally supports retry mode.

### 3. Support multiple-select questions
For `type: "multiple"`:
- Clearly display `(Select TWO.)` or equivalent UI guidance using `selectCount`.
- Allow up to `selectCount` answers.
- Do not mark the answer correct unless the selected set EXACTLY matches `correctAnswers`.
- Order must not matter.
- Selecting one correct answer and one incorrect answer is incorrect.
- Selecting fewer than the required number should not be accepted as a completed answer.

### 4. Immediate answer feedback is mandatory
Immediately after the user submits EACH question, show a feedback panel.

If correct, show something equivalent to:
`✓ Correct`

If incorrect, show:
`✗ Incorrect`

Then always show:
- `Your answer:` followed by the user's selection(s)
- `Correct answer:` followed by the correct answer(s)
- the main `explanation`
- explanation for EVERY option using `optionExplanations`
- `Exam tip:` using `examTip`

The explanation must be visible before the user goes to the next question.

### 5. Option-level visual feedback
After submission:
- Correct option(s) should be visibly identified as correct.
- Any wrong option selected by the user should be visibly identified as incorrect.
- Unselected distractors can remain neutral, but their textual explanation must still be shown in the explanation section.
- Do not reveal correctness before submission.

### 6. Score and progress
Maintain:
- number answered
- number correct
- number incorrect
- percentage score
- current question / total
- domain-level performance if the app already has analytics, or add it if straightforward

For multiple-select questions, the question is worth 1 point only when the full set is correct. No partial credit unless an existing explicit mode is already designed for partial credit; default must be no partial credit.

### 7. Review mode
At the end of a quiz/test, the user must be able to review:
- question
- their answer
- correct answer
- correct/incorrect status
- explanation
- per-option explanations
- exam tip
- domain/topic

If the app already has review mode, update it for the new schema.

### 8. Randomization
If the app randomizes:
- randomize QUESTION ORDER if desired
- randomize OPTION ORDER if desired
- NEVER mutate `correctAnswers`
- compare by option value/ID, not display position/index
- preserve reproducible IDs

### 9. Exam modes
If the app already supports different modes:
- keep them working
- Practice/Review mode: immediate feedback after every submitted question
- Timed/Exam mode: if the existing design intentionally hides answers until the end, keep that behavior ONLY for timed/exam mode
- For the normal practice mode requested here, immediate right/wrong + explanation is mandatory

If no modes exist, implement the immediate-feedback practice behavior as the default.

### 10. Domain coverage
Do not rebalance or delete questions. The supplied bank intentionally contains:
- 60 — Fundamentals of AI and ML
- 72 — Fundamentals of GenAI
- 84 — Applications of Foundation Models
- 42 — Guidelines for Responsible AI
- 42 — Security, Compliance, and Governance for AI Solutions

### 11. Validation
Add or run validation that checks:
- total questions = 300
- all IDs are unique
- every question has at least 4 options
- each correct answer exists in `options`
- single questions have exactly 1 correct answer
- multiple questions have exactly `selectCount` correct answers
- no duplicate IDs
- no empty explanation
- no empty `optionExplanations` for any displayed option

### 12. Tests
Create/update automated tests for at least:
- correct single-select answer
- incorrect single-select answer
- exact-match multiple-select answer
- partially correct multiple-select answer must be marked incorrect
- answer order must not matter for multiple-select
- feedback panel displays correct/incorrect
- correct answer displays
- explanation displays
- per-option explanations display
- score increments correctly
- 300-question bank validation passes

## Important content rule
Do not rewrite the questions using AI. Do not substitute questions from the existing project. Do not copy questions from external exam-dump sites. Use only the supplied 300-question JSON as the content source.

## Implementation quality
- Follow the project's existing conventions.
- Keep type safety if TypeScript is used.
- Avoid unnecessary dependencies.
- Do not break navigation or existing styling.
- Remove dead imports/data created by disconnecting the old question bank.
- If the current schema differs, write a small adapter/normalizer rather than manually editing 300 questions.

## Final verification report
When finished, report:
1. Files changed
2. Where the 300-question bank is loaded
3. Confirmation old questions are no longer reachable
4. Single-select behavior
5. Multiple-select behavior
6. Immediate feedback behavior
7. Review-mode behavior
8. Test results
9. Confirmation the bank contains exactly 300 questions
