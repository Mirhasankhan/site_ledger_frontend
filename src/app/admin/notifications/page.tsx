import AppShell from "@/components/shell/AppShell";
import NotificationsUnavailable from "@/components/collaboration/NotificationsUnavailable";
export default function AdminNotificationsPage() {
  return (
    <AppShell role="ADMIN">
      <NotificationsUnavailable />
    </AppShell>
  );
}
