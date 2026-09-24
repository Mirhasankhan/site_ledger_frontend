import AppShell from "@/components/shell/AppShell";
import ProjectTabHeader from "@/components/projects/ProjectTabHeader";
import ProjectWorkers from "@/components/projects/ProjectWorkers";

export default async function SiteManagerProjectWorkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="SITE_MANAGER">
      <div className="space-y-7">
        <ProjectTabHeader projectId={id} active="Workers" role="SITE_MANAGER" />
        <ProjectWorkers projectId={id} />
      </div>
    </AppShell>
  );
}
