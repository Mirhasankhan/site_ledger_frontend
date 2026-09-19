import AppShell from "@/components/shell/AppShell";
import PaymentsWorkspace from "@/components/payroll/PaymentsWorkspace";
export default function AdminPaymentsPage() {
  return (
    <AppShell role="ADMIN">
      <PaymentsWorkspace role="ADMIN" />
    </AppShell>
  );
}
