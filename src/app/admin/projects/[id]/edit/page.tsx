import EditProjectPage from "@/components/projects/EditProjectPage";

export default async function EditProjectRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProjectPage projectId={id} />;
}
