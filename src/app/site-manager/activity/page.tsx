import AppShell from "@/components/shell/AppShell";
import ActivityWorkspace from "@/components/collaboration/ActivityWorkspace";
export default function ManagerActivityPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <ActivityWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
