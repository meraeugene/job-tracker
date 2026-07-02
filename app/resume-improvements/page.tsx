import { DashboardShell } from "@/components/dashboard-shell";
import { PageMotion } from "@/components/page-motion";
import { ResumeImprovementsWorkspace } from "@/components/resume-improvements-workspace";

export default function ResumeImprovementsPage() {
  return (
    <DashboardShell>
      <PageMotion>
        <ResumeImprovementsWorkspace />
      </PageMotion>
    </DashboardShell>
  );
}
