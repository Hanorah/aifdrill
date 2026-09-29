/**
 * Import exact questions from AWS AIF (1–4).docx paragraph dumps.
 * Preserves question/option wording; only structures into the app bank format.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadParas(n) {
  return fs
    .readFileSync(path.join(root, 'scripts', 'output', `docx${n}-paras.txt`), 'utf8')
    .split(/\r?\n/)
    .map(decodeEntities)
}

function decodeEntities(s) {
  return s
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014|–|—/g, '-')
    .replace(/\u2022|•/g, '-')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ|â€\u009d|â€/g, '"')
    .replace(/â€"|â€“|â€”/g, '-')
    .replace(/â€¢/g, '-')
    .replace(/Â/g, '')
    .replace(/â€‘/g, '-')
}

const RESULT_RE = /^(Incorrect|Correct|0\s*\/\s*\d+\s*Points)/i
const Q_START_RE = /^(\d+)\.\s*Question(.*)$/i

function findQuestionStarts(paras) {
  // Prefer the contiguous run that starts at "1. Question"
  const all = []
  for (let i = 0; i < paras.length; i++) {
    const m = paras[i].match(Q_START_RE)
    if (m) all.push({ i, num: Number(m[1]), rest: m[2] || '' })
  }
  // Find last index where num === 1 (the real quiz body; ignore UI chrome)
  let begin = all.findIndex((q) => q.num === 1)
  // If multiple "1. Question", take the last one that is followed by a dense sequence
  const ones = all.map((q, idx) => ({ ...q, idx })).filter((q) => q.num === 1)
  if (ones.length > 1) {
    begin = ones[ones.length - 1].idx
  }
  if (begin < 0) begin = 0

  const slice = all.slice(begin)
  // Deduplicate by number (keep first in this run)
  const seen = new Set()
  const out = []
  for (const q of slice) {
    if (seen.has(q.num)) continue
    // Stop if numbering resets unexpectedly to a lower number after we've progressed
    if (out.length && q.num < out[out.length - 1].num && q.num === 1) break
    seen.add(q.num)
    out.push(q)
  }
  return out
}

function extractExplanation(resultLines) {
  let text = resultLines.join('\n')
  text = text.replace(/^(Incorrect|Correct)\s*/i, '')
  text = text.replace(/^0\s*\/\s*\d+\s*Points\s*/im, '')
  text = text.replace(/^(Incorrect|Correct)\s*/i, '')
  return text.trim()
}

function extractCorrectRaw(explanation) {
  const answers = []
  const multi = explanation.match(
    /(?:Hence|Thus|Therefore),\s*the\s*correct\s+answers\s+are:\s*([\s\S]+?)(?=(?:The option that says:|References?:|Resources?:|Check out|$))/i,
  )
  if (multi) {
    let block = multi[1]
      .replace(/â€“|â€”/g, '–')
      .replace(/\u2013|\u2014/g, '–')
    // Bullets may be newline-separated or glued: "are:– A.– B."
    const bullets = [...block.matchAll(/(?:^|[\n]|[–•\-])\s*(.+?)(?=(?:[.\s]*[–•\-]\s+[A-Z])|$)/g)]
    // Prefer explicit en-dash / bullet splits
    const dashSplit = block
      .split(/(?:^|[\n])\s*[–•\-]\s*|(?<=\.)\s*[–•\-]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)

    const parts = dashSplit.length >= 2 ? dashSplit : bullets.map((b) => b[1].trim()).filter(Boolean)

    if (parts.length >= 2 || (parts.length === 1 && parts[0].length > 10)) {
      for (let a of parts) {
        a = a.replace(/^[–•\-]\s*/, '').trim()
        a = a.replace(/\.\s+(It|This|Bedrock|Amazon|By |With )\b[\s\S]*$/i, '')
        a = a.replace(/\.$/, '').trim()
        if (a && !/^(Hence|Thus|Therefore)$/i.test(a)) answers.push(a)
      }
      if (answers.length) return answers
    }

    // Matching style: "objective: Answer - objective2: Answer2"
    if (block.includes(':')) {
      const pieces = block.split(/\s*-\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean)
      for (let a of pieces) {
        a = a.replace(/\.\s+(It|This|Bedrock|Amazon|By |With )\b[\s\S]*$/i, '')
        a = a.replace(/\.$/, '').trim()
        if (a) answers.push(a)
      }
      if (answers.length) return answers
    }
  }

  const single = explanation.match(
    /(?:Hence|Thus|Therefore),\s*the\s*correct\s+answer\s+is:\s*([\s\S]+?)(?=(?:The option that says:|References?:|Resources?:|Check out|$))/i,
  )
  if (single) {
    let a = single[1].trim()
    const period = a.indexOf('.')
    if (period > 0 && period < 220) {
      const rest = a.slice(period + 1).trim()
      if (/^(This |It |The |Amazon |SageMaker |By |With )/i.test(rest) || rest.length > 40) {
        a = a.slice(0, period)
      }
    }
    a = a.replace(/\.$/, '').trim()
    answers.push(a)
  }
  return answers
}

