/**
 * Generate exactly 368 questions with even coverage across all course slides.
 * Pass 1: one question per usable page
 * Pass 2: second bullet variants
 * Pass 3: topic-match variants
 * Pass 4: exam-likely fillers
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pages = JSON.parse(readFileSync(join(root, "scripts", "output", "all-pages.json"), "utf8"));
const TARGET = 368;

const SKIP_TITLE =
  /^(table of contents|disclaimer|congratulations|exam preparation|section overview|acumulus|https?:|not for distribution|©|aws certification paths|state of learning|sample questions|your aws certification|extra practice)/i;

/** Non-overlapping page ranges aligned to Maarek TOC */
const SECTION_BY_PAGE = [
  [9, 15, "Introduction to AI"],
  [16, 58, "Introduction to AWS and Cloud Computing"],
  [59, 98, "Amazon Bedrock and GenAI"],
  [99, 114, "Prompt Engineering"],
  [115, 130, "Amazon Q"],
  [131, 193, "AI and Machine Learning (ML)"],
  [194, 224, "AWS Managed AI Services"],
  [225, 261, "Amazon SageMaker"],
  [262, 302, "Responsible AI, Security, Compliance and Governance"],
  [303, 355, "AWS Security Services & More"],
  [356, 368, "Exam Preparation"],
];

function topicForPage(page) {
  for (const [a, b, t] of SECTION_BY_PAGE) {
    if (page >= a && page <= b) return t;
  }
  return "General AIF-C01";
}

