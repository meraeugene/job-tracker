import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHome } from "@/components/dashboard-home";
import { PageMotion } from "@/components/page-motion";

export default function PreparePage() {
  return (
    <DashboardShell>
      <PageMotion>
        <DashboardHome />
      </PageMotion>
    </DashboardShell>
  );
}
