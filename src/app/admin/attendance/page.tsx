import AppShell from "@/components/shell/AppShell";
import AttendanceWorkspace from "@/components/operations/AttendanceWorkspace";
export default function AdminAttendancePage() {
  return (
    <AppShell role="ADMIN">
      <AttendanceWorkspace role="ADMIN" />
    </AppShell>
  );
}
