"use client";

import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  FileText,
  FileUp,
  GraduationCap,
  Layers3,
  Link2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { ResumeProfile } from "@/types/application";

type ContactItem = {
  type: "phone" | "email" | "github" | "linkedin" | "portfolio" | "link";
  label: string;
  value: string;
  href?: string;
};

type ExperienceEntry = {
  role: string;
  company: string;
  location: string;
  dates: string;
  techStack: string;
  bullets: string[];
  raw: string;
};

type SkillGroup = {
  label: string;
  items: string[];
};

type ProjectForm = {
  title: string;
  image: string;
  dates: string;
  link: string;
  description: string;
};

function firstLine(text: string) {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) || ""
  );
}

function headerText(resume: ResumeProfile) {
  const text = typeof resume.rawText === "string" ? resume.rawText : "";
  return (
    text.split(/\s+professional summary\s+/i)[0] ||
    firstLine(text)
  );
}

function profileName(resume: ResumeProfile) {
  const header = headerText(resume);
  const emailIndex = header.search(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneIndex = header.search(/\+\d/);
  const splitIndex = [emailIndex, phoneIndex]
    .filter((index) => index > 0)
    .sort((a, b) => a - b)[0];
  const candidate = (
    splitIndex ? header.slice(0, splitIndex) : firstLine(header)
  )
    .replace(/\s*\|.*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const nameOnly = candidate.replace(/\s+[A-Z][a-z].*$/, "").trim();

  return nameOnly || candidate || resume.fileName.replace(/\.[^.]+$/, "");
}

function contactItems(resume: ResumeProfile): ContactItem[] {
  const text = headerText(resume);
  const normalized = text.replace(/\s*\|\s*/g, "\n");
  const emails = [
    ...normalized.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
  ].map((match) => match[0]);
  const phones = [
    ...normalized.matchAll(/(?:\+\d{1,3}\s?)?(?:\d[\s-]?){8,14}\d/g),
  ].map((match) => match[0]);
  const linkSource = emails.reduce(
    (current, email) => current.replaceAll(email, " "),
    normalized,
  );
  const links = [
    ...linkSource.matchAll(
      /(?:https?:\/\/)?(?:www\.)?(?:(?:github|linkedin)\.com\/[^\s|]+|[\w-]+\.(?:dev|online|io|app|me|net|org|com)(?:\/[^\s|]+)?)/gi,
    ),
  ].map((match) => match[0]);
  const seen = new Set<string>();

  function add(item: ContactItem) {
    const key = `${item.type}:${item.value.toLowerCase()}`;
    if (seen.has(key)) return null;
    seen.add(key);
    return item;
  }

  return [
    ...phones.map((value) =>
      add({ type: "phone" as const, label: "Phone", value: value.trim() }),
    ),
    ...emails.map((value) =>
      add({
        type: "email" as const,
        label: "Email",
        value,
        href: `mailto:${value}`,
      }),
    ),
    ...links
      .filter(
        (value) =>
          !emails.some((email) => email.toLowerCase() === value.toLowerCase()),
      )
      .map((value) => {
        const clean = value.trim().replace(/[.,;]+$/, "");
        const href = clean.startsWith("http") ? clean : `https://${clean}`;
        if (/github\.com/i.test(clean))
          return add({
            type: "github" as const,
            label: "GitHub",
            value: clean,
            href,
          });
        if (/linkedin\.com/i.test(clean))
          return add({
            type: "linkedin" as const,
            label: "LinkedIn",
            value: clean,
            href,
          });
        if (/portfolio|\.dev|\.online/i.test(clean))
          return add({
            type: "portfolio" as const,
            label: "Portfolio",
            value: clean,
            href,
          });
        return add({
          type: "link" as const,
          label: "Link",
          value: clean,
          href,
        });
      }),
  ].filter((item): item is ContactItem => Boolean(item));
}

function commaItems(value: string | undefined | null) {
  if (typeof value !== "string") return [];
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitListItems(value: string | undefined | null) {
  if (typeof value !== "string") return [];
  return value
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .map((item) =>
      item
        .replace(
          /^(frontend|backend(?:\s*&\s*databases?)?|databases?|tools?,?\s*devops\s*&\s*cloud|devops\s*&\s*cloud|ai-assisted dev\s*&\s*other|ai assisted dev\s*&\s*other|other)\s*:\s*/i,
          "",
        )
        .trim(),
    )
    .filter(
      (item) =>
        !/^(frontend|backend|backend\s*&\s*databases?|databases?\s*&?|tools?|tools?,?\s*devops\s*&?\s*cloud?|devops\s*&?\s*cloud?|ai|ai-assisted dev\s*&?\s*other?|other)\s*:?$/i.test(
          item,
        ),
    )
    .filter(Boolean);
}

function skillGroups(value: string): SkillGroup[] {
  const groups: SkillGroup[] = [
    { label: "Frontend", items: [] },
    { label: "Backend & Databases", items: [] },
    { label: "Tools, DevOps & Cloud", items: [] },
    { label: "AI-Assisted Dev & Other", items: [] },
  ];
  const seen = new Set<string>();

  function add(label: string, item: string) {
    const clean = item.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return;
    seen.add(key);
    groups.find((group) => group.label === label)?.items.push(clean);
  }

  for (const skill of splitListItems(value)) {
    if (
      /\b(next\.?js|react|typescript|javascript|tailwind|framer|recharts|zustand|redux|swr|html5?|css3?)\b/i.test(
        skill,
      )
    ) {
      add("Frontend", skill);
    } else if (
      /\b(node\.?js|express\.?js|python|django|php|rest\s*apis?|websockets?|jwt|mysql|mongo(db)?|firebase|database)\b/i.test(
        skill,
      )
    ) {
      add("Backend & Databases", skill);
    } else if (
      /\b(git|github|bitbucket|docker|vercel|postman|figma|aws|ec2|s3|ci\/cd|cloud)\b/i.test(
        skill,
      )
    ) {
      add("Tools, DevOps & Cloud", skill);
    } else if (
      /\b(machine learning|semantic search|sbert|faiss|claude|codex|gemini|openai|anthropic|copilot|ai-assisted|ocr|stripe|paymongo|paypal|webhooks?)\b/i.test(
        skill,
      )
    ) {
      add("AI-Assisted Dev & Other", skill);
    } else if (/api/i.test(skill)) {
      add("Backend & Databases", skill);
    } else {
      add("AI-Assisted Dev & Other", skill);
    }
  }

  return groups.filter((group) => group.items.length);
}

function projectFormIsReady(project: ProjectForm) {
  return Boolean(project.title.trim() && project.description.trim());
}

function formatManualProject(project: ProjectForm) {
  return [
    project.title.trim(),
    project.dates.trim() ? `Dates: ${project.dates.trim()}` : "",
    project.image.trim() ? `Image: ${project.image.trim()}` : "",
    project.link.trim() ? `Link: ${project.link.trim()}` : "",
    project.description.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function projectLine(project: string, label: string) {
  const match = project.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function projectTitle(project: string) {
  return firstLine(project).replace(/^(Title|Project):\s*/i, "") || "Project";
}

function projectDescription(project: string) {
  return project
    .split("\n")
    .filter((line, index) => {
      if (index === 0) return false;
      return !/^(Dates|Image|Link):\s*/i.test(line.trim());
    })
    .join("\n")
    .trim();
}

function sectionItems(
  value: string | undefined | null,
  mode: "experience" | "projects" | "certifications",
) {
  if (typeof value !== "string") return [];
  const normalized = value
    .replace(/•/g, "\n")
    .replace(/\s+-\s+/g, "\n")
    .replace(/\s+—\s+/g, " — ")
    .trim();
  const direct = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (direct.length > 1) return direct;
  if (!normalized) return [];

  if (mode === "projects") {
    return normalized
      .split(/\s+(?=[A-Z][A-Za-z0-9 &-]{2,}\s+—\s+)/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (mode === "experience") {
    return normalized
      .split(
        /\s+(?=[A-Z][A-Za-z ]+(?:Intern|Developer|Engineer|Designer|Manager)\s+\|)/,
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [normalized];
}

const experienceHeaderPattern =
  /([A-Z][A-Za-z /&.-]+(?:Intern|Developer|Engineer|Designer|Manager|Analyst|Specialist)\s*\|)/;

function cleanResumeText(value: string | undefined | null) {
  if (typeof value !== "string") return "";
  return value
    .replace(/â€¢/g, "•")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function splitExperienceSegments(value: string | undefined | null) {
  const normalized = cleanResumeText(value)
    .replace(/•/g, "\n• ")
    .replace(/\s+-\s+/g, "\n- ")
    .replace(
      /\s+(?=[A-Z][A-Za-z /&.-]+(?:Intern|Developer|Engineer|Designer|Manager|Analyst|Specialist)\s*\|)/g,
      "\n",
    );

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const segments: string[] = [];

  for (const line of lines) {
    const match = line.match(experienceHeaderPattern);
    if (match && match.index && match.index > 0) {
      const before = line.slice(0, match.index).trim();
      const after = line.slice(match.index).trim();
      if (before) segments.push(before);
      if (after) segments.push(after);
    } else {
      segments.push(line);
    }
  }

  return segments;
}

function parseExperienceHeader(header: string) {
  const [role = "", company = "", rest = ""] = header
    .split("|")
    .map((part) => part.trim());
  const techMatch = rest.match(/\bTech Stack:\s*(.+)$/i);
  const withoutTech = rest.replace(/\bTech Stack:\s*.+$/i, "").trim();
  const dateMatch = withoutTech.match(
    /(.+?)\s+([A-Z][a-z]+ \d{4}\s*[–-]\s*(?:[A-Z][a-z]+ \d{4}|Present))/,
  );

  return {
    role,
    company,
    location: dateMatch?.[1]?.trim() || withoutTech,
    dates: dateMatch?.[2]?.trim() || "",
    techStack: techMatch?.[1]?.trim() || "",
  };
}

function isUsefulExperienceBullet(value: string) {
  const clean = value.replace(/^[-•]\s*/, "").trim();
  if (!clean) return false;
  if (/^(agile|software|scrum|collaborated in an)$/i.test(clean)) return false;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 4 && !/\d|%|\$|project|team|client|user/i.test(clean)) {
    return false;
  }
  return true;
}

function parseExperience(value: string | undefined | null): ExperienceEntry[] {
  if (typeof value !== "string") return [];
  const segments = splitExperienceSegments(value);
  const entries: ExperienceEntry[] = [];

  for (const segment of segments) {
    const clean = segment.replace(/^[-•]\s*/, "").trim();
    const isHeader = experienceHeaderPattern.test(clean);

    if (isHeader) {
      const parsed = parseExperienceHeader(clean);
      entries.push({
        ...parsed,
        bullets: [],
        raw: clean,
      });
      continue;
    }

    if (!isUsefulExperienceBullet(clean)) {
      continue;
    }

    if (entries.length) {
      entries[entries.length - 1].bullets.push(clean);
    } else if (clean) {
      entries.push({
        role: "",
        company: "",
        location: "",
        dates: "",
        techStack: "",
        bullets: [clean],
        raw: clean,
      });
    }
  }

  return entries;
}

function contactIcon(type: ContactItem["type"]) {
  if (type === "email") return Mail;
  if (type === "phone") return Phone;
  return Link2;
}

function InfoPanel({
  title,
  icon: Icon,
  children,
  compact = false,
}: {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "p-4" : "p-5"}>{children}</CardContent>
    </Card>
  );
}

export function ResumeExtractPreview({
  resume,
  onUpload,
  onRemove,
  onUpdate,
  parsing = false,
  error,
}: {
  resume: ResumeProfile | null;
  onUpload?: (file: File) => void | Promise<void>;
  onRemove?: () => void;
  onUpdate?: (resume: ResumeProfile) => void;
  parsing?: boolean;
  error?: string | null;
}) {
  const router = useRouter();
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    title: "",
    image: "",
    dates: "",
    link: "",
    description: "",
  });
  const [confirmRemove, setConfirmRemove] = useState(false);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void onUpload?.(file);
  }

  function addProject() {
    if (!resume || !projectFormIsReady(projectForm)) return;

    onUpdate?.({
      ...resume,
      manualProjects: [
        ...(resume.manualProjects ?? []),
        formatManualProject(projectForm),
      ],
    });
    setProjectForm({
      title: "",
      image: "",
      dates: "",
      link: "",
      description: "",
    });
  }

  if (!resume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Upload your resume to build a compact profile for matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-8 text-center">
            <FileUp className="mb-3 h-9 w-9 text-primary" />
            <span className="font-medium text-foreground">
              No resume submitted yet
            </span>
            <span className="mt-1 text-sm text-muted-foreground">
              Complete onboarding before reviewing extracted details.
            </span>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Add resume
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const contacts = contactItems(resume);
  const roles = commaItems(resume.sections.targetRoles);
  const groupedSkills = skillGroups(resume.sections.skills);
  const experience = parseExperience(resume.sections.experience);
  const certifications = sectionItems(
    resume.sections.certifications,
    "certifications",
  );
  const manualProjects = resume.manualProjects ?? [];
  const educationText = typeof resume.sections.education === "string" ? resume.sections.education : "";
  const coursework =
    educationText.match(
      /Relevant Coursework:\s*([\s\S]+)$/i,
    )?.[1] ?? "";
  const educationMain = educationText
    .replace(/Relevant Coursework:\s*[\s\S]+$/i, "")
    .trim();

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <UserRound className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold">{profileName(resume)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {resume.fileName} - Updated {resume.lastUpdated}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-3xl font-semibold">{resume.readinessScore}</p>
              <p className="text-xs text-muted-foreground">Readiness score</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {resume.atsReady ? "ATS ready" : "Needs cleanup"}
              </div>
              <div className="mt-3 grid gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                  <RefreshCw className="h-4 w-4" />
                  {parsing ? "Parsing..." : "Replace"}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleUpload}
                  />
                </label>
                <button
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <InfoPanel title="Contact & Links" icon={Link2}>
          <div className="grid gap-3">
            {contacts.length ? (
              contacts.map((item) => {
                const Icon = contactIcon(item.type);
                return (
                  <div
                    key={`${item.type}-${item.value}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="w-20 shrink-0 text-sm font-medium">
                      {item.label}
                    </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.type === "email" ? undefined : "_blank"}
                        rel={item.type === "email" ? undefined : "noreferrer"}
                        className="break-all text-sm text-primary hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="break-all text-sm text-muted-foreground">
                        {item.value}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No contact details detected.
              </p>
            )}
          </div>
        </InfoPanel>

        <InfoPanel title="Profile Summary" icon={FileText}>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {resume.sections.profileSummary ||
              resume.sections.summary ||
              "No summary section detected."}
          </p>
        </InfoPanel>

        <div className="xl:col-span-2">
          <InfoPanel title="Skills" icon={Code2} compact>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedSkills.some((group) => group.items.length) ? (
                groupedSkills.map((group) => (
                  <section
                    key={group.label}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="mb-3 text-sm font-semibold text-foreground">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((skill) => (
                        <span
                          key={`${group.label}-${skill}`}
                          className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills detected.
                </p>
              )}
            </div>
          </InfoPanel>
        </div>

        <div className="xl:col-span-2">
          <InfoPanel title="Experience" icon={BriefcaseBusiness}>
            <div className="space-y-3">
              {experience.length ? (
                experience.map((item, index) => (
                  <div
                    key={`${item.raw}-${index}`}
                    className="rounded-lg border border-border bg-muted p-4"
                  >
                    {item.role || item.company ? (
                      <div className="mb-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {item.role || "Experience"}
                            </p>
                            {item.company && (
                              <p className="text-sm text-muted-foreground">
                                {item.company}
                              </p>
                            )}
                          </div>
                          {item.dates && (
                            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {item.dates}
                            </span>
                          )}
                        </div>
                        {item.location && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.location}
                          </p>
                        )}
                        {item.techStack && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium text-foreground">
                              Tech Stack:{" "}
                            </span>
                            <span className="text-muted-foreground">
                              {item.techStack}
                            </span>
                          </p>
                        )}
                      </div>
                    ) : null}
                    {item.bullets.length ? (
                      <ul className="space-y-2 pl-4 text-sm leading-7 text-muted-foreground">
                        {item.bullets.map((bullet) => (
                          <li key={bullet} className="list-disc">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {item.raw}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No experience section detected.
                </p>
              )}
            </div>
          </InfoPanel>
        </div>

        <InfoPanel title="Projects" icon={Layers3}>
          <div className="space-y-3">
            {manualProjects.map((project, index) => {
              const image = projectLine(project, "Image");
              const link = projectLine(project, "Link");
              const dates = projectLine(project, "Dates");
              const description = projectDescription(project);

              return (
                <div
                  key={`${project}-${index}`}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {image && /^https?:\/\//i.test(image) ? (
                    <div
                      className="h-36 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${image}")` }}
                    />
                  ) : null}
                  <div className="p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-semibold">{projectTitle(project)}</p>
                      {dates && (
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {dates}
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                      >
                        View project
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  Project title
                  <Input
                    value={projectForm.title}
                    placeholder="Portfolio dashboard"
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Timeline
                  <Input
                    value={projectForm.dates}
                    placeholder="Jan 2026 - Mar 2026"
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        dates: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Image URL
                  <Input
                    value={projectForm.image}
                    placeholder="https://..."
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        image: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Project link
                  <Input
                    value={projectForm.link}
                    placeholder="https://..."
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        link: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="mt-3 block space-y-1.5 text-sm font-medium">
                Description
                <Textarea
                  value={projectForm.description}
                  placeholder="Describe the goal, your role, stack, and measurable result."
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <Button
                className="mt-3"
                onClick={addProject}
                disabled={!projectFormIsReady(projectForm)}
              >
                <Plus className="h-4 w-4" />
                Add project
              </Button>
            </div>
          </div>
        </InfoPanel>

        <InfoPanel title="Education" icon={GraduationCap}>
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {educationMain || "No education section detected."}
            </p>
            {coursework && (
              <section className="rounded-lg border border-border bg-muted p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Coursework
                </div>
                <div className="flex flex-wrap gap-2">
                  {splitListItems(coursework).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </InfoPanel>

        <div className="xl:col-span-2">
          <InfoPanel title="Awards & Certifications" icon={Award}>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {certifications.length ? (
                certifications.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase text-primary">
                        Certificate
                      </p>
                      <div className="min-w-0">
                        <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                          {item.replace(/\s+—\s+.*$/, "")}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {item.includes("—")
                            ? item.replace(/^.*?\s+—\s+/, "")
                            : "Achievement"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No awards or certifications detected.
                </p>
              )}
            </div>
          </InfoPanel>
        </div>
      </div>
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold">Delete resume?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This removes your parsed resume profile, saved applications, cover
              letters, interview prep, and notes.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  onRemove?.();
                  setConfirmRemove(false);
                  router.replace("/onboarding");
                  router.refresh();
                }}
              >
                Delete resume
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
