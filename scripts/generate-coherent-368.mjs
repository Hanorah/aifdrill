/**
 * Coherent AIF-C01 question bank — PDF only.
 *
 * Hard rules:
 * - One concept per question (one slide teaching point)
 * - Distractors only from the same conceptual family
 * - Clean bullet extraction (ignore diagram chrome)
 * - Quality gates reject junk stems/options
 * - Exactly 368 questions
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pages = JSON.parse(
  readFileSync(join(root, "scripts", "output", "all-pages.json"), "utf8"),
);
const TARGET = 368;

const SECTIONS = [
  { start: 9, end: 15, name: "Introduction to AI" },
  { start: 16, end: 45, name: "Introduction to AWS and Cloud Computing" },
  { start: 46, end: 58, name: "Fundamentals of Generative AI" },
  { start: 59, end: 98, name: "Amazon Bedrock and GenAI" },
  { start: 99, end: 114, name: "Prompt Engineering" },
  { start: 115, end: 130, name: "Amazon Q" },
  { start: 131, end: 193, name: "AI and Machine Learning (ML)" },
  { start: 194, end: 224, name: "AWS Managed AI Services" },
  { start: 225, end: 261, name: "Amazon SageMaker" },
  { start: 262, end: 302, name: "Responsible AI, Security, Compliance and Governance" },
  { start: 303, end: 355, name: "AWS Security Services & More" },
];

const FAMILY = {
  "Introduction to AI": ["Introduction to AI", "Fundamentals of Generative AI", "AI and Machine Learning (ML)"],
  "Fundamentals of Generative AI": [
    "Fundamentals of Generative AI",
    "Introduction to AI",
    "Amazon Bedrock and GenAI",
    "Prompt Engineering",
  ],
  "Amazon Bedrock and GenAI": [
    "Amazon Bedrock and GenAI",
    "Fundamentals of Generative AI",
    "Prompt Engineering",
    "Amazon Q",
  ],
  "Prompt Engineering": ["Prompt Engineering", "Amazon Bedrock and GenAI", "Fundamentals of Generative AI"],
  "Amazon Q": ["Amazon Q", "Amazon Bedrock and GenAI"],
  "AI and Machine Learning (ML)": ["AI and Machine Learning (ML)", "Introduction to AI", "Amazon SageMaker"],
  "AWS Managed AI Services": ["AWS Managed AI Services"],
  "Amazon SageMaker": ["Amazon SageMaker", "AI and Machine Learning (ML)"],
  "Responsible AI, Security, Compliance and Governance": [
    "Responsible AI, Security, Compliance and Governance",
    "Amazon SageMaker",
    "Amazon Bedrock and GenAI",
  ],
  "Introduction to AWS and Cloud Computing": ["Introduction to AWS and Cloud Computing"],
  "AWS Security Services & More": [
    "AWS Security Services & More",
    "Responsible AI, Security, Compliance and Governance",
  ],
};

const SKIP_TITLE =
  /^(table of contents|disclaimer|congratulations|section overview|estimated cost|diagram|pricing|example$|section introduction)/i;

const VERB =
  /\b(is|are|means|=|allows|allow|helps|help|provides|provide|uses|use|used|enables|enable|supports|support|monitors|monitor|converts|convert|detects|detect|filters|filter|trains|train|generates|generate|consists|includes|include|removes|remove|creates|create|builds|build|answers|answer|analyzes|analyze|finds|find|learns|learn|improves|improve|controls|control|adapts|adapt|references|reference|evaluates|evaluate|organizes|organize)\b/i;

function sectionFor(page) {
  return SECTIONS.find((s) => page >= s.start && page <= s.end)?.name ?? null;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) {
    h ^= String(s).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleSeeded(arr, seed) {
  const a = [...arr];
  let s = hash(seed) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isJunkLine(t) {
  if (!t) return true;
  if (/^https?:/i.test(t)) return true;
  if (/^©|NOT FOR DISTRIBUTION|datacumulus/i.test(t)) return true;
  if (/^\d+\.?$/.test(t)) return true;
  if (/^\*?(Prompt|Query|Response|User|Data Scientist|Train model)\*?$/i.test(t)) return true;
  if (/^[\d$]+$/.test(t)) return true;
  // lone diagram nouns / short labels
  if (t.length <= 28 && !VERB.test(t) && !/[:–-]/.test(t)) return true;
  return false;
}

function isGoodBullet(b) {
  if (!b || b.length < 35 || b.length > 200) return false;
  const hasVerb =
    VERB.test(b) ||
    /^(Build|Create|Use|Keep|Allow|Provide|Filter|Remove|Adapt|Evaluate|Monitor|Convert|Find|Answer|Leverage|Access|Control|Support|Generate|Train|Detect|Organize|Analyze)/i.test(
      b,
    ) ||
    /\bfully managed\b/i.test(b);
  if (!hasVerb) return false;
  if (/\{?\s*"prompt"/i.test(b)) return false;
  const words = b.split(/\s+/);
  if (words.length > 35) return false;
  if ((b.match(/Amazon [A-Z][a-z]+/g) || []).length >= 3 && b.length > 140) return false;
  const lower = (b.match(/\b[a-z]{2,}\b/g) || []).length;
  const imperative = /^(Build|Create|Use|Keep|Allow|Provide|Filter|Remove|Adapt|Evaluate|Monitor|Convert|Find|Answer|Leverage|Access|Control|Support|Generate|Train|Detect|Organize|Analyze)/i.test(
    b,
  );
  if (lower < 3 && !imperative && !/\bfully managed\b/i.test(b)) return false;
  return true;
}

function isContinuationLine(t, parts) {
  if (!parts.length) return false;
  if (/^[a-z(0-9]/.test(t)) return true;
  // mid-sentence fragment after soft wrap
  if (t.length <= 45 && !/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){2,}$/.test(t)) return true;
  return false;
}

/** Extract only real • bullets; merge wrapped lines; ignore diagram chrome */
function extractBullets(lines) {
  const out = [];
  let i = 0;
  const arr = lines.map((l) => String(l).trim());
  while (i < arr.length) {
    if (arr[i] === "•" || arr[i] === "-" || arr[i] === "–") {
      i++;
      const parts = [];
      while (i < arr.length && arr[i] !== "•" && arr[i] !== "-" && arr[i] !== "–") {
        const t = arr[i];
        if (!t || /^https?:/i.test(t) || /^©/.test(t) || /datacumulus|NOT FOR DISTRIBUTION/i.test(t)) {
          i++;
          continue;
        }
        if (isJunkLine(t) && !isContinuationLine(t, parts)) {
          if (parts.length) break;
          i++;
          continue;
        }
        parts.push(t);
        i++;
        const joined = parts.join(" ");
        // only stop on terminal punctuation if next line is NOT a lowercase continuation
        if (/[.!?)]$/.test(joined) && joined.length >= 40) {
          const next = arr[i];
          if (!next || next === "•" || !/^[a-z]/.test(next)) break;
        }
        if (parts.length >= 14) break;
      }
      let bullet = parts.join(" ").replace(/\s+/g, " ").trim();
      bullet = stripTrailingLabels(bullet);
      if (isCompleteBullet(bullet)) out.push(bullet);
      continue;
    }
    i++;
  }
  return [...new Set(out)];
}

