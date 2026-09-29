# AIF-C01 300-Question Bank (2026)

This package contains **300 original AWS Certified AI Practitioner (AIF-C01) practice questions** plus a Cursor implementation prompt.

## Files

- `aif_c01_300_question_bank_2026.json` — 300-question JSON bank
- `CURSOR_REPLACE_QUESTIONS_PROMPT.md` — prompt for Cursor to replace the current app's question set and implement immediate feedback
- `AIF_C01_300_QUESTION_BANK_README.md` — this guide

## Distribution

The question count follows the current AIF-C01 domain weighting:

| Domain | Weight | Questions |
|---|---:|---:|
| Fundamentals of AI and ML | 20% | 60 |
| Fundamentals of GenAI | 24% | 72 |
| Applications of Foundation Models | 28% | 84 |
| Guidelines for Responsible AI | 14% | 42 |
| Security, Compliance, and Governance for AI Solutions | 14% | 42 |
| **Total** | **100%** | **300** |

## Feedback built into every question

Every JSON question includes:
- correct answer(s)
- overall explanation
- explanation for each option
- exam tip
- domain/topic
- difficulty
- single-select or multiple-select type

## Design intent

The bank is intentionally scenario-heavy and uses AWS exam-prep wording such as:
- MOST appropriate
- BEST solution
- Select TWO
- requirements and distractors from adjacent services

It is **not an exam dump** and does not claim to reproduce live AWS questions. It is a high-confidence study bank built around the current 2026 exam blueprint and the supplied study materials.

Approximately 80% of the questions are tagged/targeted toward recurring core objectives, with the remaining questions used to broaden blueprint coverage.

## Suggested workflow

1. Put the JSON file inside your application's data/assets folder.
2. Open Cursor at the root of your project.
3. Add the JSON file to the project.
4. Paste the full contents of `CURSOR_REPLACE_QUESTIONS_PROMPT.md` into Cursor.
5. Let Cursor inspect the existing project before it edits anything.
6. Run the app and test both single-select and Select TWO questions.
