import AppShell from "@/components/shell/AppShell";
import MaterialsWorkspace from "@/components/finance/MaterialsWorkspace";
export default function AdminMaterialsPage() {
  return (
    <AppShell role="ADMIN">
      <MaterialsWorkspace role="ADMIN" />
    </AppShell>
  );
}
