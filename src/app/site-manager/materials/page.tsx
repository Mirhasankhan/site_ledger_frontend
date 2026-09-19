import AppShell from "@/components/shell/AppShell";
import MaterialsWorkspace from "@/components/finance/MaterialsWorkspace";
export default function ManagerMaterialsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <MaterialsWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
