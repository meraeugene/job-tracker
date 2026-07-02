import type { ResumeProfile } from "@/types/application";
import { parseResumeText } from "@/utils/resume-parser";

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim() || !("transform" in item)) {
        continue;
      }

      const transform = item.transform as number[];
      const y = Math.round(transform[5] / 4) * 4;
      const x = transform[4] ?? 0;
      rows.set(y, [...(rows.get(y) ?? []), { x, text: item.str.trim() }]);
    }

    const pageText = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, row]) =>
        row
          .sort((a, b) => a.x - b.x)
          .map((part) => part.text)
          .join(" ")
          .trim(),
      )
      .filter(Boolean)
      .join("\n");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n");
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function parseResumeFile(file: File): Promise<ResumeProfile> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "docx") {
    throw new Error("Upload a resume as a PDF or DOCX file.");
  }

  const rawText =
    extension === "pdf"
      ? await extractPdfText(file)
      : await extractDocxText(file);

  const lastUpdated = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const fallback = parseResumeText({
    fileName: file.name,
    rawText,
    lastUpdated,
  });

  if (typeof window === "undefined") return fallback;

  try {
    const response = await fetch("/api/parse-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        rawText,
        lastUpdated,
      }),
    });

    if (!response.ok) return fallback;

    return (await response.json()) as ResumeProfile;
  } catch {
    return fallback;
  }
}
