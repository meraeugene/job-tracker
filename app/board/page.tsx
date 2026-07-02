import { ApplicationBoard } from "@/components/application-board";
import { DashboardShell } from "@/components/dashboard-shell";

export default function BoardPage() {
  return (
    <DashboardShell>
      <ApplicationBoard />
    </DashboardShell>
  );
}