/** Parse TutorialsDojo matching blobs: Objective.Opt1Opt2Opt3(Correct)Objective2... */
function parseMatchingBlob(blob) {
  const segments = []
  const re = /\(([^)]+)\)/g
  let last = 0
  let m
  while ((m = re.exec(blob))) {
    const before = blob.slice(last, m.index)
    const answer = m[1].trim()
    segments.push({ before, answer })
    last = m.index + m[0].length
  }
  if (segments.length < 2) return null

  const correctAnswers = []
  const options = new Set()
  const promptParts = []

  for (const seg of segments) {
    const lastDot = seg.before.lastIndexOf('.')
    let objective = seg.before
    let optsBlob = ''
    if (lastDot >= 0) {
      objective = seg.before.slice(0, lastDot + 1).trim()
      optsBlob = seg.before.slice(lastDot + 1).trim()
    }
    promptParts.push(`${objective} → (${seg.answer})`)
    correctAnswers.push(seg.answer)
    options.add(seg.answer)

    // Split concatenated options by detecting the correct answer and known separators is hard;
    // pull distractors from camel/Title Case runs and explanation later.
    if (optsBlob) {
      // Insert split before capital-letter starts of known-ish tokens
      const rough = optsBlob
        .replace(/([a-z\)])([A-Z])/g, '$1\n$2')
        .replace(/(\))([A-Z])/g, '$1\n$2')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      for (const o of rough) {
        if (o.length > 1 && o.length < 80) options.add(o)
      }
    }
  }

  return {
    promptExtra: promptParts.join('\n'),
    correctAnswers,
    options: [...options],
  }
}

function selectCountFromText(text) {
  const m = text.match(/\(Select\s+(TWO|THREE|FOUR|\d+)/i) || text.match(/Select\s+(TWO|THREE|FOUR)\.?\)/i)
  if (!m) {
    if (/Select and order/i.test(text)) return 3
    return 1
  }
  const w = m[1].toUpperCase()
  if (w === 'TWO') return 2
  if (w === 'THREE') return 3
  if (w === 'FOUR') return 4
  return Number(w) || 1
}

function expectedOptionCount(selectCount, lineCount) {
  if (selectCount === 2) return Math.min(lineCount - 1, 5)
  if (selectCount === 3) return Math.min(lineCount - 1, 6)
  return Math.min(lineCount - 1, 4)
}

function fuzzyIncludes(hay, needle) {
  if (!hay || !needle) return false
  const h = hay.toLowerCase().replace(/\s+/g, ' ').trim()
  const n = needle.toLowerCase().replace(/\s+/g, ' ').trim()
  return h === n || h.includes(n) || n.includes(h)
}