function isCompleteBullet(b) {
  if (!isGoodBullet(b)) return false;
  if (/[:;]$/.test(b)) return false;
  // reject truncated soft-wrap leftovers
  if (/\b(the|a|an|your|with|to|for|of|and|or|that|which|who|used|from|into|on|in)$/i.test(b)) {
    return false;
  }
  // reject cut-off compounds like "subset of Deep"
  if (
    /\b(Deep|Machine|Natural|Foundation|Large|Artificial|Neural|Language|Vector|Amazon|Generative)$/i.test(
      b,
    ) &&
    !/[.!?)]$/.test(b)
  ) {
    return false;
  }
  // reject mid-word truncation ("to ge")
  const last = b.split(/\s+/).pop() || "";
  if (
    last.length <= 3 &&
    !/^(AI|ML|FM|NLP|RAG|PII|API|AWS|EC2|S3|IAM|DL|Q)$/i.test(last) &&
    !/[.!?)]$/.test(b)
  ) {
    return false;
  }
  return true;
}

function stripTrailingLabels(text) {
  const words = text.split(/\s+/);
  // find last verb-ish region; drop trailing Capitalized short tokens
  while (words.length > 8) {
    const last = words[words.length - 1];
    const prev = words[words.length - 2] || "";
    const tail = `${prev} ${last}`;
    if (/^[A-Z][\w/-]*$/.test(last) && !VERB.test(tail) && last.length < 18) {
      words.pop();
      continue;
    }
    break;
  }
  return words.join(" ").trim();
}

