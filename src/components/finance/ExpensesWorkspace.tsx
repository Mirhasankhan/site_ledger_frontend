"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useListProjectsQuery } from "@/redux/features/projects/projectApi";
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useListExpensesQuery,
  useReviewExpenseMutation,
} from "@/redux/features/finance/financeApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categories = [
  "Labor",
  "Materials",
  "Transportation",
  "Equipment_Rental",
  "Food",
  "Accommodation",
  "Miscellaneous",
] as const;
const schema = z.object({
  projectId: z.string().min(1, "Choose a project"),
  title: z.string().min(1, "Title is required"),
  category: z.enum(categories),
  amount: z
    .string()
    .refine((value) => Number(value) > 0, "Amount must be positive"),
  date: z.string().optional(),
  vendor: z.string().optional(),
  reference: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const statuses = ["Approved", "Rejected", "Paid"] as const;
function message(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function ExpensesWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canManage = role !== "WORKER";
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");
  const { data, isLoading, isError, refetch } = useListExpensesQuery(
    projectId ? `projectId=${projectId}` : "",
  );
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [reviewExpense, { isLoading: reviewing }] = useReviewExpenseMutation();
  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation();
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState("");
  const expenses = data?.data ?? [];
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: "",
      category: "Materials",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });
  const onSubmit = async (values: Values) => {
    try {
      await createExpense({
        ...values,
        amount: Number(values.amount),
        projectId: values.projectId,
        date: values.date || undefined,
      }).unwrap();
      reset({
        projectId: values.projectId,
        category: "Materials",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setProjectId(values.projectId);
      setShowForm(false);
    } catch (error) {
      setError("root", {
        message: message(error, "Expense could not be recorded."),
      });
    }
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Financial controls
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="mt-2 text-slate-500">
            Record, review, and track project spend.
          </p>
        </div>
        {canManage && (
          <button
            className="btn-primary"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={17} />
            {showForm ? "Close form" : "Record expense"}
          </button>
        )}
      </div>
      {showForm && (
        <section className="card-surface rounded-[9px] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="form-label" htmlFor="projectId">
                  Project
                </label>
                <select
                  id="projectId"
                  className="form-input"
                  {...register("projectId")}
                >
                  <option value="">Select project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="form-error">{errors.projectId.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  className="form-input"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="form-input"
                  {...register("category")}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="amount">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  className="form-input"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="form-error">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  {...register("date")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="vendor">
                  Vendor
                </label>
                <input
                  id="vendor"
                  className="form-input"
                  {...register("vendor")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="reference">
                  Reference
                </label>
                <input
                  id="reference"
                  className="form-input"
                  {...register("reference")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="receiptUrl">
                  Receipt URL
                </label>
                <input
                  id="receiptUrl"
                  className="form-input"
                  {...register("receiptUrl")}
                />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="form-input min-h-20"
                {...register("notes")}
              />
            </div>
            {errors.root && (
              <p className="text-sm text-red-700">{errors.root.message}</p>
            )}
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Saving..." : "Save expense"}
            </button>
          </form>
        </section>
      )}
      <div className="max-w-sm">
        <label className="form-label" htmlFor="filter-project">
          Filter by project
        </label>
        <select
          id="filter-project"
          className="form-input"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="">All visible projects</option>
          {projects.map((project: any) => (
            <option key={project.id} value={project.id}>
              {project.projectName}
            </option>
          ))}
        </select>
      </div>
      {actionError && (
        <div className="rounded-[6px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {isLoading ? (
        <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Expenses could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center">
          <Receipt className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 font-semibold">No expenses found</p>
          <p className="mt-1 text-sm text-slate-500">
            Recorded expenses will appear here.
          </p>
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-[9px]">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Expense</span>
            <span>Project</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {expenses.map((expense: any) => (
            <div
              key={expense.id}
              className="table-row-hover flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] md:items-center"
            >
              <div>
                <p className="font-semibold">{expense.title}</p>
                <p className="text-xs text-slate-500">
                  {expense.category} · {expense.vendor || "No vendor"}
                </p>
              </div>
              <span className="text-sm text-slate-600">
                {expense.project?.projectName || expense.projectId}
              </span>
              <span className="text-sm font-semibold">
                {Number(expense.amount).toLocaleString()}
              </span>
              <span className="status-badge w-fit bg-slate-100 text-slate-700">
                {expense.status}
              </span>
              {canManage && (
                <div className="flex items-center gap-2">
                  <select
                    className="form-input max-w-28 text-xs"
                    defaultValue=""
                    disabled={reviewing}
                    onChange={async (event) => {
                      if (!event.target.value) return;
                      try {
                        await reviewExpense({
                          id: expense.id,
                          body: { status: event.target.value },
                        }).unwrap();
                      } catch (error) {
                        setActionError(
                          message(error, "Expense review failed."),
                        );
                      }
                    }}
                  >
                    <option value="">Review</option>
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this expense?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the expense record from the project
                          ledger.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleting}
                          onClick={() => deleteExpense(expense.id)}
                        >
                          {deleting ? "Deleting..." : "Delete expense"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
