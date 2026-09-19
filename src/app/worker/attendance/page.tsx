import AppShell from "@/components/shell/AppShell";
import AttendanceWorkspace from "@/components/operations/AttendanceWorkspace";
export default function WorkerAttendancePage() {
  return (
    <AppShell role="WORKER">
      <AttendanceWorkspace role="WORKER" />
    </AppShell>
  );
}
