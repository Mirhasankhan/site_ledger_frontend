"use client";

import {
  AlertCircle,
  ArrowDownRight,
  CircleDollarSign,
  WalletCards,
} from "lucide-react";
import { useGetBudgetSummaryQuery } from "@/redux/features/projects/projectApi";

export default function BudgetSummary({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } =
    useGetBudgetSummaryQuery(projectId);
  const summary = data?.data;
  if (isLoading)
    return (
      <div className="card-surface h-36 animate-pulse rounded-[9px] bg-slate-100" />
    );
  if (isError || !summary)
    return (
      <div className="card-surface rounded-[9px] p-5 text-sm">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={17} />
          Budget summary unavailable
        </div>
        <button className="mt-3 btn-secondary" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  const budget = Number(summary.budget ?? 0);
  const spent = Number(summary.spent ?? summary.totalSpent ?? 0);
  const remaining = Number(summary.remaining ?? budget - spent);
  return (
    <section className="card-surface rounded-[9px] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Budget summary</p>
          <h2 className="mt-1 text-lg font-semibold">Project finances</h2>
        </div>
        <WalletCards className="text-amber-600" size={21} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Budget</p>
          <p className="mt-1 text-xl font-semibold">
            {budget.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Spent</p>
          <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-red-700">
            <ArrowDownRight size={17} />
            {spent.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Remaining</p>
          <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-green-700">
            <CircleDollarSign size={17} />
            {remaining.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-amber-500"
          style={{
            width: `${budget ? Math.min((spent / budget) * 100, 100) : 0}%`,
          }}
        />
      </div>
    </section>
  );
}
