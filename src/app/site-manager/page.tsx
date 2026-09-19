import AppShell from "@/components/shell/AppShell";
import RoleOverview from "@/components/shell/RoleOverview";
export default function SiteManagerDashboard() {
  return (
    <AppShell role="SITE_MANAGER">
      <RoleOverview role="SITE_MANAGER" />
    </AppShell>
  );
}
