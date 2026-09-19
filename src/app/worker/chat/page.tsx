import AppShell from "@/components/shell/AppShell";
import ChatWorkspace from "@/components/collaboration/ChatWorkspace";
export default function WorkerChatPage() {
  return (
    <AppShell role="WORKER">
      <ChatWorkspace role="WORKER" />
    </AppShell>
  );
}