function matchOption(options, answer) {
  const a = answer.replace(/\.$/, '').trim()
  // Matching form "objective: choice"
  const colon = a.match(/^(.+?):\s*(.+)$/)
  if (colon) {
    const rhs = colon[2].trim()
    const hit = options.find((o) => fuzzyIncludes(o, rhs) || o === rhs)
    if (hit) return hit
  }
  let hit = options.find((o) => o === a)
  if (hit) return hit
  hit = options.find((o) => fuzzyIncludes(o, a))
  if (hit) return hit
  // Prefix match 30 chars
  hit = options.find((o) => o.startsWith(a.slice(0, 40)) || a.startsWith(o.slice(0, 40)))
  return hit || null
}

function splitStemAndOptions(beforeResult, correctRaw, explanation, selectCount) {
  const lines = beforeResult.map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return { question: '', options: [] }

  const blob = lines.length > 1 ? lines.slice(1).join('') : ''
  const parenCount = (blob.match(/\([^)]{2,80}\)/g) || []).length
  if (parenCount >= 2) {
    const matchParsed = parseMatchingBlob(blob)
    if (matchParsed) {
      const opts = new Set(matchParsed.options)
      for (const c of correctRaw) {
        const colon = c.match(/^(.+?):\s*(.+)$/)
        opts.add((colon ? colon[2] : c).trim().replace(/\.$/, ''))
      }
      const re = /The option that says:\s*(.+?)\s+is incorrect/gi
      let m
      while ((m = re.exec(explanation))) opts.add(m[1].trim().replace(/\.$/, ''))
      // Keep original matching line verbatim in the question
      return {
        question: `${lines[0]}\n\n${lines.slice(1).join('\n\n')}`,
        options: [...opts].filter((o) => o.length > 1 && o.length < 120),
        special: true,
        matchedCorrect: matchParsed.correctAnswers,
      }
    }
  }

  const isSpecial =
    /Match each|Select and order|order the prerequisites|Select the correct type|Match the appropriate|Select the correct Amazon/i.test(
      lines[0],
    ) || lines.some((l) => (l.match(/\([^)]{2,60}\)/g) || []).length >= 2)

  if (isSpecial) {
    const opts = new Set()
    const matchedCorrect = []
    for (const c of correctRaw) {
      const colon = c.match(/^(.+?):\s*(.+)$/)
      const choice = (colon ? colon[2] : c).trim().replace(/\.$/, '')
      opts.add(choice)
      matchedCorrect.push(choice)
    }
    const re = /The option that says:\s*(.+?)\s+is incorrect/gi
    let m
    while ((m = re.exec(explanation))) opts.add(m[1].trim().replace(/\.$/, ''))
    const bare = [...explanation.matchAll(/(?:^|[.\n])\s*([A-Z][^.\n]{2,80}?)\s+is incorrect/g)]
    for (const b of bare) {
      const t = b[1].trim()
      if (!/^The option/i.test(t) && t.length < 80) opts.add(t)
    }
    return {
      question: lines.join('\n\n'),
      options: [...opts],
      special: true,
      matchedCorrect,
    }
  }

  // Identify option block using correct answers present as lines
  const matchedIdx = []
  for (let i = 0; i < lines.length; i++) {
    for (const c of correctRaw) {
      if (matchOption([lines[i]], c) === lines[i] || fuzzyIncludes(lines[i], c) || fuzzyIncludes(c, lines[i])) {
        matchedIdx.push(i)
        break
      }
    }
  }

  let optStart
  if (matchedIdx.length) {
    const expect = expectedOptionCount(selectCount, lines.length)
    optStart = Math.min(matchedIdx[0], Math.max(1, lines.length - expect))
    while (optStart > 1) {
      const prev = lines[optStart - 1]
      const mentioned =
        explanation.includes(prev) ||
        explanation.includes(`The option that says: ${prev}`) ||
        /is incorrect/i.test(explanation.split(prev)[1]?.slice(0, 40) || '')
      if (mentioned || (prev.length < 200 && !/\?\s*$/.test(lines[optStart - 2] || ''))) {
        if (prev.length > 300) break
        optStart--
        continue
      }
      break
    }
  } else {
    const expect = expectedOptionCount(selectCount, lines.length)
    optStart = Math.max(1, lines.length - expect)
  }

  if (optStart < 1) optStart = 1
  if (optStart >= lines.length) optStart = Math.max(1, lines.length - 4)

  return {
    question: lines.slice(0, optStart).join('\n\n'),
    options: lines.slice(optStart),
  }
}

