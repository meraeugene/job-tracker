"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  GitMerge,
  Link2,
  MapPin,
  Wifi,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useApplicationStore } from "@/hooks/use-application-store";
import type {
  ApplicationJob,
  InterviewStage,
  ScreeningAnswer,
} from "@/types/application";
import { cn } from "@/utils/cn";

const schema = z.object({
  role: z.string().min(2, "Enter the job title"),
  company: z.string().min(2, "Enter the company name"),
  platform: z.string().min(2, "Enter where you found this job"),
  jobUrl: z
    .string()
    .min(1, "Enter the job URL")
    .url("Enter a valid job URL"),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  location: z.string().min(2, "Enter the location or timezone"),
  jobDescription: z.string().min(30, "Paste at least a short job description"),
});

type FormValues = z.infer<typeof schema>;

const fieldMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

type PreparedResponse = Partial<
  Pick<
    ApplicationJob,
    | "role"
    | "company"
    | "platform"
    | "location"
    | "fitScore"
    | "matchedSkills"
    | "missingSkills"
    | "resumeSuggestions"
    | "tailoredSummary"
    | "resumeBullets"
    | "coverLetter"
    | "screeningAnswers"
    | "interviewPrep"
  >
> & {
  error?: string;
  warning?: string;
  interviewRoadmap?: { stages?: InterviewStage[] };
};

const loadingMessages = [
  "Reading your resume",
  "Matching the job post",
  "Drafting application materials",
  "Building interview prep",
];

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;
}

function asScreeningAnswers(value: unknown): ScreeningAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ScreeningAnswer =>
      typeof item?.question === "string" && typeof item?.answer === "string",
  );
}

function asInterviewPrep(response: PreparedResponse): InterviewStage[] {
  const direct = response.interviewPrep;
  const roadmap = response.interviewRoadmap?.stages;
  const value = Array.isArray(direct) ? direct : roadmap;

  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is InterviewStage =>
      typeof item?.title === "string" &&
      typeof item?.expectation === "string" &&
      Array.isArray(item?.questions),
  );
}

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

function errorBorder(active?: boolean) {
  return active
    ? "border-red-300 bg-red-50/20 ring-1 ring-red-200 focus:border-red-400 focus:ring-red-200"
    : "";
}

function buildJob(
  values: FormValues,
  prepared: PreparedResponse,
): ApplicationJob {
  const today = new Date().toISOString().slice(0, 10);
  const location =
    prepared.location || `${values.workMode} - ${values.location}`;

  return {
    id: crypto.randomUUID(),
    role: prepared.role || values.role,
    company: prepared.company || values.company,
    platform: prepared.platform || values.platform || "Manual entry",
    location,
    jobUrl: values.jobUrl,
    jobDescription: values.jobDescription,
    fitScore: typeof prepared.fitScore === "number" ? prepared.fitScore : 60,
    currentStage: "Applied",
    nextStep: "Track follow-up, interview invites, or assessment requests.",
    dateSaved: today,
    dateApplied: today,
    status: "Applied",
    matchedSkills: asStringArray(prepared.matchedSkills, []),
    missingSkills: asStringArray(prepared.missingSkills, []),
    resumeSuggestions: asStringArray(prepared.resumeSuggestions, []),
    tailoredSummary:
      prepared.tailoredSummary ||
      `Tailored summary for ${values.role} at ${values.company}.`,
    resumeBullets: asStringArray(prepared.resumeBullets, []),
    coverLetter: "",
    screeningAnswers: asScreeningAnswers(prepared.screeningAnswers),
    interviewPrep: asInterviewPrep(prepared),
    notes: {
      recruiterName: "",
      interviewDate: "",
      salaryDiscussed: "",
      content: "",
      reminderDate: "",
    },
  };
}

