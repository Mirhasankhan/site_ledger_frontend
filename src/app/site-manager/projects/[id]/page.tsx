import AppShell from "@/components/shell/AppShell";
import ProjectDetails from "@/components/projects/ProjectDetails";

export default async function SiteManagerProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="SITE_MANAGER">
      <ProjectDetails projectId={id} role="SITE_MANAGER" />
    </AppShell>
  );
}
