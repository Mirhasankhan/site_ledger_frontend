import AppShell from "@/components/shell/AppShell";
import ActivityWorkspace from "@/components/collaboration/ActivityWorkspace";
export default function WorkerActivityPage() {
  return (
    <AppShell role="WORKER">
      <ActivityWorkspace role="WORKER" />
    </AppShell>
  );
}
