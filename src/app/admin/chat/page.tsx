import AppShell from "@/components/shell/AppShell";
import ChatWorkspace from "@/components/collaboration/ChatWorkspace";
export default function AdminChatPage() {
  return (
    <AppShell role="ADMIN">
      <ChatWorkspace role="ADMIN" />
    </AppShell>
  );
}
