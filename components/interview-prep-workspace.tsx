"use client";

import { Loader2, MessageSquareText, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/empty-state";
import { FitScoreBadge } from "@/components/fit-score-badge";
import { InterviewPrepTimeline } from "@/components/interview-prep-timeline";
import { JobStatusBadge } from "@/components/job-status-badge";
import { useApplicationStore } from "@/hooks/use-application-store";

function SelectionLoading() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading interview prep...</p>
    </div>
  );
}

export function InterviewPrepWorkspace() {
  const { appliedJobs } = useApplicationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const selectedJob = useMemo(
    () => appliedJobs.find((job) => job.id === selectedId) ?? null,
    [appliedJobs, selectedId],
  );

  function chooseJob(id: string) {
    setSelectingId(id);
    window.setTimeout(() => {
      setSelectedId(id);
      setSelectingId(null);
    }, 180);
  }

  if (!appliedJobs.length) {
    return (
      <EmptyState
        icon={MessageSquareText}
        eyebrow="Interview prep phase"
        title="No interview prep yet"
        description="Add a job application first. Mira will build role-specific questions, answer angles, and a practice flow."
      />
    );
  }

  if (!selectedJob) {
    return (
      <div className="min-h-[calc(100vh-9rem)]">
        <div className="mb-9 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Video className="h-3.5 w-3.5" />
            Interview prep phase
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Practice the interview like a real call, with voice and camera.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Pick a job and practice with voice, camera, and focus alerts.
          </p>
        </div>
        {selectingId ? (
          <SelectionLoading />
        ) : (
          <div
            id="interview-jobs"
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
                    <p className="truncate text-base font-semibold">{job.role}</p>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FitScoreBadge score={job.fitScore} />
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
      <div className="w-full">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="text-primary">Step 2</span>
            <span>/ 2</span>
          </div>
          <h2 className="text-xl font-semibold">Interview Prep</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {selectedJob.role} at {selectedJob.company}
          </p>
        </div>
        <InterviewPrepTimeline
          job={selectedJob}
          onBack={() => setSelectedId(null)}
        />
      </div>
    </motion.div>
  );
}
