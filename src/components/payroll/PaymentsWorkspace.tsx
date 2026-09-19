"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  Plus,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetWorkerEarningsQuery,
  useListPaymentsQuery,
} from "@/redux/features/payroll/payrollApi";
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

const methods = ["Cash", "Bank_Transfer", "Mobile_Banking", "Other"] as const;
const schema = z.object({
  workerId: z.string().min(1, "Choose a worker"),
  projectId: z.string().min(1, "Choose a project"),
  amount: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      "Enter a positive whole amount",
    ),
  method: z.enum(methods),
  reference: z.string().optional(),
  note: z.string().optional(),
});
function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function PaymentsWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canRecord = role !== "WORKER";
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");
  const { data: workersData } = useListWorkersQuery(
    canRecord
      ? projectId
        ? `projectId=${projectId}&limit=100`
        : "limit=100"
      : "",
  );
  const workers = workersData?.data ?? [];
  const ownWorker = workers[0];
  const ownWorkerId = ownWorker?.workerId || "";
  const [workerId, setWorkerId] = useState("");
  const activeWorkerId = canRecord ? workerId : ownWorkerId;
  const {
    data: paymentsData,
    isLoading,
    isError,
    refetch,
  } = useListPaymentsQuery(
    canRecord
      ? projectId
        ? `projectId=${projectId}`
        : ""
      : activeWorkerId
        ? `workerId=${activeWorkerId}`
        : "",
    { skip: !canRecord && !activeWorkerId },
  );
  const { data: earningsData, isLoading: earningsLoading } =
    useGetWorkerEarningsQuery(
      { workerId: activeWorkerId },
      { skip: !activeWorkerId },
    );
  const [createPayment, { isLoading: recording }] = useCreatePaymentMutation();
  const [deletePayment, { isLoading: reversing }] = useDeletePaymentMutation();
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { method: "Cash", amount: "" },
  });
  const payments = paymentsData?.data ?? [];
  const earnings = earningsData?.data;
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createPayment({
        ...values,
        amount: Number(values.amount),
      }).unwrap();
      reset({
        workerId: "",
        projectId: values.projectId,
        method: "Cash",
        amount: "",
        reference: "",
        note: "",
      });
      setShowForm(false);
    } catch (error) {
      setError("root", {
        message: errorMessage(error, "Payment could not be recorded."),
      });
    }
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Payroll
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {canRecord ? "Payments" : "My earnings"}
          </h1>
          <p className="mt-2 text-slate-500">
            {canRecord
              ? "Record payments and monitor outstanding balances."
              : "Your attendance-based earnings and payment history."}
          </p>
        </div>
        {canRecord && (
          <button
            className="btn-primary"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={17} />
            {showForm ? "Close form" : "Record payment"}
          </button>
        )}
      </div>
      {!canRecord && earningsLoading ? (
        <div className="card-surface h-32 animate-pulse rounded-[9px] bg-slate-100" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-surface rounded-[9px] p-5">
            <Wallet className="text-amber-600" size={19} />
            <p className="mt-3 text-sm text-slate-500">Current earnings</p>
            <p className="mt-1 text-2xl font-semibold">
              {earnings?.currentEarnings ?? ownWorker?.currentEarnings ?? 0}
            </p>
          </div>
          <div className="card-surface rounded-[9px] p-5">
            <CircleDollarSign className="text-green-600" size={19} />
            <p className="mt-3 text-sm text-slate-500">All-time earnings</p>
            <p className="mt-1 text-2xl font-semibold">
              {earnings?.allTimeEarnings ?? ownWorker?.allTimeEarnings ?? 0}
            </p>
          </div>
          <div className="card-surface rounded-[9px] p-5">
            <Banknote className="text-red-600" size={19} />
            <p className="mt-3 text-sm text-slate-500">Outstanding balance</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">
              {earnings?.outstandingAmount ?? ownWorker?.outstandingAmount ?? 0}
            </p>
          </div>
        </div>
      )}
      {showForm && (
        <section className="card-surface rounded-[9px] p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <label className="form-label" htmlFor="projectId">
                Project
              </label>
              <select
                id="projectId"
                className="form-input"
                {...register("projectId")}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  register("projectId").onChange(event);
                }}
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
              <label className="form-label" htmlFor="workerId">
                Worker
              </label>
              <select
                id="workerId"
                className="form-input"
                {...register("workerId")}
                onChange={(event) => {
                  setWorkerId(event.target.value);
                  register("workerId").onChange(event);
                }}
              >
                <option value="">Select worker</option>
                {workers.map((worker: any) => (
                  <option key={worker.workerId} value={worker.workerId}>
                    {worker.worker?.userName || worker.workerId} · outstanding{" "}
                    {worker.outstandingAmount || 0}
                  </option>
                ))}
              </select>
              {errors.workerId && (
                <p className="form-error">{errors.workerId.message}</p>
              )}
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
              <label className="form-label" htmlFor="method">
                Method
              </label>
              <select
                id="method"
                className="form-input"
                {...register("method")}
              >
                {methods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
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
              <label className="form-label" htmlFor="note">
                Note
              </label>
              <input id="note" className="form-input" {...register("note")} />
            </div>
            {errors.root && (
              <p className="text-sm text-red-700 md:col-span-3">
                {errors.root.message}
              </p>
            )}
            <div className="md:col-span-3">
              <button
                className="btn-primary"
                disabled={recording}
                type="submit"
              >
                {recording ? "Recording..." : "Save payment"}
              </button>
            </div>
          </form>
        </section>
      )}
      {canRecord && (
        <div className="max-w-sm">
          <label className="form-label" htmlFor="filter-project">
            Filter project
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
      )}
      {isLoading ? (
        <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Payments could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
          No payments found.
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-[9px]">
          <div className="divide-y divide-slate-100">
            {payments.map((payment: any) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {payment.worker?.userName || "Worker payment"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {payment.project?.projectName || payment.projectId} ·{" "}
                    {payment.method}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {Number(payment.amount).toLocaleString()}
                  </span>
                  {role === "ADMIN" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Reverse payment"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reverse this payment?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This deletes the payment and restores the
                            worker&apos;s outstanding balance.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            disabled={reversing}
                            onClick={() => deletePayment(payment.id)}
                          >
                            {reversing ? "Reversing..." : "Reverse payment"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
