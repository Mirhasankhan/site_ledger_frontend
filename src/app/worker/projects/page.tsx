import AppShell from "@/components/shell/AppShell";
import ProjectList from "@/components/projects/ProjectList";

export default function WorkerProjectsPage() {
  return (
    <AppShell role="WORKER">
      <ProjectList role="WORKER" />
    </AppShell>
  );
}
