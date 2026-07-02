import { CoverLettersWorkspace } from "@/components/cover-letters-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageMotion } from "@/components/page-motion";

export default function CoverLettersPage() {
  return (
    <DashboardShell>
      <PageMotion>
        <div className="min-h-[calc(100vh-8rem)] space-y-6">
          <CoverLettersWorkspace />
        </div>
      </PageMotion>
    </DashboardShell>
  );
}
