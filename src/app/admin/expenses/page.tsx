import AppShell from "@/components/shell/AppShell";
import ExpensesWorkspace from "@/components/finance/ExpensesWorkspace";
export default function AdminExpensesPage() {
  return (
    <AppShell role="ADMIN">
      <ExpensesWorkspace role="ADMIN" />
    </AppShell>
  );
}
