"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Columns3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { JobCard } from "@/components/job-card";
import { Card, CardContent } from "@/components/ui/card";
import { trackerStatuses } from "@/data/mock-data";
import { useApplicationStore } from "@/hooks/use-application-store";
import type { ApplicationJob, JobStatus } from "@/types/application";
import { cn } from "@/utils/cn";

function groupJobs(jobs: ApplicationJob[]) {
  return trackerStatuses.reduce(
    (columns, status) => ({
      ...columns,
      [status]: jobs.filter((job) => job.status === status),
    }),
    {} as Record<JobStatus, ApplicationJob[]>,
  );
}

function reorderBoard(
  jobs: ApplicationJob[],
  sourceStatus: JobStatus,
  sourceIndex: number,
  targetStatus: JobStatus,
  targetIndex: number,
) {
  const columns = groupJobs(jobs);
  const sourceJobs = [...columns[sourceStatus]];
  const targetJobs =
    sourceStatus === targetStatus ? sourceJobs : [...columns[targetStatus]];
  const [movedJob] = sourceJobs.splice(sourceIndex, 1);

  if (!movedJob) return jobs;

  targetJobs.splice(targetIndex, 0, {
    ...movedJob,
    status: targetStatus,
    currentStage: targetStatus,
    dateApplied:
      targetStatus === "Applied" && !movedJob.dateApplied
        ? new Date().toISOString().slice(0, 10)
        : movedJob.dateApplied,
  });

  return trackerStatuses.flatMap((status) => {
    if (status === sourceStatus && status === targetStatus) return targetJobs;
    if (status === sourceStatus) return sourceJobs;
    if (status === targetStatus) return targetJobs;
    return columns[status];
  });
}

function BoardColumn({
  status,
  jobs,
}: {
  status: JobStatus;
  jobs: ApplicationJob[];
}) {
  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <section
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "flex max-h-[calc(100vh-15rem)] min-h-[640px] min-w-0 flex-col rounded-lg border border-border bg-[#fbfcff] p-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition dark:bg-card",
            snapshot.isDraggingOver &&
              "border-primary bg-primary/5 ring-2 ring-primary/20",
          )}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between border-b border-border pb-3">
            <h3 className="whitespace-nowrap font-medium">{status}</h3>
            <span className="rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
              {jobs.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {jobs.map((job, index) => (
              <Draggable key={job.id} draggableId={job.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={cn(
                      "transition",
                      dragSnapshot.isDragging && "relative z-20",
                    )}
                  >
                    <JobCard
                      job={job}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </section>
      )}
    </Droppable>
  );
}

export function ApplicationBoard() {
  const { jobs, replaceJobs } = useApplicationStore();
  const columns = groupJobs(jobs);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as JobStatus;
    const targetStatus = result.destination.droppableId as JobStatus;
    if (
      !trackerStatuses.includes(sourceStatus) ||
      !trackerStatuses.includes(targetStatus)
    ) {
      return;
    }

    replaceJobs(
      reorderBoard(
        jobs,
        sourceStatus,
        result.source.index,
        targetStatus,
        result.destination.index,
      ),
    );
  }

  if (!jobs.length) {
    return (
      <EmptyState
        icon={Columns3}
        eyebrow="Mira board phase"
        title="No tracked applications yet"
        description="Prepare an application first. Mira will place it on your board so you can move it from applied to offer."
      />
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Columns3 className="h-3.5 w-3.5" />
          Mira board phase
        </div>
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
          Mira Board
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Track active applications from applied to final outcome.
        </p>
      </div>
      <Card className="w-full overflow-hidden shadow-[0_18px_54px_rgba(37,99,235,0.06)]">
        <CardContent className="p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:gap-4">
              {trackerStatuses.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  jobs={columns[status]}
                />
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>
    </>
  );
}
