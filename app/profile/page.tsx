import { DashboardShell } from "@/components/dashboard-shell";
import { PageMotion } from "@/components/page-motion";
import { ResumeWorkspace } from "@/components/resume-workspace";
import { UserRound } from "lucide-react";

export default function ProfilePage() {
  return (
    <DashboardShell>
      <PageMotion>
        <div className="space-y-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <UserRound className="h-3.5 w-3.5" />
              Profile phase
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Your Profile
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review your parsed resume profile and readiness.
            </p>
          </div>
          <ResumeWorkspace />
        </div>
      </PageMotion>
    </DashboardShell>
  );
}
