import AppShell from "@/components/shell/AppShell";
import RoleOverview from "@/components/shell/RoleOverview";
export default function AdminDashboard() {
  return (
    <AppShell role="ADMIN">
      <RoleOverview role="ADMIN" />
    </AppShell>
  );
}