function extractOptionExplanations(explanation, options, correctAnswers) {
  const map = {}
  const re =
    /The option that says:\s*(.+?)\s+is incorrect(?: because)?\s*([\s\S]*?)(?=(?:The option that says:|References?:|Resources?:|Check out|$))/gi
  let m
  while ((m = re.exec(explanation))) {
    const optText = m[1].trim().replace(/\.$/, '')
    const reason = (m[2] || '').trim().replace(/\s*References?:[\s\S]*$/i, '').trim()
    const matched = matchOption(options, optText) || options.find((o) => fuzzyIncludes(o, optText))
    if (matched) map[matched] = reason || `${matched} is incorrect.`
  }

  // Bare form: "Amazon Lex is incorrect because ..."
  for (const opt of options) {
    if (map[opt]) continue
    if (correctAnswers.includes(opt)) continue
    const esc = opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const bare = new RegExp(
      `${esc}\\s+is incorrect(?: because)?\\s*([\\s\\S]*?)(?=(?:The option that says:|[A-Z][^\\n]{0,100}?\\s+is incorrect|References?:|Resources?:|Check out|$))`,
      'i',
    )
    const bm = explanation.match(bare)
    if (bm) map[opt] = bm[1].trim()
  }

  const beforeHence = explanation.split(/Hence,\s*the\s*correct/i)[0].trim()
  for (const c of correctAnswers) {
    if (!map[c]) map[c] = beforeHence.slice(0, 1200) || 'Correct.'
  }
  return map
}

function mainExplanation(explanation) {
  let main = explanation
  const henceIdx = explanation.search(/Hence,\s*the\s*correct/i)
  if (henceIdx >= 0) {
    const after = explanation.slice(henceIdx)
    const untilOpts = after.split(/The option that says:/i)[0].trim()
    const before = explanation.slice(0, henceIdx).trim()
    main = `${before}\n\n${untilOpts}`.trim()
  }
  return main
    .replace(/\s*References?:[\s\S]*$/i, '')
    .replace(/\s*Resources?:[\s\S]*$/i, '')
    .replace(/\s*Check out[\s\S]*$/i, '')
    .trim()
}

function guessDomain(question, explanation) {
  const text = `${question} ${explanation}`.toLowerCase()
  if (
    /macie|iam |vpc|privatelink|encryption|poisoning|prompt injection|security|compliance|governance|pii|sensitive data|access control|hashing/.test(
      text,
    )
  ) {
    return { domain: 'D5', domainName: 'Security, Compliance, and Governance for AI Solutions' }
  }
  if (/responsible|bias|fairness|transparency|explainab|toxicity|guardrail|ethics|privacy|hallucin/.test(text)) {
    return { domain: 'D4', domainName: 'Guidelines for Responsible AI' }
  }
  if (
    /bedrock|rag|prompt engineering|foundation model|llm|token|fine-tun|embeddings|temperature|top-p|context window|agents|knowledge base/.test(
      text,
    )
  ) {
    return { domain: 'D3', domainName: 'Applications of Foundation Models' }
  }
  if (/generative ai|gan|diffusion|genai|amazon q|foundation models/.test(text)) {
    return { domain: 'D2', domainName: 'Fundamentals of Generative AI' }
  }
  return { domain: 'D1', domainName: 'Fundamentals of AI and ML' }
}

