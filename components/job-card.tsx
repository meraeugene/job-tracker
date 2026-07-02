"use client";

import { FitScoreBadge } from "@/components/fit-score-badge";
import type { ApplicationJob } from "@/types/application";
import { cn } from "@/utils/cn";
import { statusAccentStyles, statusSurfaceStyles } from "@/utils/status-styles";

export function JobCard({
  job,
  isDragging = false,
}: {
  job: ApplicationJob;
  isDragging?: boolean;
}) {
  return (
    <article
      className={cn(
        "cursor-grab rounded-lg border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:border-primary/30 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)] active:cursor-grabbing",
        statusSurfaceStyles[job.status],
        statusAccentStyles[job.status],
        isDragging &&
          "border-primary bg-card shadow-[0_24px_60px_rgba(37,99,235,0.20)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">{job.role}</p>
          <p className="break-words text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FitScoreBadge score={job.fitScore} />
      </div>
    </article>
  );
}
