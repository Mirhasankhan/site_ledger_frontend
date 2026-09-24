import AppShell from "@/components/shell/AppShell";
import ProjectTabHeader from "@/components/projects/ProjectTabHeader";
import ProjectTasks from "@/components/projects/ProjectTasks";

export default async function SiteManagerProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="SITE_MANAGER">
      <div className="space-y-7">
        <ProjectTabHeader projectId={id} active="Tasks" role="SITE_MANAGER" />
        <ProjectTasks projectId={id} />
      </div>
    </AppShell>
  );
}
