import AppShell from "@/components/shell/AppShell";
import SettingsWorkspace from "@/components/settings/SettingsWorkspace";

export default function AdminSettingsPage() {
  return (
    <AppShell role="ADMIN">
      <SettingsWorkspace role="ADMIN" />
    </AppShell>
  );
}
