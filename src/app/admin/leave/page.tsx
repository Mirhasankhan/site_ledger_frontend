import AppShell from "@/components/shell/AppShell";
import LeaveWorkspace from "@/components/payroll/LeaveWorkspace";
export default function AdminLeavePage() {
  return (
    <AppShell role="ADMIN">
      <LeaveWorkspace role="ADMIN" />
    </AppShell>
  );
}