function cleanTitle(title, page) {
  const t = String(title || "").replace(/\s+/g, " ").trim();
  if (!t || t.length < 3 || SKIP_TITLE.test(t)) return null;
  if (/^acumulus|^https?/i.test(t)) return null;
  if (t.length > 90) return t.slice(0, 87) + "…";
  return t;
}

function buildUnits() {
  const units = [];
  for (const p of pages) {
    const section = sectionFor(p.page);
    if (!section) continue;
    const title = cleanTitle(p.title, p.page);
    if (!title) continue;
    const bullets = extractBullets(p.lines || []);
    if (!bullets.length) continue;

    // Prefer distinctive teaching bullets over generic "fully managed" lines
    const ranked = [...bullets].sort((a, b) => scoreDefinitionBullet(b, title) - scoreDefinitionBullet(a, title));

    units.push({
      id: `c-p${p.page}`,
      page: p.page,
      section,
      title,
      bullets: ranked,
      definition: ranked[0],
    });
  }
  return units;
}

function scoreDefinitionBullet(b, title) {
  let s = 0;
  const key = cleanConceptName(title).split(/\s+/).slice(0, 3).join(" ");
  if (key && new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(b)) s += 4;
  if (/fully managed and serverless/i.test(b)) s -= 4;
  if (/pre-trained ML services for your use case/i.test(b)) s -= 3;
  if (/\b(convert|detect|filter|monitor|transcribe|translate|recommend|embed|retrieve|fine-tun|guardrail|bias|sentiment|speech|image)\b/i.test(b))
    s += 3;
  if (b.length >= 45 && b.length <= 160) s += 2;
  return s;
}

function familyUnits(unit, all) {
  const fam = FAMILY[unit.section] || [unit.section];
  return all.filter((u) => fam.includes(u.section));
}

function pickDistractorTexts(unit, pool, mode, count, seed) {
  /** Prefer same-section siblings first, then wider family. */
  const same = pool.filter((u) => u.section === unit.section && u.id !== unit.id);
  const other = pool.filter((u) => u.section !== unit.section);
  let orderedPeers = [...same, ...other];
  if (mode === "title") {
    orderedPeers = orderedPeers.filter((u) => isExamWorthyTitle(u.title) || looksLikeAwsService(u.title));
    if (orderedPeers.length < 3) orderedPeers = [...same, ...other];
  }

  const candidates = [];
  for (const u of orderedPeers) {
    if (mode === "title") candidates.push(u.title);
    else if (mode === "definition") candidates.push(u.definition);
    else candidates.push(...u.bullets.slice(0, 2));
  }
  const out = [];
  const seen = new Set([String(unit.definition).toLowerCase(), unit.title.toLowerCase()]);
  for (const c of candidates) {
    if (!c) continue;
    const k = c.toLowerCase();
    if (seen.has(k)) continue;
    if (mode === "definition" && !isCompleteBullet(c)) continue;
    if (mode === "bullet" && !isCompleteBullet(c)) continue;
    if (mode === "title" && c.length < 4) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= count) break;
  }
  // light shuffle among selected while keeping quality
  return shuffleSeeded(out, seed).slice(0, count);
}

function makeOptions(correct, distractors, seed) {
  const all = [correct, ...distractors];
  const uniq = [];
  const seen = new Set();
  for (const o of all) {
    const k = String(o).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(o);
  }
  if (uniq.length < 4 || !uniq.includes(correct)) return null;
  return shuffleSeeded(uniq.slice(0, 4), seed);
}

const questions = [];
const seenStem = new Set();
const seenId = new Set();

function add(q) {
  if (questions.length >= TARGET) return false;
  const stem = q.question.replace(/\s+/g, " ").trim().toLowerCase();
  if (seenStem.has(stem) || seenId.has(q.id)) return false;
  if (!q.options || q.options.length !== 4) return false;
  if (new Set(q.options.map((o) => o.toLowerCase())).size !== 4) return false;
  if (!q.options.includes(q.correctAnswer)) return false;
  // option quality
  for (const o of q.options) {
    if (o === q.correctAnswer) continue;
    // distractors for title-mode can be short titles
    if (q._mode === "title") {
      if (String(o).length < 4) return false;
    } else if (!isGoodBullet(o) && String(o).length < 20) return false;
  }
  seenStem.add(stem);
  seenId.add(q.id);
  const { _mode, ...rest } = q;
  questions.push({
    ...rest,
    source: "course-pdf",
    selectCount: 1,
    status: "ok",
    difficulty: rest.difficulty || "medium",
    tags: rest.tags || ["pdf-concept"],
  });
  return true;
}

