import AppShell from "@/components/shell/AppShell";
import TaskBoard from "@/components/operations/TaskBoard";
export default function AdminTasksPage() {
  return (
    <AppShell role="ADMIN">
      <TaskBoard role="ADMIN" />
    </AppShell>
  );
}
