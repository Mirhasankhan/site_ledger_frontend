import AppShell from "@/components/shell/AppShell";
import ChatWorkspace from "@/components/collaboration/ChatWorkspace";
export default function ManagerChatPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <ChatWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