export function PrepareApplicationForm() {
  const { resume, addJob } = useApplicationStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setValue, control } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        role: "",
        company: "",
        platform: "",
        jobUrl: "",
        workMode: "Remote",
        location: "",
        jobDescription: "",
      },
    });
  const selectedWorkMode = useWatch({ control, name: "workMode" });
  function loadingProgress() {
    return `${Math.min(30 + loadingStep * 22, 96)}%`;
  }
  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStep((step) =>
        Math.min(step + 1, loadingMessages.length - 1),
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, [loading]);

  async function onSubmit(values: FormValues) {
    if (!resume) {
      setError(
        "Upload your resume during onboarding before adding applications.",
      );
      return;
    }

    setLoadingStep(0);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prepare-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          resumeText: resume?.rawText,
        }),
      });

      const prepared = (await response.json()) as PreparedResponse;
      if (!response.ok) {
        throw new Error(
          prepared.error || "Could not prepare this application.",
        );
      }

      addJob(buildJob(values, prepared));
      router.push("/board");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong.",
      );
    } finally {
      setLoadingStep(0);
      setLoading(false);
    }
  }

  return (
    <Card className="min-h-[calc(100vh-16rem)] shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg">Job details</CardTitle>
        <CardDescription>
          Paste the role details and Mira will prepare the materials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <motion.label
              {...fieldMotion}
              transition={{ duration: 0.24, delay: 0.02 }}
              className="space-y-1.5"
            >
              <span className="text-sm font-medium">
                Job title <RequiredMark />
              </span>
              <div className="relative">
                <BriefcaseBusiness className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className={cn(
                    "h-11 pl-9",
                    errorBorder(Boolean(formState.errors.role)),
                  )}
                  placeholder="Frontend Developer"
                  {...register("role")}
                />
              </div>
              {formState.errors.role && (
                <p className="text-sm text-red-500">
                  {formState.errors.role.message}
                </p>
              )}
            </motion.label>
            <motion.label
              {...fieldMotion}
              transition={{ duration: 0.24, delay: 0.06 }}
              className="space-y-1.5"
            >
              <span className="text-sm font-medium">
                Company <RequiredMark />
              </span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className={cn(
                    "h-11 pl-9",
                    errorBorder(Boolean(formState.errors.company)),
                  )}
                  placeholder="Acme Labs"
                  {...register("company")}
                />
              </div>
              {formState.errors.company && (
                <p className="text-sm text-red-500">
                  {formState.errors.company.message}
                </p>
              )}
            </motion.label>
            <motion.div
              {...fieldMotion}
              transition={{ duration: 0.24, delay: 0.1 }}
              className="space-y-1.5"
            >
              <span className="text-sm font-medium">
                Work setup <RequiredMark />
              </span>
              <input type="hidden" {...register("workMode")} />
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(["Remote", "Hybrid", "On-site"] as const).map((mode) => {
                  const active = selectedWorkMode === mode;
                  const ModeIcon =
                    mode === "Remote" ? Wifi : mode === "Hybrid" ? GitMerge : Building2;

                  return (
                    <button
                      key={mode}
                      type="button"
                      className={cn(
                        "flex min-h-20 items-start justify-between rounded-xl border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_8px_22px_rgba(37,99,235,0.10)]",
                        active ? " bg-primary/5" : "border-blue-200",
                        formState.errors.workMode &&
                          "border-red-300 bg-red-50/20 ring-1 ring-red-200 hover:border-red-400",
                      )}
                      onClick={() =>
                        setValue("workMode", mode, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <span>
                        <span className="mb-2 flex items-center gap-1.5">
                          <ModeIcon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-semibold">{mode}</span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {mode === "Remote"
                            ? "Fully online role"
                            : mode === "Hybrid"
                              ? "Mix of office and online"
                              : "Office-based role"}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-blue-200 text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
            <motion.label
              {...fieldMotion}
              transition={{ duration: 0.24, delay: 0.14 }}
              className="space-y-1.5"
            >
              <span className="text-sm font-medium">
                Location or timezone <RequiredMark />
              </span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className={cn(
                    "h-11 pl-9",
                    errorBorder(Boolean(formState.errors.location)),
                  )}
                  placeholder="Manila, PH or EST hours"
                  {...register("location")}
                />
              </div>
              {formState.errors.location && (
                <p className="text-sm text-red-500">
                  {formState.errors.location.message}
                </p>
              )}
            </motion.label>
          </div>
          <motion.label
            {...fieldMotion}
            transition={{ duration: 0.24, delay: 0.18 }}
            className="block space-y-1.5"
          >
            <span className="text-sm font-medium">
              Where did you find it? <RequiredMark />
            </span>
            <Input
              className={cn(
                "h-11",
                errorBorder(Boolean(formState.errors.platform)),
              )}
              placeholder="LinkedIn, Indeed, company careers page, referral..."
              {...register("platform")}
            />
            {formState.errors.platform && (
              <p className="text-sm text-red-500">
                {formState.errors.platform.message}
              </p>
            )}
          </motion.label>
          <motion.label
            {...fieldMotion}
            transition={{ duration: 0.24, delay: 0.2 }}
            className="block space-y-1.5"
          >
            <span className="text-sm font-medium">
              Job URL <RequiredMark />
            </span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(
                  "h-11 pl-9",
                  errorBorder(Boolean(formState.errors.jobUrl)),
                )}
                placeholder="https://company.com/careers/job"
                {...register("jobUrl")}
              />
            </div>
            {formState.errors.jobUrl && (
              <p className="text-sm text-red-500">
                {formState.errors.jobUrl.message}
              </p>
            )}
          </motion.label>
          <motion.label
            {...fieldMotion}
            transition={{ duration: 0.24, delay: 0.24 }}
            className="block space-y-1.5"
          >
            <span className="text-sm font-medium">
              Job description <RequiredMark />
            </span>
            <Textarea
              className={cn(
                "min-h-48 leading-6",
                errorBorder(Boolean(formState.errors.jobDescription)),
              )}
              placeholder="Paste the responsibilities, qualifications, salary notes, and anything else from the job post."
              {...register("jobDescription")}
            />
            {formState.errors.jobDescription && (
              <p className="text-sm text-red-500">
                {formState.errors.jobDescription.message}
              </p>
            )}
          </motion.label>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-sm text-red-500 dark:border-red-900 dark:bg-red-950">
              {error}
            </p>
          )}
          <motion.div whileTap={{ scale: 0.98 }}>
            {loading ? (
              <div className="relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 via-primary to-blue-600 shadow-[0_8px_28px_rgba(37,99,235,0.35)]">
                <span className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
                <span className="relative flex items-center gap-2.5 text-white">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
                  </span>
                  <span className="text-sm font-semibold tracking-wide">
                    {loadingMessages[loadingStep]}
                  </span>
                </span>
                <span className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-all duration-700 ease-out" style={{ width: loadingProgress() }} />
              </div>
            ) : (
              <Button
                type="submit"
                className="h-14 w-full rounded-xl text-base font-semibold shadow-[0_8px_24px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.40)] transition-shadow"
                disabled={!resume}
              >
                Save Job Application
              </Button>
            )}
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}
