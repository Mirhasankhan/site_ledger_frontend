import AppShell from "@/components/shell/AppShell";
import LeaveWorkspace from "@/components/payroll/LeaveWorkspace";
export default function ManagerLeavePage() {
  return (
    <AppShell role="SITE_MANAGER">
      <LeaveWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