function parseDoc(docNum) {
  const paras = loadParas(docNum)
  const starts = findQuestionStarts(paras)
  const questions = []

  for (let qi = 0; qi < starts.length; qi++) {
    const { i, num, rest } = starts[qi]
    const end = qi + 1 < starts.length ? starts[qi + 1].i : paras.length
    const afterHeader = paras.slice(i + 1, end)
    const following = rest.trim() ? [rest.trim(), ...afterHeader] : afterHeader

    let resultIdx = following.findIndex((l) => RESULT_RE.test(l))
    if (resultIdx < 0) resultIdx = following.length

    const beforeResult = following.slice(0, resultIdx)
    const explanation = extractExplanation(following.slice(resultIdx))
    const selectCountHint = selectCountFromText([rest, ...beforeResult].join(' '))
    const correctRaw = extractCorrectRaw(explanation)
    const split = splitStemAndOptions(beforeResult, correctRaw, explanation, selectCountHint)

    let question = split.question.replace(/^Question\s*/i, '').trim()
    let options = split.options.map((o) => o.trim()).filter(Boolean)

    let correctAnswers = []
    if (split.matchedCorrect?.length) {
      for (const c of split.matchedCorrect) {
        const hit = matchOption(options, c) || c
        if (!options.includes(hit)) options.push(hit)
        correctAnswers.push(hit)
      }
    } else {
      for (const c of correctRaw) {
        const hit = matchOption(options, c)
        if (hit) correctAnswers.push(hit)
        else {
          const cleaned = c.replace(/\.$/, '').trim()
          const colon = cleaned.match(/^(.+?):\s*(.+)$/)
          const choice = colon ? colon[2].trim() : cleaned
          if (!options.includes(choice)) options.push(choice)
          correctAnswers.push(choice)
        }
      }
    }
    correctAnswers = [...new Set(correctAnswers)]

    let selectCount = selectCountHint
    if (correctAnswers.length > 1) selectCount = correctAnswers.length
    if (selectCount === 1 && correctAnswers.length === 1) selectCount = 1

    const type = selectCount > 1 ? 'multiple' : 'single'
    const optionExplanations = extractOptionExplanations(explanation, options, correctAnswers)
    const { domain, domainName } = guessDomain(question, explanation)
    const explanationClean = mainExplanation(explanation)

    const warnings = []
    if (!question) warnings.push('empty-question')
    if (options.length < 2) warnings.push('few-options')
    if (!correctAnswers.length) warnings.push('no-correct')
    if (correctAnswers.some((c) => !options.includes(c))) warnings.push('correct-not-in-options')

    questions.push({
      id: `AIF-DOC${docNum}-${String(num).padStart(3, '0')}`,
      examSet: docNum,
      sourceQuestionNumber: num,
      domain,
      domainName,
      topic: domainName,
      difficulty: 'Intermediate',
      type,
      question,
      selectCount,
      options,
      correctAnswers,
      explanation: explanationClean,
      optionExplanations,
      examTip: '',
      confidenceTier: 'instructor-bank',
      sourceBasis: [`AWS AIF (${docNum}).docx`],
      _parseWarnings: warnings,
      _correctRaw: correctRaw,
    })
  }
  return questions
}

const all = []
const report = []
for (const n of [1, 2, 3, 4]) {
  const qs = parseDoc(n)
  report.push({
    doc: n,
    count: qs.length,
    warnings: qs
      .filter((q) => q._parseWarnings.length)
      .map((q) => ({
        id: q.id,
        warnings: q._parseWarnings,
        optionCount: q.options.length,
        correct: q.correctAnswers,
        correctRaw: q._correctRaw,
        questionPreview: q.question.slice(0, 120),
        optionsPreview: q.options.map((o) => o.slice(0, 60)),
      })),
  })
  all.push(...qs)
}

