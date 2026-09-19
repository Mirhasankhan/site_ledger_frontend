import AppShell from "@/components/shell/AppShell";
import PaymentsWorkspace from "@/components/payroll/PaymentsWorkspace";
export default function WorkerPaymentsPage() {
  return (
    <AppShell role="WORKER">
      <PaymentsWorkspace role="WORKER" />
    </AppShell>
  );
}
