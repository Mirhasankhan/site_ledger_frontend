import AppShell from "@/components/shell/AppShell";
import MaterialsWorkspace from "@/components/finance/MaterialsWorkspace";
export default function WorkerMaterialsPage() {
  return (
    <AppShell role="WORKER">
      <MaterialsWorkspace role="WORKER" />
    </AppShell>
  );
}
