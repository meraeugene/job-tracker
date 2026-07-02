import { DashboardShell } from "@/components/dashboard-shell";
import { JobApplicationsTable } from "@/components/job-applications-table";
import { PageMotion } from "@/components/page-motion";
import { BriefcaseBusiness } from "lucide-react";

export default function JobApplicationsPage() {
  return (
    <DashboardShell>
      <PageMotion>
        <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Job applications phase
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Job Applications
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Search, filter, and update every application.
            </p>
          </div>
          <JobApplicationsTable />
        </div>
      </PageMotion>
    </DashboardShell>
  );
}
