"use client";

import { BriefcaseBusiness } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { JobDetailDrawer } from "@/components/job-detail-drawer";
import { useApplicationStore } from "@/hooks/use-application-store";

export function JobDetailWorkspace({ id }: { id: string }) {
  const { jobs } = useApplicationStore();
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="Job not found"
        description="This job may have been deleted from local storage."
      />
    );
  }

  return <JobDetailDrawer job={job} />;
}