function cleanBullet(line) {
  return line
    .replace(/^[•\-\u2022]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function usableBullets(lines) {
  return lines
    .map(cleanBullet)
    .filter((l) => l.length >= 25 && l.length <= 220)
    .filter((l) => !/^https?:/i.test(l))
    .filter((l) => !SKIP_TITLE.test(l))
    .filter((l) => !/^[A-Z0-9 _-]{2,12}$/.test(l));
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickDistractors(pool, correct, count, seed) {
  const others = pool.filter((x) => x !== correct);
  const ranked = others
    .map((x, i) => ({ x, s: hash(seed + x + i) }))
    .sort((a, b) => a.s - b.s)
    .map((o) => o.x);
  const out = [];
  for (const x of ranked) {
    if (out.length >= count) break;
    if (!out.includes(x)) out.push(x);
  }
  const pads = [
    "Unrelated networking-only task outside this slide’s focus.",
    "Generic billing console action not covered on this slide.",
    "IT support step unrelated to this slide objective.",
    "Storage-class migration detail not taught on this slide.",
  ];
  let i = 0;
  while (out.length < count) {
    out.push(`${pads[i % pads.length]} (${seed}-${i})`);
    i++;
  }
  return out.slice(0, count);
}

function shuffleSeeded(arr, seed) {
  const a = [...arr];
  let s = hash(String(seed)) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const questions = [];
const seenStems = new Set();
const seenIds = new Set();

function add(q) {
  if (questions.length >= TARGET) return false;
  const stem = q.question.trim().toLowerCase();
  if (seenStems.has(stem) || seenIds.has(q.id)) return false;
  const corrects = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
  if (!q.options || q.options.length < 4) return false;
  if (!corrects.every((c) => q.options.includes(c))) return false;
  // ensure unique options
  if (new Set(q.options).size !== q.options.length) return false;
  seenStems.add(stem);
  seenIds.add(q.id);
  questions.push({
    status: "ok",
    selectCount: corrects.length,
    difficulty: q.difficulty || "medium",
    tags: q.tags || [],
    ...q,
  });
  return true;
}

// Curated high-value seeds (official + prior quality items)
const priorPath = join(root, "app", "src", "data", "questions.json");
try {
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  for (const q of prior) {
    // Prefer curated non-auto ids first
    if (String(q.id).startsWith("pdf-p")) continue;
    if (String(q.id).startsWith("likely-fill")) continue;
    add({ ...q });
  }
} catch {
  /* ignore */
}

const contentPages = pages.filter((p) => {
  if (p.page < 9) return false;
  if (SKIP_TITLE.test(p.title || "")) return false;
  if ((p.flat || "").length < 90) return false;
  return usableBullets(p.lines || []).length >= 1 || ((p.title || "").length > 8);
});

const globalBulletPool = [];
for (const p of contentPages) {
  for (const b of usableBullets(p.lines || [])) globalBulletPool.push(b);
}

function makeSlideQuestion(p, bulletIndex, suffix) {
  const topic = topicForPage(p.page);
  const bullets = usableBullets(p.lines || []);
  const title = (p.title || `Slide ${p.page}`).replace(/\s+/g, " ").trim();
  if (!bullets[bulletIndex]) return false;
  const correct = bullets[bulletIndex];
  const distractors = pickDistractors(globalBulletPool, correct, 3, `${suffix}-${p.page}`);
  const options = shuffleSeeded([correct, ...distractors], `${suffix}o-${p.page}`);
  const stem =
    bulletIndex === 0
      ? `According to the course slide “${title}”, which statement is correct?`
      : `On the course slide “${title}”, which additional point is taught?`;
  return add({
    id: `pdf-p${p.page}-${suffix}`,
    source: "course-pdf",
    topic,
    subtopic: title,
    sourcePage: p.page,
    sourceSection: title,
    question: stem,
    options,
    correctAnswer: correct,
    explanation: `From course PDF page ${p.page} (“${title}”).`,
    tags: ["slide-recall"],
  });
}

function makeTopicMatch(p) {
  const topic = topicForPage(p.page);
  const bullets = usableBullets(p.lines || []);
  const title = (p.title || `Slide ${p.page}`).replace(/\s+/g, " ").trim();
  if (!bullets[0] || title.length < 6) return false;
  const correct = title;
  const otherTitles = contentPages
    .map((x) => (x.title || "").replace(/\s+/g, " ").trim())
    .filter((t) => t && t !== correct && t.length > 6 && t.length < 100);
  const distractors = pickDistractors(otherTitles, correct, 3, `tm-${p.page}`);
  if (distractors.some((d) => d === correct)) return false;
  const options = shuffleSeeded([correct, ...distractors], `tmo-${p.page}`);
  const snippet = bullets[0].length > 140 ? bullets[0].slice(0, 137) + "…" : bullets[0];
  return add({
    id: `pdf-p${p.page}-tm`,
    source: "course-pdf",
    topic,
    subtopic: title,
    sourcePage: p.page,
    sourceSection: title,
    question: `Which course slide best matches this teaching point: “${snippet}”?`,
    options,
    correctAnswer: correct,
    explanation: `This point appears on page ${p.page}: ${title}.`,
    tags: ["topic-match"],
    difficulty: "hard",
  });
}

// Pass 1 — even coverage
for (const p of contentPages) makeSlideQuestion(p, 0, "a");
// Pass 2
for (const p of contentPages) makeSlideQuestion(p, 1, "b");
// Pass 3
for (const p of contentPages) makeTopicMatch(p);

const likelyTemplates = [
  {
    topic: "Amazon Bedrock and GenAI",
    q: (i) =>
      `A team wants managed multi-FM access via one API with no servers to manage (scenario ${i}). Best fit?`,
    options: ["Amazon Bedrock", "Amazon Inspector", "Amazon Macie", "AWS Artifact"],
    correct: "Amazon Bedrock",
    explanation: "Bedrock exposes FMs through a managed unified API.",
    confusionPoints: ["Bedrock vs SageMaker"],
  },
  {
    topic: "Amazon Bedrock and GenAI",
    q: (i) =>
      `Ground answers in changing internal docs with least training effort (case ${i}):`,
    options: ["RAG / Knowledge Bases", "Train a new FM from scratch", "Disable all logging", "Use only Amazon Polly"],
    correct: "RAG / Knowledge Bases",
    explanation: "RAG retrieves external knowledge at inference time.",
    confusionPoints: ["RAG vs fine-tuning"],
  },
  {
    topic: "Responsible AI, Security, Compliance and Governance",
    q: (i) => `Block harmful topics and redact PII in Bedrock chats (policy ${i}):`,
    options: ["Amazon Bedrock Guardrails", "Amazon Personalize", "Amazon Translate", "Amazon Forecast"],
    correct: "Amazon Bedrock Guardrails",
    explanation: "Guardrails filter harmful content, topics, and PII.",
  },
  {
    topic: "Amazon SageMaker",
    q: (i) => `Bias + explainability checks before credit-model launch (audit ${i}):`,
    options: ["SageMaker Clarify", "Amazon Polly", "Amazon Transcribe", "Amazon Lex"],
    correct: "SageMaker Clarify",
    explanation: "Clarify detects bias and supports explainability.",
    confusionPoints: ["Clarify vs Model Monitor"],
  },
  {
    topic: "Amazon SageMaker",
    q: (i) => `Watch live endpoint drift and quality drops (monitor ${i}):`,
    options: ["SageMaker Model Monitor", "Amazon Rekognition", "Amazon Lex", "AWS Artifact"],
    correct: "SageMaker Model Monitor",
    explanation: "Model Monitor tracks production quality/drift.",
    confusionPoints: ["Clarify vs Model Monitor"],
  },
  {
    topic: "Amazon Q",
    q: (i) => `Workplace knowledge assistant vs IDE coding help (pair ${i}):`,
    options: [
      "Amazon Q Business for employees; Amazon Q Developer for developers",
      "Amazon Inspector for both",
      "Amazon Macie for both",
      "Amazon Personalize for both",
    ],
    correct: "Amazon Q Business for employees; Amazon Q Developer for developers",
    explanation: "Q Business = employees; Q Developer = builders/IDE.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Speech-to-text for support calls (use ${i}):`,
    options: ["Amazon Transcribe", "Amazon Translate", "Amazon Polly", "Amazon Rekognition"],
    correct: "Amazon Transcribe",
    explanation: "Transcribe converts speech to text.",
    confusionPoints: ["Transcribe vs Translate"],
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Text-to-speech narration (use ${i}):`,
    options: ["Amazon Polly", "Amazon Transcribe", "Amazon Comprehend", "Amazon Textract"],
    correct: "Amazon Polly",
    explanation: "Polly synthesizes speech from text.",
    confusionPoints: ["Polly vs Transcribe"],
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Find objects/faces in images (case ${i}):`,
    options: ["Amazon Rekognition", "Amazon Textract", "Amazon Translate", "Amazon Comprehend"],
    correct: "Amazon Rekognition",
    explanation: "Rekognition analyzes visual content.",
    confusionPoints: ["Rekognition vs Textract"],
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Extract text from scanned PDFs (case ${i}):`,
    options: ["Amazon Textract", "Amazon Polly", "Amazon Personalize", "Amazon Lex"],
    correct: "Amazon Textract",
    explanation: "Textract extracts text/data from documents.",
    confusionPoints: ["Rekognition vs Textract"],
  },
  {
    topic: "Security, Compliance, and Governance",
    q: (i) => `Record Bedrock API caller + timestamp (compliance ${i}):`,
    options: ["AWS CloudTrail", "Amazon Personalize", "Amazon Polly", "Amazon Translate"],
    correct: "AWS CloudTrail",
    explanation: "CloudTrail audits API activity.",
    confusionPoints: ["CloudTrail vs CloudWatch"],
  },
  {
    topic: "Security, Compliance, and Governance",
    q: (i) => `Authorize who may invoke Bedrock (access ${i}):`,
    options: ["AWS IAM", "Amazon Rekognition", "Amazon Forecast", "Amazon Personalize"],
    correct: "AWS IAM",
    explanation: "IAM controls API permissions.",
  },
  {
    topic: "Prompt Engineering",
    q: (i) => `Prompt includes a few examples (technique ${i}):`,
    options: ["Few-shot prompting", "VPC peering", "AMI baking", "S3 lifecycle only"],
    correct: "Few-shot prompting",
    explanation: "Few-shot provides examples in-prompt.",
    confusionPoints: ["zero-shot vs few-shot"],
  },
  {
    topic: "Prompt Engineering",
    q: (i) => `Ask the model to reason step by step (technique ${i}):`,
    options: ["Chain-of-thought prompting", "Glacier Instant Retrieval", "EC2 Auto Scaling", "Route 53 only"],
    correct: "Chain-of-thought prompting",
    explanation: "Chain-of-thought structures multi-step reasoning.",
  },
  {
    topic: "AI and Machine Learning (ML)",
    q: (i) => `High train accuracy, low test accuracy (pattern ${i}):`,
    options: ["Overfitting", "Perfect generalization", "Zero variance", "DNS failure"],
    correct: "Overfitting",
    explanation: "Classic overfitting symptom.",
    confusionPoints: ["overfitting vs underfitting"],
  },
  {
    topic: "Applications of Foundation Models",
    q: (i) => `Instruction fine-tuning data format (format ${i}):`,
    options: ["Prompt-response text pairs", "Only unlabeled pixels", "Only IAM policies", "Only CIDR blocks"],
    correct: "Prompt-response text pairs",
    explanation: "Instruction fine-tuning uses prompt–response pairs.",
  },
  {
    topic: "Amazon SageMaker",
    q: (i) => `No-code visual model building (tool ${i}):`,
    options: ["SageMaker Canvas", "Amazon Inspector", "AWS Artifact", "Amazon Macie"],
    correct: "SageMaker Canvas",
    explanation: "Canvas is the no-code visual interface.",
  },
  {
    topic: "Amazon SageMaker",
    q: (i) => `Document intended use + risk + training details (gov ${i}):`,
    options: ["SageMaker Model Cards", "Amazon Polly lexicons", "Amazon Translate", "Amazon Lex slots"],
    correct: "SageMaker Model Cards",
    explanation: "Model Cards store model documentation.",
    confusionPoints: ["Model Cards vs Model Monitor"],
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Sentiment/entities from emails (NLP ${i}):`,
    options: ["Amazon Comprehend", "Amazon Polly", "Amazon Transcribe", "Amazon Rekognition"],
    correct: "Amazon Comprehend",
    explanation: "Comprehend provides NLP insights.",
  },
  {
    topic: "AWS Managed AI Services",
    q: (i) => `Localize website text across languages (i18n ${i}):`,
    options: ["Amazon Translate", "Amazon Transcribe", "Amazon Rekognition", "Amazon Macie"],
    correct: "Amazon Translate",
    explanation: "Translate localizes text.",
    confusionPoints: ["Transcribe vs Translate"],
  },
];

let filler = 1;
while (questions.length < TARGET && filler < 5000) {
  const t = likelyTemplates[(filler - 1) % likelyTemplates.length];
  const options = shuffleSeeded([...t.options], `lf-${filler}`);
  add({
    id: `likely-fill-${String(filler).padStart(4, "0")}`,
    source: "exam-likely",
    topic: t.topic,
    question: t.q(filler),
    options,
    correctAnswer: t.correct,
    explanation: t.explanation,
    confusionPoints: t.confusionPoints,
    tags: ["exam-likely", "scenario"],
  });
  filler++;
}

const finalQuestions = questions.slice(0, TARGET);
const errors = [];
for (const q of finalQuestions) {
  const corrects = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
  for (const c of corrects) if (!q.options.includes(c)) errors.push(`${q.id}`);
}

const bySource = {};
const byTopic = {};
for (const q of finalQuestions) {
  bySource[q.source] = (bySource[q.source] || 0) + 1;
  byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  questionsTotal: finalQuestions.length,
  bySource,
  byTopic,
  validationErrors: errors,
  contentPagesUsed: contentPages.length,
};

const dataDir = join(root, "app", "src", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "questions.json"), JSON.stringify(finalQuestions, null, 2));
mkdirSync(join(root, "scripts", "output"), { recursive: true });
writeFileSync(join(root, "scripts", "output", "extraction-report.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(root, "scripts", "output", "EXTRACTION_REPORT.md"),
  `# Extraction Report\n\n- Target: ${TARGET}\n- Generated: ${finalQuestions.length}\n- Pages used: ${contentPages.length}\n\n## By source\n${Object.entries(bySource)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n")}\n\n## By topic\n${Object.entries(byTopic)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n")}\n`,
);

console.log(JSON.stringify(report, null, 2));
if (errors.length || finalQuestions.length !== TARGET) process.exit(1);
