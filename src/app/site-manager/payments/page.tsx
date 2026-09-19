import AppShell from "@/components/shell/AppShell";
import PaymentsWorkspace from "@/components/payroll/PaymentsWorkspace";
export default function ManagerPaymentsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <PaymentsWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
