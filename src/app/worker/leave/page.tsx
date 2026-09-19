import AppShell from "@/components/shell/AppShell";
import LeaveWorkspace from "@/components/payroll/LeaveWorkspace";
export default function WorkerLeavePage() {
  return (
    <AppShell role="WORKER">
      <LeaveWorkspace role="WORKER" />
    </AppShell>
  );
}
