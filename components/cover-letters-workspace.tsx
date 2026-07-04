"use client";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Globe,
  Laptop,
  MailPlus,
  Loader2,
  Mail,
  MapPin,
  Network,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/empty-state";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useApplicationStore } from "@/hooks/use-application-store";

function draftCoverLetter(role: string, company: string) {
  return `Dear ${company} Hiring Team,\n\nI am excited to apply for the ${role} role. My background aligns with the needs of this position through hands-on execution, clear communication, and a steady focus on building useful outcomes.\n\nIn my recent work, I have translated requirements into polished deliverables, collaborated with stakeholders, and improved workflows through practical problem solving. I would bring that same ownership to ${company}, along with the ability to learn quickly, communicate progress clearly, and contribute with care from the first weeks of the role.\n\nWhat stands out to me about this opportunity is the chance to apply my experience in a team where quality, reliability, and thoughtful execution matter. I would welcome the opportunity to discuss how my background can support your goals for this position.\n\nSincerely,\nCandidate`;
}

function profileContext(resumeText?: string) {
  if (!resumeText) return "";
  return (
    resumeText.split(/\nprofessional summary\n/i)[0]?.trim() ||
    resumeText.slice(0, 700)
  );
}

function CoverLetterSkeleton() {
  return (
    <div className="min-h-80 rounded-md border border-border bg-card p-4">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-11/12 rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-10/12 rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-11/12 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function SelectionLoading() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading cover letter...</p>
    </div>
  );
}

function EmptyLetterPanel() {
  return (
    <div className="relative flex min-h-[520px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-blue-100 bg-white p-8 text-center shadow-[0_22px_56px_rgba(37,99,235,0.06)]">
      <div className="absolute inset-x-16 top-0 h-28 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Mail className="h-3.5 w-3.5" />
        Cover letter draft
      </div>

      <p className="relative text-2xl font-semibold tracking-normal">
        No cover letter yet
      </p>
      <p className="relative mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        Use the generate action above when you are ready to create a tailored
        draft from your profile, resume, and the job description.
      </p>
    </div>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function CoverLettersWorkspace() {
  const { appliedJobs, resume, updateJob } = useApplicationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedJob = useMemo(
    () => appliedJobs.find((job) => job.id === selectedId) ?? null,
    [appliedJobs, selectedId],
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    setDescOpen(false);
  }, [selectedId]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  function chooseJob(id: string) {
    setSelectingId(id);
    window.setTimeout(() => {
      setSelectedId(id);
      setSelectingId(null);
    }, 180);
  }

  async function generateLetter() {
    if (!selectedJob || cooldown > 0) return;
    setGenerating(true);

    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedJob.role,
          company: selectedJob.company,
          location: selectedJob.location,
          jobDescription: selectedJob.jobDescription,
          resumeText: resume?.rawText,
          candidateProfile: profileContext(resume?.rawText),
          matchedSkills: selectedJob.matchedSkills,
        }),
      });
      const payload = (await response.json()) as { letter?: string };
      const nextLetter =
        payload.letter ||
        draftCoverLetter(selectedJob.role, selectedJob.company);
      setDrafts((current) => ({ ...current, [selectedJob.id]: nextLetter }));
      updateJob(selectedJob.id, { coverLetter: nextLetter });
    } finally {
      setGenerating(false);
      setCooldown(20);
    }
  }

  if (!appliedJobs.length) {
    return (
      <EmptyState
        icon={Mail}
        eyebrow="Cover letters phase"
        title="No cover letters yet"
        description="Add a job application first. Mira will create a tailored cover letter from your profile and the job details."
      />
    );
  }

  const letter = selectedJob
    ? (drafts[selectedJob.id] ?? selectedJob.coverLetter ?? "")
    : "";
  const generateLabel = generating
    ? "Generating..."
    : cooldown > 0
      ? `Cooldown ${cooldown}s`
      : letter
        ? "Generate again"
        : "Generate";

  if (!selectedJob) {
    return (
      <div className="min-h-[calc(100vh-9rem)]">
        <div className="mb-9 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MailPlus className="h-3.5 w-3.5" />
            Cover letters phase
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Cover Letters
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Pick a job to draft and save a tailored cover letter.
          </p>
        </div>
        {selectingId ? (
          <SelectionLoading />
        ) : (
          <div
            id="cover-letter-jobs"
            className="grid w-full gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_22px_56px_rgba(15,23,42,0.08)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]"
          >
            {appliedJobs.map((job) => (
              <button
                key={job.id}
                className="group rounded-xl border border-border bg-card p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                onClick={() => chooseJob(job.id)}
              >
                <div className="mb-5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {job.role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.company}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <JobStatusBadge status={job.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="flex min-h-[calc(100vh-13rem)] justify-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="text-primary">Step 2</span>
            <span>/ 2</span>
          </div>
          <h2 className="text-xl font-semibold">Generated Cover Letter</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {selectedJob.role} at {selectedJob.company}
          </p>
        </div>
        <Card className="flex min-h-[calc(100vh-18rem)] flex-col overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Button
                variant="secondary"
                size="sm"
                className="mb-4"
                onClick={() => setSelectedId(null)}
                aria-label="Back to cover letter jobs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <JobStatusBadge status={selectedJob.status} />
              </div>
              <CardTitle>{selectedJob.role}</CardTitle>
              <CardDescription>
                Generated cover letter for {selectedJob.company}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:mr-2 sm:justify-end">
              <Button
                size="sm"
                onClick={generateLetter}
                disabled={generating || cooldown > 0}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {generateLabel}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!letter}
                onClick={async () => {
                  await copyText(letter);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 p-5">
            {(() => {
              const locationString = selectedJob.location || "";
              let workSetup = "On-site";
              let locationPart = locationString;

              if (locationString.includes(" - ")) {
                const parts = locationString.split(" - ");
                workSetup = parts[0];
                locationPart = parts.slice(1).join(" - ");
              } else if (["Remote", "Hybrid", "On-site"].includes(locationString)) {
                workSetup = locationString;
                locationPart = "";
              }

              const workSetupClean = workSetup.trim().toLowerCase();
              let WorkIcon = Building2;
              if (workSetupClean.includes("remote")) {
                WorkIcon = Laptop;
              } else if (workSetupClean.includes("hybrid")) {
                WorkIcon = Network;
              }

              return (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Company
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 font-medium break-words">
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                        <span>{selectedJob.company}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Work Setup
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 font-medium break-words">
                        <WorkIcon className="h-4 w-4 text-primary shrink-0" />
                        <span>{workSetup}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Location
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 font-medium break-words">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{locationPart || "N/A"}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Platform
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 font-medium break-words">
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <span>{selectedJob.platform}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Date Saved
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 font-medium break-words">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span>{selectedJob.dateSaved}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setDescOpen(!descOpen)}
                      className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/40 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        JOB DESCRIPTION
                      </span>
                      {descOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {descOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <div className="border-t border-border p-4 bg-card">
                            <p className="text-sm leading-6 text-foreground break-words whitespace-pre-wrap">
                              {selectedJob.jobDescription}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
            {generating ? (
              <CoverLetterSkeleton />
            ) : letter ? (
              <Textarea
                className="min-h-[520px] flex-1 resize-none overflow-hidden leading-7"
                value={letter}
                onChange={(event) => {
                  setDrafts((current) => ({
                    ...current,
                    [selectedJob.id]: event.target.value,
                  }));
                  updateJob(selectedJob.id, {
                    coverLetter: event.target.value,
                  });
                }}
              />
            ) : (
              <EmptyLetterPanel />
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
