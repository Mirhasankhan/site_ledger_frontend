import AppShell from "@/components/shell/AppShell";
import DailyReportsWorkspace from "@/components/operations/DailyReportsWorkspace";
export default function AdminReportsPage() {
  return (
    <AppShell role="ADMIN">
      <DailyReportsWorkspace role="ADMIN" />
    </AppShell>
  );
}
