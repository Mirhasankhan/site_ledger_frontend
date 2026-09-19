import AppShell from "@/components/shell/AppShell";
import ActivityWorkspace from "@/components/collaboration/ActivityWorkspace";
export default function AdminActivityPage() {
  return (
    <AppShell role="ADMIN">
      <ActivityWorkspace role="ADMIN" />
    </AppShell>
  );
}
