import AppShell from "@/components/shell/AppShell";
import ProjectDetails from "@/components/projects/ProjectDetails";

export default async function WorkerProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="WORKER">
      <ProjectDetails projectId={id} role="WORKER" />
    </AppShell>
  );
}
