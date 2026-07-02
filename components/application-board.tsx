"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { motion } from "framer-motion";
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
            "min-h-[640px] w-[280px] shrink-0 rounded-xl border border-border bg-card p-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition",
            snapshot.isDraggingOver && "border-primary ring-2 ring-primary/25",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="whitespace-nowrap font-medium">{status}</h3>
            <span className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">
              {jobs.length}
            </span>
          </div>
          <div className="space-y-3">
            {jobs.map((job, index) => (
              <Draggable key={job.id} draggableId={job.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <JobCard job={job} isDragging={dragSnapshot.isDragging} />
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
        <CardContent className="overflow-x-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-max min-w-full gap-4"
            >
              {trackerStatuses.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  jobs={columns[status]}
                />
              ))}
            </motion.div>
          </DragDropContext>
        </CardContent>
      </Card>
    </>
  );
}
