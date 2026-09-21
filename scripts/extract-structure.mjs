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

function pageText(content) {
  return content.items.map((i) => ("str" in i ? i.str : "")).join("\n");
}

function cleanLines(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^© Stephane Maarek$/i.test(l) &&
        !/^NOT FOR DISTRIBUTION/i.test(l) &&
        !/www\.datacumulus\.com/i.test(l)
    );
}

const pages = [];
const titles = [];
const tipPages = [];
const summaryPages = [];

for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const content = await page.getTextContent();
  const raw = pageText(content);
  const lines = cleanLines(raw);
  const flat = lines.join(" ").replace(/\s+/g, " ").trim();

  // Heuristic: first substantial line is often the slide title
  const title =
    lines.find((l) => l.length > 3 && l.length < 120 && !l.startsWith("•") && !l.startsWith("http")) ||
    `(untitled p${pageNum})`;

  pages.push({ page: pageNum, title, lines, flat });
  titles.push({ page: pageNum, title });

  if (/\b(exam tip|exam tip|remember|important|common mistake|don'?t confuse)\b/i.test(flat)) {
    tipPages.push({ page: pageNum, title, preview: flat.slice(0, 400) });
  }
  if (/\b(section summary|summary|recap|key takeaways)\b/i.test(title) || /\bSection Summary\b/i.test(flat)) {
    summaryPages.push({ page: pageNum, title, preview: flat.slice(0, 500) });
  }

  if (pageNum % 50 === 0) console.error(`Extracted ${pageNum}/${doc.numPages}`);
}

writeFileSync(join(outDir, "all-pages.json"), JSON.stringify(pages, null, 2));
writeFileSync(join(outDir, "slide-titles.json"), JSON.stringify(titles, null, 2));
writeFileSync(
  join(outDir, "structure-report.json"),
  JSON.stringify(
    {
      totalPages: doc.numPages,
      tipPageCount: tipPages.length,
      summaryPageCount: summaryPages.length,
      tipPages,
      summaryPages,
      titles,
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      totalPages: doc.numPages,
      tipPageCount: tipPages.length,
      summaryPageCount: summaryPages.length,
      tipPages: tipPages.slice(0, 40),
      summaryPages,
      sampleTitles: titles.filter((_, i) => i % 15 === 0).slice(0, 40),
    },
    null,
    2
  )
);
