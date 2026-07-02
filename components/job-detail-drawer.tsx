"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { InterviewPrepTimeline } from "@/components/interview-prep-timeline";
import { JobStatusBadge } from "@/components/job-status-badge";
import { NotesPanel } from "@/components/notes-panel";
import { ResumeMatchPanel } from "@/components/resume-match-panel";
import { ScreeningAnswersPanel } from "@/components/screening-answers-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplicationStore } from "@/hooks/use-application-store";
import type { ApplicationJob } from "@/types/application";
import { cn } from "@/utils/cn";

const tabs = ["Overview", "Resume Match", "Cover Letter", "Screening Answers", "Interview Prep", "Notes"];

export function JobDetailDrawer({ job }: { job: ApplicationJob }) {
  const [active, setActive] = useState("Overview");
  const router = useRouter();
  const { updateJobStatus, deleteJob } = useApplicationStore();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <span className="text-sm text-muted-foreground">{job.platform}</span>
          </div>
          <h1 className="text-2xl font-semibold">{job.role}</h1>
          <p className="mt-1 text-muted-foreground">
            {job.company} · {job.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.jobUrl ? (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open Job Link
            </a>
          ) : null}
          <Button variant="secondary" onClick={() => updateJobStatus(job.id, "Applied")}>Mark as Applied</Button>
          <Button variant="secondary" onClick={() => updateJobStatus(job.id, "Interview")}>Move to Interview</Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteJob(job.id);
              router.push("/job-applications");
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition",
              active === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {active === "Overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Role", job.role],
              ["Company", job.company],
              ["Platform", job.platform],
              ["Location", job.location],
              ["Date saved", job.dateSaved],
              ["Current stage", job.currentStage],
              ["Next step", job.nextStep],
              ["Job source", job.jobUrl || "Manual entry"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 break-words text-sm">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {active === "Resume Match" && <ResumeMatchPanel job={job} />}
      {active === "Cover Letter" && <CoverLetterPanel job={job} />}
      {active === "Screening Answers" && <ScreeningAnswersPanel job={job} />}
      {active === "Interview Prep" && <InterviewPrepTimeline job={job} />}
      {active === "Notes" && <NotesPanel job={job} />}
    </div>
  );
}
