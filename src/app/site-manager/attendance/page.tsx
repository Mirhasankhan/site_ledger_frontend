import AppShell from "@/components/shell/AppShell";
import AttendanceWorkspace from "@/components/operations/AttendanceWorkspace";
export default function ManagerAttendancePage() {
  return (
    <AppShell role="SITE_MANAGER">
      <AttendanceWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
