"use client";

import { GripVertical } from "lucide-react";
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
        "rounded-xl border p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition hover:border-primary/30 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)]",
        statusSurfaceStyles[job.status],
        statusAccentStyles[job.status],
        isDragging &&
          "rotate-[0.5deg] border-primary/50 shadow-[0_20px_44px_rgba(37,99,235,0.18)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">{job.role}</p>
          <p className="break-words text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
        <div className="rounded-md p-1 text-muted-foreground" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FitScoreBadge score={job.fitScore} />
      </div>
    </article>
  );
}
