import AppShell from "@/components/shell/AppShell";
import WorkersWorkspace from "@/components/workers/WorkersWorkspace";

export default function ManagerWorkersPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <WorkersWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
