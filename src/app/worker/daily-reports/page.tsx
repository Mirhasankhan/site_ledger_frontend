import AppShell from "@/components/shell/AppShell";
import DailyReportsWorkspace from "@/components/operations/DailyReportsWorkspace";
export default function WorkerReportsPage() {
  return (
    <AppShell role="WORKER">
      <DailyReportsWorkspace role="WORKER" />
    </AppShell>
  );
}
