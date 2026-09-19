import AppShell from "@/components/shell/AppShell";
import ProjectTabHeader from "@/components/projects/ProjectTabHeader";
import ProjectWorkers from "@/components/projects/ProjectWorkers";
export default async function ProjectWorkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="ADMIN">
      <div className="space-y-7">
        <ProjectTabHeader projectId={id} active="Workers" />
        <ProjectWorkers projectId={id} />
      </div>
    </AppShell>
  );
}
