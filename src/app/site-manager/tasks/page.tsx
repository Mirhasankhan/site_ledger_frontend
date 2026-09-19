import AppShell from "@/components/shell/AppShell";
import TaskBoard from "@/components/operations/TaskBoard";
export default function ManagerTasksPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <TaskBoard role="SITE_MANAGER" />
    </AppShell>
  );
}
