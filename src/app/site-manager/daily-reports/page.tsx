import AppShell from "@/components/shell/AppShell";
import DailyReportsWorkspace from "@/components/operations/DailyReportsWorkspace";
export default function ManagerReportsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <DailyReportsWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
