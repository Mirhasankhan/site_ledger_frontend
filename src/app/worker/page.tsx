import AppShell from "@/components/shell/AppShell";
import RoleOverview from "@/components/shell/RoleOverview";
export default function WorkerDashboard() {
  return (
    <AppShell role="WORKER">
      <RoleOverview role="WORKER" />
    </AppShell>
  );
}