const units = buildUnits();
console.error(
  JSON.stringify(
    {
      units: units.length,
      bySection: Object.fromEntries(
        [...new Set(units.map((u) => u.section))].map((s) => [
          s,
          units.filter((u) => u.section === s).length,
        ]),
      ),
    },
    null,
    2,
  ),
);

function cleanConceptName(title) {
  return String(title)
    .replace(/^What is\s+/i, "")
    .replace(/\?$/g, "")
    .replace(/\s*[–—-]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAwsService(title) {
  return /Amazon |AWS |SageMaker|Bedrock|Guardrail|Comprehend|Rekognition|Textract|Transcribe|Translate|Polly|Lex|Personalize|Forecast|Kendra|Macie|CloudTrail|IAM|Inspector|Artifact|Config|Q Business|Q Developer|JumpStart|Clarify|Canvas|Ground Truth|Model Monitor|Feature Store|Data Wrangler/i.test(
    title,
  );
}

function isExamWorthyTitle(title) {
  if (looksLikeAwsService(title)) return true;
  return /Foundation Model|Large Language|Prompt|RAG|Fine-?Tun|Guardrail|Supervised|Unsupervised|Reinforcement|Overfitting|Underfitting|Bias|Variance|Responsible AI|Generative AI|Machine Learning|Deep Learning|Neural|Feature Engineering|Hyperparameter|Inference|Embedding|Zero-Shot|Few-Shot|Chain of Thought|Hallucin/i.test(
    title,
  );
}

function scenarioCompany(seed) {
  const companies = [
    "A retail company",
    "A financial services firm",
    "A healthcare organization",
    "A media streaming company",
    "An enterprise IT team",
    "A manufacturing company",
    "A software vendor",
    "A customer-support organization",
  ];
  return companies[hash(String(seed)) % companies.length];
}

function explainCorrect(u, correct, kind) {
  const name = cleanConceptName(u.title);
  if (kind === "service") {
    return `${name} is the correct choice because it provides this capability: ${u.definition}. The other options relate to different AWS AI/ML features and would not satisfy this requirement.`;
  }
  if (kind === "statement") {
    return `${correct} This accurately describes ${name}. The other options refer to related but different AWS AI/ML capabilities.`;
  }
  return `${correct} This is a core characteristic of ${name}. The distractors describe nearby but distinct concepts.`;
}

function forbidMetaWording(text) {
  return !/\b(course|pdf|slide|module|lecture|page\s*\d|taught|textbook|instructor)\b/i.test(
    text,
  );
}

function addDefinition(u) {
  const pool = familyUnits(u, units);
  const distractors = pickDistractorTexts(u, pool, "definition", 3, `d-${u.page}`);
  if (distractors.length < 3) return false;
  const options = makeOptions(u.definition, distractors, `do-${u.page}`);
  if (!options) return false;
  const name = cleanConceptName(u.title);
  const question = looksLikeAwsService(u.title)
    ? `Which statement best describes ${name}?`
    : `Which statement about ${name} is correct?`;
  const explanation = explainCorrect(u, u.definition, "definition");
  if (!forbidMetaWording(question) || !forbidMetaWording(explanation)) return false;
  return add({
    id: `pdf-${u.page}-def`,
    _mode: "definition",
    topic: u.section,
    subtopic: u.title,
    sourcePage: u.page,
    sourceSection: u.title,
    question,
    options,
    correctAnswer: u.definition,
    explanation,
    tags: ["definition", "exam-style"],
  });
}

function addIdentify(u) {
  if (!isExamWorthyTitle(u.title)) return false;
  const pool = familyUnits(u, units);
  const distractors = pickDistractorTexts(u, pool, "title", 3, `i-${u.page}`);
  if (distractors.length < 3) return false;
  // Prefer cleaned service-like titles as options
  const correct = u.title;
  const options = makeOptions(correct, distractors, `io-${u.page}`);
  if (!options) return false;
  const company = scenarioCompany(u.page);
  const need =
    u.definition.length > 140 ? u.definition.slice(0, 137) + "…" : u.definition;
  const question = looksLikeAwsService(u.title)
    ? `${company} needs the following capability:\n\n“${need}”\n\nWhich AWS service or feature should they use?`
    : `${company} is designing an AI solution and needs this capability:\n\n“${need}”\n\nWhich approach or concept should they use?`;
  const explanation = explainCorrect(u, u.definition, "service");
  if (!forbidMetaWording(question) || !forbidMetaWording(explanation)) return false;
  return add({
    id: `pdf-${u.page}-id`,
    _mode: "title",
    topic: u.section,
    subtopic: u.title,
    sourcePage: u.page,
    sourceSection: u.title,
    question,
    options,
    correctAnswer: correct,
    explanation,
    tags: ["identify", "scenario", "exam-style"],
  });
}

function addTrue(u, bulletIndex, suffix) {
  if (!u.bullets[bulletIndex]) return false;
  const correct = u.bullets[bulletIndex];
  if (!isCompleteBullet(correct)) return false;
  const pool = familyUnits(u, units);
  const distractors = pickDistractorTexts(u, pool, "bullet", 3, `t-${suffix}-${u.page}`);
  if (distractors.length < 3) return false;
  const options = makeOptions(correct, distractors, `to-${suffix}-${u.page}`);
  if (!options) return false;
  const name = cleanConceptName(u.title);
  const question = `Which statement about ${name} is correct?`;
  const explanation = explainCorrect(u, correct, "statement");
  if (!forbidMetaWording(question) || !forbidMetaWording(explanation)) return false;
  return add({
    id: `pdf-${u.page}-${suffix}`,
    _mode: "bullet",
    topic: u.section,
    subtopic: u.title,
    sourcePage: u.page,
    sourceSection: u.title,
    question,
    options,
    correctAnswer: correct,
    explanation,
    tags: ["true-statement", "exam-style"],
  });
}

function addScenario(u) {
  if (!isExamWorthyTitle(u.title)) return false;
  const pool = familyUnits(u, units);
  const distractors = pickDistractorTexts(u, pool, "title", 3, `s-${u.page}`);
  if (distractors.length < 3) return false;
  const options = makeOptions(u.title, distractors, `so-${u.page}`);
  if (!options) return false;
  const company = scenarioCompany(`scen-${u.page}`);
  const need =
    u.definition.length > 130 ? u.definition.slice(0, 127) + "…" : u.definition;
  const question = `${company} has this requirement:\n\n“${need}”\n\nWhich option should they choose?`;
  const explanation = explainCorrect(u, u.definition, "service");
  if (!forbidMetaWording(question) || !forbidMetaWording(explanation)) return false;
  return add({
    id: `pdf-${u.page}-scen`,
    _mode: "title",
    topic: u.section,
    subtopic: u.title,
    sourcePage: u.page,
    sourceSection: u.title,
    question,
    options,
    correctAnswer: u.title,
    explanation,
    tags: ["scenario", "exam-style"],
    difficulty: "medium",
  });
}

// Passes
for (const u of units) addDefinition(u);
for (const u of units) {
  if (questions.length >= TARGET) break;
  addIdentify(u);
}
for (const u of units) {
  if (questions.length >= TARGET) break;
  addTrue(u, 1, "true");
}
for (const u of units) {
  if (questions.length >= TARGET) break;
  addScenario(u);
}
for (const u of units) {
  if (questions.length >= TARGET) break;
  addTrue(u, 2, "true2");
}
for (const u of units) {
  if (questions.length >= TARGET) break;
  addTrue(u, 0, "true0"); // rephrase path via different id already blocked; use only if needed
}

// If still short, create identify variants with bullet[1] as snippet
for (const u of units) {
  if (questions.length >= TARGET) break;
  if (!u.bullets[1] || !isCompleteBullet(u.bullets[1])) continue;
  if (!isExamWorthyTitle(u.title)) continue;
  const pool = familyUnits(u, units);
  const distractors = pickDistractorTexts(u, pool, "title", 3, `i2-${u.page}`);
  if (distractors.length < 3) continue;
  const options = makeOptions(u.title, distractors, `i2o-${u.page}`);
  if (!options) continue;
  const snippet = u.bullets[1].length > 150 ? u.bullets[1].slice(0, 147) + "…" : u.bullets[1];
  add({
    id: `pdf-${u.page}-id2`,
    _mode: "title",
    topic: u.section,
    subtopic: u.title,
    sourcePage: u.page,
    sourceSection: u.title,
    question: `${scenarioCompany(`id2-${u.page}`)} needs a solution that can do the following:\n\n“${snippet}”\n\nWhich option should they select?`,
    options,
    correctAnswer: u.title,
    explanation: explainCorrect(u, u.bullets[1], "service"),
    tags: ["identify", "scenario", "exam-style"],
  });
}

function validate(qs) {
  const errors = [];
  const byPage = new Map(units.map((u) => [u.page, u]));
  for (const q of qs) {
    const u = byPage.get(q.sourcePage);
    if (!u) {
      errors.push(`${q.id} no unit`);
      continue;
    }
    const fam = familyUnits(u, units);
    const allowed = new Set();
    for (const x of fam) {
      allowed.add(x.title.toLowerCase());
      allowed.add(x.definition.toLowerCase());
      for (const b of x.bullets) allowed.add(b.toLowerCase());
    }
    for (const o of q.options) {
      if (!allowed.has(o.toLowerCase())) errors.push(`${q.id} outside family: ${o.slice(0, 50)}`);
    }
    // correct must be from THIS unit
    const local = new Set([
      u.title.toLowerCase(),
      u.definition.toLowerCase(),
      ...u.bullets.map((b) => b.toLowerCase()),
    ]);
    if (!local.has(String(q.correctAnswer).toLowerCase())) {
      errors.push(`${q.id} correct not from source slide`);
    }
  }
  return errors;
}

const finalQuestions = questions.slice(0, TARGET);
const coherenceErrors = validate(finalQuestions);
const metaErrors = finalQuestions
  .filter(
    (q) =>
      !forbidMetaWording(q.question) ||
      !forbidMetaWording(q.explanation || "") ||
      q.options.some((o) => !forbidMetaWording(o)),
  )
  .map((q) => q.id);

const byTopic = {};
const byType = {};
for (const q of finalQuestions) {
  byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
  const t = (q.tags || []).find((x) =>
    ["definition", "identify", "true-statement", "scenario"].includes(x),
  );
  byType[t || "other"] = (byType[t || "other"] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  questionsTotal: finalQuestions.length,
  conceptUnits: units.length,
  byTopic,
  byType,
  coherenceErrorCount: coherenceErrors.length,
  metaWordingViolations: metaErrors.length,
  coherenceErrorsSample: coherenceErrors.slice(0, 15),
  metaSample: metaErrors.slice(0, 10),
  sampleQuestions: finalQuestions
    .filter((q) =>
      /Bedrock|Comprehend|Guardrail|Transcribe|Clarify|Q Business|Foundation Model|Few-Shot|Prompt Engineering/i.test(
        q.subtopic || "",
      ),
    )
    .slice(0, 5)
    .map((q) => ({
      id: q.id,
      page: q.sourcePage,
      question: q.question.slice(0, 120),
      correct: String(q.correctAnswer).slice(0, 100),
      options: q.options.map((o) => o.slice(0, 80)),
    })),
};

const dataDir = join(root, "app", "src", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "questions.json"), JSON.stringify(finalQuestions, null, 2));
mkdirSync(join(root, "scripts", "output"), { recursive: true });
writeFileSync(join(root, "scripts", "output", "extraction-report.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(root, "scripts", "output", "EXTRACTION_REPORT.md"),
  `# Coherent Question Bank\n\n- Generated: ${finalQuestions.length}/${TARGET}\n- Concept units: ${units.length}\n- Coherence errors: ${coherenceErrors.length}\n\n## Topics\n${Object.entries(byTopic)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n")}\n`,
);
writeFileSync(
  join(root, "scripts", "output", "concepts.json"),
  JSON.stringify(
    units.map((u) => ({
      page: u.page,
      section: u.section,
      title: u.title,
      definition: u.definition,
      bullets: u.bullets.length,
    })),
    null,
    2,
  ),
);

console.log(JSON.stringify(report, null, 2));
if (finalQuestions.length !== TARGET || coherenceErrors.length || metaErrors.length) {
  process.exit(1);
}
