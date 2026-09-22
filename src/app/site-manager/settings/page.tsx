import AppShell from "@/components/shell/AppShell";
import SettingsWorkspace from "@/components/settings/SettingsWorkspace";

export default function SiteManagerSettingsPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <SettingsWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
