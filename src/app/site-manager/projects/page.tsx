import AppShell from "@/components/shell/AppShell";
import ProjectList from "@/components/projects/ProjectList";

export default function SiteManagerProjectsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <ProjectList role="SITE_MANAGER" />
    </AppShell>
  );
}
