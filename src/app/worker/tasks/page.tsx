import AppShell from "@/components/shell/AppShell";
import TaskBoard from "@/components/operations/TaskBoard";
export default function WorkerTasksPage() {
  return (
    <AppShell role="WORKER">
      <TaskBoard role="WORKER" />
    </AppShell>
  );
}
