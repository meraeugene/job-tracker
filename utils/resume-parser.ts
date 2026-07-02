import type { ResumeProfile } from "@/types/application";

type ResumeSectionKey = keyof ResumeProfile["sections"];

type SectionConfig = {
  key: ResumeSectionKey;
  labels: string[];
};

const sectionConfigs: SectionConfig[] = [
  { key: "summary", labels: ["summary", "professional summary", "objective", "profile"] },
  { key: "experience", labels: ["experience", "work experience", "professional experience", "employment", "work history"] },
  { key: "skills", labels: ["skills", "technical skills", "core skills", "technologies", "tech stack"] },
  { key: "education", labels: ["education", "academic background"] },
  { key: "certifications", labels: ["certifications", "licenses", "certificates", "awards & certifications", "awards and certifications"] },
  { key: "projects", labels: ["projects", "selected projects", "portfolio", "personal projects"] },
  { key: "portfolioLinks", labels: ["links", "portfolio links", "profiles", "contact", "contacts"] },
  { key: "highlights", labels: ["languages"] },
];

const emptySections: ResumeProfile["sections"] = {
  summary: "",
  experience: "",
  skills: "",
  education: "",
  certifications: "",
  projects: "",
  highlights: "",
  targetRoles: "",
  profileSummary: "",
  portfolioLinks: "",
};

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "as",
  "at",
  "based",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "using",
  "with",
]);

function normalizeText(text: string) {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/Ã¢â‚¬Â¢|â€¢/g, "\n- ")
    .replace(/Ã¢â‚¬â€œ/g, "-")
    .replace(/Ã¢â‚¬â€|â€”/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\|\s+/g, " | ")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return cleaned
    .replace(
      /\b(PROFESSIONAL SUMMARY|TECHNICAL SKILLS|PROFESSIONAL EXPERIENCE|PROJECTS|EDUCATION|AWARDS\s*&\s*CERTIFICATIONS|LANGUAGES)\b/g,
      "\n$1\n",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHeading(line: string) {
  const normalized = line.trim().toLowerCase().replace(/[:\-]/g, "");
  return (
    normalized.length < 36 &&
    sectionConfigs.some((section) => section.labels.includes(normalized))
  );
}

function headingKey(line: string): ResumeSectionKey | null {
  const normalized = line.trim().toLowerCase().replace(/[:\-]/g, "");
  return (
    sectionConfigs.find((section) => section.labels.includes(normalized))?.key ??
    null
  );
}

function extractSections(text: string): ResumeProfile["sections"] {
  const sections = { ...emptySections };
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let active: ResumeSectionKey | null = null;

  for (const line of lines) {
    if (isHeading(line)) {
      active = headingKey(line) ?? active;
      continue;
    }

    if (!active) continue;

    sections[active] = [sections[active], line].filter(Boolean).join("\n");
  }

  sections.profileSummary = sections.summary;
  sections.highlights = extractHighlightLines(text).join("\n");
  sections.targetRoles = inferTargetRoles(text).join(", ");
  sections.portfolioLinks =
    sections.portfolioLinks || extractContactAndLinks(text).join(" | ");

  return sections;
}

function extractContactAndLinks(text: string) {
  const profileText = text.split(/\nprofessional summary\n/i)[0] || text;
  const matches = [
    ...profileText.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
    ...profileText.matchAll(/(?:\+\d{1,3}\s?)?(?:\d[\s-]?){8,14}\d/g),
    ...profileText.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:github|linkedin|[\w-]+\.[a-z]{2,})(?:\/[^\s|]*)?/gi),
  ].map((match) => match[0].trim().replace(/[.,;]+$/, ""));

  return Array.from(new Set(matches)).slice(0, 6);
}

function extractHighlightLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /(\d+%|\$\d+|\bimproved\b|\bbuilt\b|\bled\b|\bcreated\b|\bmanaged\b|\bdeveloped\b)/i.test(line))
    .slice(0, 5);
}

function inferTargetRoles(text: string) {
  const roleSignals = [
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Software Engineer",
    "Web Developer",
    "UI/UX Designer",
    "Product Designer",
    "Product Manager",
  ];
  const lower = text.toLowerCase();
  return roleSignals.filter((role) => lower.includes(role.toLowerCase())).slice(0, 4);
}

function extractKeywords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([word]) => word);
}

function readinessScore(text: string, sections: ResumeProfile["sections"]) {
  let score = 25;
  if (sections.summary) score += 15;
  if (sections.experience) score += 15;
  if (sections.skills) score += 15;
  if (sections.education) score += 10;
  if (sections.projects) score += 10;
  if (sections.certifications) score += 5;
  if (extractHighlightLines(text).length > 0) score += 5;
  return Math.min(score, 100);
}

export function parseResumeText({
  fileName,
  rawText,
  lastUpdated,
}: {
  fileName: string;
  rawText: string;
  lastUpdated?: string;
}): ResumeProfile {
  const normalized = normalizeText(rawText);
  if (!normalized || normalized.length < 20) {
    throw new Error("Could not extract readable resume text from this file.");
  }

  const sections = extractSections(normalized);
  const score = readinessScore(normalized, sections);

  return {
    fileName,
    lastUpdated:
      lastUpdated ||
      new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    readinessScore: score,
    atsReady: score >= 85,
    rawText: normalized,
    keywords: extractKeywords(
      [
        sections.skills,
        sections.summary,
        sections.experience,
        sections.projects,
        sections.education,
      ].join(" "),
    ),
    sections,
  };
}
