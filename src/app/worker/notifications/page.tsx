import AppShell from "@/components/shell/AppShell";
import NotificationsUnavailable from "@/components/collaboration/NotificationsUnavailable";
export default function WorkerNotificationsPage() {
  return (
    <AppShell role="WORKER">
      <NotificationsUnavailable />
    </AppShell>
  );
}
