/**
 * Replace the app question bank with the instructor Excel workbook.
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const xlsxPath = join(root, "AWS_AIF-C01_700_Instructor_Practice_Questions-1.xlsx");

const DOMAINS = {
  D1: "Fundamentals of AI and ML",
  D2: "Fundamentals of Generative AI",
  D3: "Applications of Foundation Models",
  D4: "Guidelines for Responsible AI",
  D5: "Security, Compliance, and Governance",
};

const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["700 Questions"], { defval: "" });

function cell(value) {
  return value == null ? "" : String(value);
}

function lettersOf(raw) {
  const found = cell(raw)
    .toUpperCase()
    .split(/[^A-D]+/)
    .filter((x) => ["A", "B", "C", "D"].includes(x));
  return [...new Set(found)];
}

const questions = [];
const flagged = [];

for (const row of rows) {
  const id = cell(row["Question ID"]).trim();
  const optionByLetter = {
    A: cell(row.A),
    B: cell(row.B),
    C: cell(row.C),
    D: cell(row.D),
  };
  const options = ["A", "B", "C", "D"].map((letter) => optionByLetter[letter]).filter((text) => text !== "");

  const letters = lettersOf(row["Correct Answer"]);
  const correctTexts = [...new Set(letters.map((letter) => optionByLetter[letter]).filter(Boolean))];

  const multi = cell(row["Question Type"]).toLowerCase().includes("multiple response");
  const difficulty = cell(row.Difficulty).toLowerCase();
  const domain = DOMAINS[row.Domain] || cell(row.Domain) || "AIF-C01";
  const topic = cell(row.Topic).trim() || domain;
  const explanation = cell(row["Instructor Explanation"]);
  const question = cell(row.Question);
  const status =
    !question || options.length < 2 || correctTexts.length < 1 || correctTexts.some((c) => !options.includes(c))
      ? "NEEDS_REVIEW"
      : "ok";

  if (status !== "ok") {
    flagged.push({ id, reason: "could not map a correct option", letters, correctTexts });
  }

  questions.push({
    id,
    question,
    options,
    correctAnswer: correctTexts.length > 1 ? correctTexts : correctTexts[0] || "",
    explanation,
    topic,
    subtopic: domain,
    sourceSection: domain,
    source: "instructor-bank",
    difficulty: ["easy", "medium", "hard"].includes(difficulty) ? difficulty : undefined,
    tags: [String(row.Domain || ""), multi ? "multiple-response" : "multiple-choice"].filter(Boolean),
    selectCount: Math.max(1, correctTexts.length),
    status,
  });
}

const active = questions.filter((q) => q.status === "ok");
const dataDir = join(root, "app", "src", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "questions.json"), JSON.stringify(active, null, 2));
writeFileSync(
  join(root, "scripts", "output", "instructor-import-report.json"),
  JSON.stringify(
    {
      source: "AWS_AIF-C01_700_Instructor_Practice_Questions-1.xlsx",
      rows: rows.length,
      loaded: active.length,
      flagged: flagged.length,
      flaggedSample: flagged.slice(0, 20),
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    { rows: rows.length, loaded: active.length, flagged: flagged.length },
    null,
    2,
  ),
);
if (!active.length) process.exit(1);
