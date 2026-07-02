"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { FitScoreBadge } from "@/components/fit-score-badge";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApplicationStore } from "@/hooks/use-application-store";

type ImprovementResult = {
  fitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  resumeSuggestions: string[];
  improvedSummary: string;
  improvedBullets: string[];
  rationale: string;
  warning?: string;
};

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function ResumeImprovementsWorkspace() {
  const { appliedJobs, resume, updateJob } = useApplicationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImprovementResult | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    tone: "info" | "error";
  } | null>(null);
  const selectedJob = useMemo(
    () => appliedJobs.find((job) => job.id === selectedId) ?? null,
    [appliedJobs, selectedId],
  );

  async function analyzeJob(id: string) {
    const job = appliedJobs.find((item) => item.id === id);
    if (!job || !resume) return;

    setSelectedId(id);
    setLoading(true);
    setToast(null);
    setResult(null);

    try {
      const response = await fetch("/api/resume-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: job.role,
          company: job.company,
          jobDescription: job.jobDescription,
          resumeText: resume.rawText,
        }),
      });
      const payload = (await response.json()) as Partial<ImprovementResult> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not analyze this job.");
      }

      const nextResult: ImprovementResult = {
        fitScore:
          typeof payload.fitScore === "number"
            ? Math.max(0, Math.min(100, Math.round(payload.fitScore)))
            : job.fitScore,
        matchedKeywords: asStringArray(payload.matchedKeywords),
        missingKeywords: asStringArray(payload.missingKeywords),
        resumeSuggestions: asStringArray(payload.resumeSuggestions),
        improvedSummary: payload.improvedSummary || job.tailoredSummary,
        improvedBullets: asStringArray(payload.improvedBullets),
        rationale: payload.rationale || "",
        warning: payload.warning,
      };

      setResult(nextResult);
      if (nextResult.warning) {
        setToast({
          title: "Simpler comparison used",
          description:
            "The advanced analysis service was unavailable, so Mira used a basic resume-to-job comparison. You can analyze again later for a stronger result.",
          tone: "info",
        });
      }
      updateJob(job.id, {
        fitScore: nextResult.fitScore,
        matchedSkills: nextResult.matchedKeywords,
        missingSkills: nextResult.missingKeywords,
        resumeSuggestions: nextResult.resumeSuggestions,
        tailoredSummary: nextResult.improvedSummary,
        resumeBullets: nextResult.improvedBullets,
      });
    } catch (analysisError) {
      setToast({
        title: "Could not analyze this job",
        description:
          analysisError instanceof Error
            ? analysisError.message
            : "Please check the job details and try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!resume) {
    return (
      <EmptyState
        icon={FileText}
        eyebrow="Resume improve phase"
        title="Upload your profile first"
        description="Mira needs your parsed resume before comparing it against job applications."
      />
    );
  }

  if (!appliedJobs.length) {
    return (
      <EmptyState
        icon={FileCheck2}
        eyebrow="Resume improve phase"
        title="No job applications yet"
        description="Prepare a job application first. Mira will compare that job with your profile and create accurate resume improvements."
      />
    );
  }

  if (!selectedJob) {
    return (
      <div className="min-h-[calc(100vh-9rem)]">
        <div className="mb-9 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileCheck2 className="h-3.5 w-3.5" />
            Resume improve phase
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Resume Improve
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Pick a job and Mira will score the match and suggest resume
            improvements.
          </p>
        </div>
        <div
          id="resume-improvement-jobs"
          className="grid w-full gap-3 rounded-xl border border-blue-100 bg-card p-5 shadow-[0_22px_56px_rgba(37,99,235,0.06)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]"
        >
          {appliedJobs.map((job) => (
            <button
              key={job.id}
              className="group rounded-xl border border-blue-100 bg-card p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:border-primary/40 hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)]"
              onClick={() => void analyzeJob(job.id)}
            >
              <div className="mb-5">
                <p className="truncate text-base font-semibold">{job.role}</p>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FitScoreBadge score={job.fitScore} />
                <JobStatusBadge status={job.status} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-13rem)] justify-center">
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="text-primary">Step 2</span>
            <span>/ 2</span>
          </div>
          <h2 className="text-xl font-semibold">Resume Improvements</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {selectedJob.role} at {selectedJob.company}
          </p>
        </div>

        <Card className="min-h-[520px]">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mb-4"
                  onClick={() => {
                    setSelectedId(null);
                    setResult(null);
                    setToast(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change job
                </Button>
                <CardTitle>{selectedJob.role}</CardTitle>
                <CardDescription>
                  Mira compares your resume evidence with this job description.
                </CardDescription>
              </div>
              <Button
                size="sm"
                disabled={loading}
                onClick={() => void analyzeJob(selectedJob.id)}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Analyzing..." : "Analyze again"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {loading && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-blue-100 bg-primary/5 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                <p className="font-medium">Mira is comparing your resume</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Checking fit score, proven skills, missing keywords, and
                  resume wording for this role.
                </p>
              </div>
            )}

            {result && !loading && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedJob.company}
                  </span>
                  <FitScoreBadge score={result.fitScore} />
                  <JobStatusBadge status={selectedJob.status} />
                </div>

                <section className="rounded-lg border border-red-200 bg-red-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Missing or weakly proven keywords
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-red-200 bg-card px-3 py-1.5 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-green-200 bg-green-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Proven matches from your resume
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-green-200 bg-card px-3 py-1.5 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-blue-100 bg-primary/5 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-primary">
                    Suggested resume summary
                  </h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {result.improvedSummary}
                  </p>
                </section>

                <section className="rounded-lg border border-blue-100 bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold">
                    Bullet rewrites
                  </h3>
                  <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                    {result.improvedBullets.map((bullet) => (
                      <li key={bullet} className="list-inside list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </section>

                {result.resumeSuggestions.length > 0 && (
                  <section className="rounded-lg border border-blue-100 bg-card p-5">
                    <h3 className="mb-3 text-sm font-semibold">
                      What to change
                    </h3>
                    <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                      {result.resumeSuggestions.map((suggestion) => (
                        <li key={suggestion} className="list-inside list-disc">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(calc(100vw-2rem),380px)] rounded-xl border border-blue-100 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                toast.tone === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {toast.tone === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {toast.description}
              </p>
            </div>
            <button
              type="button"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