function finalizeQuestion(q, fullExplanationFallback = '') {
  // Drop junk options that are fragments from over-splitting (e.g. "Quality", "Check")
  // Keep options that are correct or appear as full phrases in explanations/option text.
  const explBlob = `${q.explanation}\n${Object.values(q.optionExplanations || {}).join('\n')}`
  let options = [...q.options]
  if (options.length > 10) {
    // Matching questions sometimes explode — keep correct + options mentioned in explanations
    const keep = new Set(q.correctAnswers)
    for (const o of options) {
      if (explBlob.includes(o) || (q.optionExplanations && q.optionExplanations[o])) keep.add(o)
    }
    // Also keep reasonably long options
    for (const o of options) {
      if (o.length >= 12) keep.add(o)
    }
    options = [...keep]
  }

  // Normalize trailing periods between correctAnswers and options
  const norm = (s) => s.replace(/\.$/, '').trim()
  const optionByNorm = new Map(options.map((o) => [norm(o), o]))
  const correctAnswers = q.correctAnswers.map((c) => {
    const hit = optionByNorm.get(norm(c))
    if (hit) return hit
    // Add if missing
    options.push(c)
    optionByNorm.set(norm(c), c)
    return c
  })

  // Rebuild option explanations with fuzzy key remapping
  const rawExpl = { ...(q.optionExplanations || {}) }
  const optionExplanations = {}
  for (const opt of options) {
    let text = ''
    if (rawExpl[opt]?.trim()) {
      text = rawExpl[opt].trim()
    } else {
      const key = Object.keys(rawExpl).find(
        (k) =>
          norm(k) === norm(opt) ||
          fuzzyIncludes(k, opt) ||
          fuzzyIncludes(opt, k) ||
          norm(k).includes(norm(opt)) ||
          norm(opt).includes(norm(k)),
      )
      if (key && rawExpl[key]?.trim()) text = rawExpl[key].trim()
    }
    if (!text && correctAnswers.includes(opt)) {
      text = (q.explanation || fullExplanationFallback).slice(0, 1200) || 'Correct.'
    }
    if (!text) {
      const esc = opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const m2 = (q.explanation || '').match(
        new RegExp(
          `(?:The option that says:\\s*)?${esc.replace(/\\\./g, '\\.?')}\\.?\\s+is incorrect(?: because)?\\s*([\\s\\S]*?)(?=(?:The option that says:|[A-Z][^\\n]{0,100}?\\s+is incorrect|References?:|Resources?:|Check out|$))`,
          'i',
        ),
      )
      if (m2?.[1]?.trim()) text = m2[1].trim()
    }
    optionExplanations[opt] =
      text ||
      (correctAnswers.includes(opt)
        ? q.explanation?.trim() || 'Correct.'
        : `This option is incorrect. The correct answer is: ${correctAnswers.join('; ')}.`)
  }

  return {
    ...q,
    options,
    correctAnswers,
    optionExplanations,
    selectCount: correctAnswers.length > 1 ? correctAnswers.length : q.selectCount,
    type: correctAnswers.length > 1 ? 'multiple' : q.type,
  }
}

const cleaned = all.map(({ _parseWarnings, _correctRaw, ...q }) => finalizeQuestion(q))
const bank = {
  metadata: {
    title: 'AWS Certified AI Practitioner (AIF-C01) — Question bank from Word documents',
    created: new Date().toISOString().slice(0, 10),
    questionCount: cleaned.length,
    examSets: 4,
    source: 'AWS AIF (1).docx, AWS AIF (2).docx, AWS AIF (3).docx, AWS AIF (4).docx',
    note: 'Questions, options, answers, and explanations taken from the source documents without rewriting.',
    countsBySet: {
      1: cleaned.filter((q) => q.examSet === 1).length,
      2: cleaned.filter((q) => q.examSet === 2).length,
      3: cleaned.filter((q) => q.examSet === 3).length,
      4: cleaned.filter((q) => q.examSet === 4).length,
    },
  },
  questions: cleaned,
}

fs.writeFileSync(path.join(root, 'app', 'src', 'data', 'aif_c01_260_question_bank.json'), JSON.stringify(bank, null, 2))
fs.writeFileSync(path.join(root, 'scripts', 'output', 'docx-import-report.json'), JSON.stringify({ total: cleaned.length, report }, null, 2))

const missingExpl = cleaned.filter((q) => q.options.some((o) => !q.optionExplanations[o]?.trim()))
console.log(
  JSON.stringify(
    {
      total: cleaned.length,
      perDoc: report.map((r) => ({ doc: r.doc, count: r.count, warn: r.warnings.length })),
      missingExpl: missingExpl.length,
      sampleWarn: report.flatMap((r) => r.warnings).slice(0, 8),
    },
    null,
    2,
  ),
)
