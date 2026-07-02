import { DashboardShell } from "@/components/dashboard-shell";
import { InterviewPrepWorkspace } from "@/components/interview-prep-workspace";
import { PageMotion } from "@/components/page-motion";

export default function InterviewPrepPage() {
  return (
    <DashboardShell>
      <PageMotion>
        <InterviewPrepWorkspace />
      </PageMotion>
    </DashboardShell>
  );
}
