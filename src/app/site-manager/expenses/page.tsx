import AppShell from "@/components/shell/AppShell";
import ExpensesWorkspace from "@/components/finance/ExpensesWorkspace";
export default function ManagerExpensesPage() {
  return (
    <AppShell role="SITE_MANAGER">
      <ExpensesWorkspace role="SITE_MANAGER" />
    </AppShell>
  );
}
