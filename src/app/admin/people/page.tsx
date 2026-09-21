import AppShell from "@/components/shell/AppShell";
import WorkersWorkspace from "@/components/workers/WorkersWorkspace";

export default function AdminPeoplePage() {
  return (
    <AppShell role="ADMIN">
      <WorkersWorkspace role="ADMIN" />
    </AppShell>
  );
}
