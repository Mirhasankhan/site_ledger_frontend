import AppShell from "@/components/shell/AppShell";
import ProjectTabHeader from "@/components/projects/ProjectTabHeader";
import ProjectRates from "@/components/projects/ProjectRates";

export default async function SiteManagerProjectRatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="SITE_MANAGER">
      <div className="space-y-7">
        <ProjectTabHeader projectId={id} active="Rates" role="SITE_MANAGER" />
        <ProjectRates projectId={id} />
      </div>
    </AppShell>
  );
}
