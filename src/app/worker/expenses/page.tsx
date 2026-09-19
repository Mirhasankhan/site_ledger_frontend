import AppShell from "@/components/shell/AppShell";
import ExpensesWorkspace from "@/components/finance/ExpensesWorkspace";
export default function WorkerExpensesPage() {
  return (
    <AppShell role="WORKER">
      <ExpensesWorkspace role="WORKER" />
    </AppShell>
  );
}
