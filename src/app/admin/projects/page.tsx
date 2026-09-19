import AppShell from "@/components/shell/AppShell";
import ProjectList from "@/components/projects/ProjectList";
export default function AdminProjectsPage() {
  return (
    <AppShell role="ADMIN">
      <ProjectList role="ADMIN" />
    </AppShell>
  );
}
