import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(scriptDir, "../../manuscrito_guia.md");
const outputPath = path.resolve(scriptDir, "../app/manual-data.ts");

const source = await readFile(sourcePath, "utf8");
const lines = source.replace(/\r\n/g, "\n").split("\n");

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const inline = (value) => {
  let result = escapeHtml(value);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>',
  );
  return result;
};

const chapters = [];
let chapter = {
  id: "antes-de-empezar",
  title: "Antes de empezar",
  subtitle: "Aviso, dedicatoria y agradecimientos",
  html: [],
  sections: [],
  text: [],
};
let active = false;
let skippingToc = false;
let paragraph = [];

const flushParagraph = () => {
  if (!paragraph.length || !active || skippingToc) {
    paragraph = [];
    return;
  }
  const text = paragraph.join(" ").trim();
  if (text && text !== "[[TOC_STATIC]]") {
    chapter.html.push(`<p>${inline(text)}</p>`);
    chapter.text.push(text.replace(/\*\*/g, ""));
  }
  paragraph = [];
};

const finishChapter = () => {
  flushParagraph();
  if (!chapter.html.length) return;
  if (chapter.id === "referencias") return;
  const words = chapter.text.join(" ").split(/\s+/).filter(Boolean).length;
  const firstParagraph =
    chapter.text.find((item) => item.length > 90) ?? chapter.subtitle;
  chapters.push({
    id: chapter.id,
    title: chapter.title,
    subtitle: chapter.subtitle,
    description:
      firstParagraph.length > 190
        ? `${firstParagraph.slice(0, 187).trim()}…`
        : firstParagraph,
    minutes: Math.max(2, Math.ceil(words / 185)),
    sections: chapter.sections,
    html: chapter.html.join("\n"),
    searchText: chapter.text.join(" "),
  });
};

for (let index = 0; index < lines.length; index += 1) {
  const raw = lines[index].trimEnd();
  const trimmed = raw.trim();

  if (!trimmed || trimmed === "<!-- PAGEBREAK -->") {
    flushParagraph();
    continue;
  }

  const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    flushParagraph();
    const level = heading[1].length;
    const title = heading[2].trim();

    if (level === 1 && title === "GUÍA DE RECONSTRUCCIÓN PSICOLÓGICA") {
      continue;
    }

    if (level === 2 && title === "Aviso importante") {
      active = true;
    }

    if (level === 2 && title === "Contenido") {
      skippingToc = true;
      continue;
    }

    if (level === 1) {
      if (active) finishChapter();
      active = true;
      skippingToc = false;
      chapter = {
        id: slugify(title),
        title,
        subtitle: "",
        html: [],
        sections: [],
        text: [],
      };
      continue;
    }

    if (!active || skippingToc) continue;
    const baseId = slugify(title);
    let id = baseId;
    let suffix = 2;
    while (chapter.sections.some((section) => section.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    if (!chapter.subtitle && level === 2) chapter.subtitle = title;
    chapter.sections.push({ id, title, level });
    chapter.html.push(
      `<h${level} id="${id}" data-section="${id}">${inline(title)}</h${level}>`,
    );
    chapter.text.push(title);
    continue;
  }

  if (!active || skippingToc) continue;

  if (/^>\s+/.test(trimmed)) {
    flushParagraph();
    const quote = trimmed.replace(/^>\s+/, "");
    chapter.html.push(`<blockquote>${inline(quote)}</blockquote>`);
    chapter.text.push(quote);
    continue;
  }

  if (/^[-*]\s+/.test(trimmed)) {
    flushParagraph();
    const items = [];
    let cursor = index;
    while (cursor < lines.length && /^[-*]\s+/.test(lines[cursor].trim())) {
      const item = lines[cursor].trim().replace(/^[-*]\s+/, "");
      items.push(item);
      cursor += 1;
    }
    chapter.html.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    chapter.text.push(...items);
    index = cursor - 1;
    continue;
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    flushParagraph();
    const items = [];
    let cursor = index;
    while (cursor < lines.length && /^\d+\.\s+/.test(lines[cursor].trim())) {
      const item = lines[cursor].trim().replace(/^\d+\.\s+/, "");
      items.push(item);
      cursor += 1;
    }
    chapter.html.push(`<ol>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`);
    chapter.text.push(...items);
    index = cursor - 1;
    continue;
  }

  paragraph.push(trimmed);
}

finishChapter();

const output = `export type ManualSection = {
  id: string;
  title: string;
  level: number;
};

export type ManualChapter = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  minutes: number;
  sections: ManualSection[];
  html: string;
  searchText: string;
};

export const manualUpdated = "29 de julio de 2026";
export const manualChapters: ManualChapter[] = ${JSON.stringify(chapters, null, 2)};
`;

await writeFile(outputPath, output, "utf8");
console.log(`Generated ${chapters.length} chapters in ${outputPath}`);
