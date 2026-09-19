import AppShell from "@/components/shell/AppShell";
import NotificationsUnavailable from "@/components/collaboration/NotificationsUnavailable";
export default function ManagerNotificationsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <NotificationsUnavailable />
    </AppShell>
  );
}
