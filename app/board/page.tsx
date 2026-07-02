import { ApplicationBoard } from "@/components/application-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageMotion } from "@/components/page-motion";

export default function BoardPage() {
  return (
    <DashboardShell>
      <PageMotion>
        <div className="relative left-1/2 w-[min(calc(100vw-3rem),1500px)] -translate-x-1/2">
          <ApplicationBoard />
        </div>
      </PageMotion>
    </DashboardShell>
  );
}
