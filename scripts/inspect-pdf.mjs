import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.mjs");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pdfPath = join(root, "AWS Certified AI Practitioner Slides v19.pdf");
const outDir = join(root, "scripts", "output");

mkdirSync(outDir, { recursive: true });

const data = new Uint8Array(readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

console.log(`Pages: ${doc.numPages}`);

const samplePages = [1, 2, 3, 10, 50, 100, 150, 200, Math.min(250, doc.numPages)];
const uniqueSample = [...new Set(samplePages.filter((p) => p >= 1 && p <= doc.numPages))];

const samples = {};
for (const pageNum of uniqueSample) {
  const page = await doc.getPage(pageNum);
  const content = await page.getTextContent();
  const text = content.items.map((i) => ("str" in i ? i.str : "")).join("\n");
  samples[pageNum] = text;
  console.log(`\n===== PAGE ${pageNum} =====\n${text.slice(0, 2000)}`);
}

writeFileSync(join(outDir, "sample-pages.json"), JSON.stringify(samples, null, 2));

// Scan all pages for question-like patterns and section headers
const questionHits = [];
const sectionHits = [];
const answerKeyHits = [];
const pageSummaries = [];

for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const content = await page.getTextContent();
  const text = content.items.map((i) => ("str" in i ? i.str : "")).join("\n");
  const flat = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  pageSummaries.push({
    page: pageNum,
    chars: flat.length,
    preview: flat.slice(0, 180),
  });

  if (/\b(question\s*\d+|q\d+\b|practice\s*question|quiz|exam\s*question)/i.test(flat)) {
    questionHits.push({ page: pageNum, preview: flat.slice(0, 250) });
  }
  if (/\b(correct\s*answer|answer\s*key|explanation)\b/i.test(flat)) {
    answerKeyHits.push({ page: pageNum, preview: flat.slice(0, 250) });
  }
  if (/^(domain|module|section|chapter|topic)\b/i.test(flat) || /\bDomain\s+[1234]\b/.test(flat)) {
    sectionHits.push({ page: pageNum, preview: flat.slice(0, 200) });
  }

  if (pageNum % 50 === 0) {
    console.error(`Scanned ${pageNum}/${doc.numPages}`);
  }
}

writeFileSync(
  join(outDir, "scan-report.json"),
  JSON.stringify(
    {
      totalPages: doc.numPages,
      questionHitCount: questionHits.length,
      answerKeyHitCount: answerKeyHits.length,
      sectionHitCount: sectionHits.length,
      questionHits: questionHits.slice(0, 200),
      answerKeyHits: answerKeyHits.slice(0, 200),
      sectionHits: sectionHits.slice(0, 200),
      pageSummaries,
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      totalPages: doc.numPages,
      questionHitCount: questionHits.length,
      answerKeyHitCount: answerKeyHits.length,
      sectionHitCount: sectionHits.length,
      firstQuestionHits: questionHits.slice(0, 15),
      firstAnswerHits: answerKeyHits.slice(0, 15),
      firstSectionHits: sectionHits.slice(0, 20),
    },
    null,
    2
  )
);
