import AppShell from "@/components/shell/AppShell";
import SettingsWorkspace from "@/components/settings/SettingsWorkspace";

export default function WorkerSettingsPage() {
  return (
    <AppShell role="WORKER">
      <SettingsWorkspace role="WORKER" />
    </AppShell>
  );
}
