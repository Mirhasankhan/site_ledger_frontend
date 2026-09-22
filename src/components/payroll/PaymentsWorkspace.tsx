"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "react-toastify";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetWorkerEarningsQuery,
  useListPaymentsQuery,
  useCreateWithdrawMutation,
  useGetWorkerWithdrawsQuery,
  useListAllWithdrawsQuery,
  useReviewWithdrawMutation,
  useGetStripeConnectStatusQuery,
  useGetStripeOnboardingLinkMutation,
} from "@/redux/features/payroll/payrollApi";
import { useProfileQuery } from "@/redux/features/auth/authApi";
import { useCurrentUser } from "@/redux/features/auth/authSlice";
import { useAppSelector } from "@/redux/hooks";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Schema for issuing worker payment (adds to worker earnings)
const schema = z.object({
  workerId: z.string().min(1, "Choose a worker"),
  projectId: z.string().min(1, "Choose a project"),
  amount: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      "Enter a positive whole amount",
    ),
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

  // Navigation tab: "payments" (Earnings) or "withdraws" (Stripe Withdrawals)
  const [activeTab, setActiveTab] = useState<"payments" | "withdraws">("payments");

  // Profile data
  const { data: profileData } = useProfileQuery(undefined);
  const profile = profileData?.data || profileData?.result;

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
  const currentUser = useAppSelector(useCurrentUser);
  const workers = workersData?.data ?? [];
  const ownWorker = workers[0];
  const ownWorkerId =
    (role === "WORKER"
      ? currentUser?.id || profile?.id || ownWorker?.workerId
      : ownWorker?.workerId || profile?.id) || "";

  const [workerId, setWorkerId] = useState("");
  const activeWorkerId = canRecord ? workerId : ownWorkerId;

  // Payments / Earning Credits Query
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    isError: paymentsError,
    refetch: refetchPayments,
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

  // Worker live earnings
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useGetWorkerEarningsQuery(
    { workerId: activeWorkerId },
    { skip: !activeWorkerId },
  );

  const [createPayment, { isLoading: recording }] = useCreatePaymentMutation();
  const [deletePayment, { isLoading: reversing }] = useDeletePaymentMutation();
  const [showForm, setShowForm] = useState(false);

  // ── Worker Withdraw State & Queries ──────────────────────────────────────
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [createWithdraw, { isLoading: submittingWithdraw }] =
    useCreateWithdrawMutation();

  const {
    data: stripeStatusData,
    isLoading: stripeStatusLoading,
  } = useGetStripeConnectStatusQuery(ownWorkerId, {
    skip: role !== "WORKER" || !ownWorkerId,
  });
  const stripeStatus = stripeStatusData?.data;

  const [getStripeOnboardingLink, { isLoading: generatingLink }] =
    useGetStripeOnboardingLinkMutation();

  const {
    data: workerWithdrawsData,
    isLoading: workerWithdrawsLoading,
    isError: workerWithdrawsError,
    refetch: refetchWorkerWithdraws,
  } = useGetWorkerWithdrawsQuery(
    { workerId: ownWorkerId },
    { skip: role !== "WORKER" || !ownWorkerId },
  );
  const rawWithdraws = workerWithdrawsData?.data ?? workerWithdrawsData ?? [];
  const workerWithdraws = Array.isArray(rawWithdraws)
    ? rawWithdraws
    : Array.isArray(rawWithdraws?.data)
      ? rawWithdraws.data
      : [];

  // Computed metrics for worker
  const totalWithdrawn = workerWithdraws
    .filter((w: any) => w.status === "Accepted")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
  const pendingWithdrawn = workerWithdraws
    .filter((w: any) => w.status === "Pending")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
  const pendingWorkerWithdrawsCount = workerWithdraws.filter(
    (w: any) => w.status === "Pending",
  ).length;

  // ── Admin All Withdrawals Queries & State ────────────────────────────────
  const {
    data: allWithdrawsData,
    isLoading: allWithdrawsLoading,
    refetch: refetchAllWithdraws,
  } = useListAllWithdrawsQuery("", { skip: role === "WORKER" });
  const allWithdraws = allWithdrawsData?.data ?? [];
  const pendingWithdrawsCount = allWithdraws.filter(
    (w: any) => w.status === "Pending",
  ).length;

  const [reviewWithdraw, { isLoading: reviewingWithdraw }] =
    useReviewWithdrawMutation();

  // Approve Dialog State
  const [approveTarget, setApproveTarget] = useState<any | null>(null);

  // Reject Dialog State
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", reference: "", note: "" },
  });

  const payments = paymentsData?.data ?? [];
  const earnings = earningsData?.data;
  const currentEarnings =
    earnings?.currentEarnings ?? ownWorker?.currentEarnings ?? 0;

  // Handle Admin Giving Worker Payment (Credits to Earnings)
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createPayment({
        ...values,
        amount: Number(values.amount),
      }).unwrap();
      reset({
        workerId: "",
        projectId: values.projectId,
        amount: "",
        reference: "",
        note: "",
      });
      setShowForm(false);
      toast.success("Worker payment credited to earnings balance!");
    } catch (error) {
      setError("root", {
        message: errorMessage(error, "Payment could not be recorded."),
      });
    }
  };

  // Connect Stripe handler for worker
  const handleConnectStripe = async () => {
    try {
      const res = await getStripeOnboardingLink(ownWorkerId).unwrap();
      if (res?.data?.url) {
        toast.info("Redirecting to Stripe to connect your payout account...");
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(errorMessage(err, "Failed to generate Stripe onboarding link"));
    }
  };

  // Submit withdrawal request handler for worker
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (amountNum > currentEarnings) {
      toast.error(
        `Withdrawal amount cannot exceed your current earnings ($${currentEarnings.toLocaleString()})`,
      );
      return;
    }

    try {
      const res = await createWithdraw({
        workerId: ownWorkerId,
        amount: amountNum,
      }).unwrap();

      if (res?.data?.requiresOnboarding && res?.data?.onboardingUrl) {
        toast.warn(
          "Stripe payout account not connected yet. Redirecting to Stripe onboarding...",
        );
        window.location.href = res.data.onboardingUrl;
        return;
      }

      toast.success(
        res?.message || "Withdrawal request submitted! Pending administrator review.",
      );
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      refetchEarnings();
      refetchWorkerWithdraws();
    } catch (err: any) {
      toast.error(errorMessage(err, "Failed to submit withdrawal request"));
    }
  };

  // Admin Approve & Transfer
  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    try {
      const res = await reviewWithdraw({
        workerId: approveTarget.workerId,
        withdrawId: approveTarget.id,
        body: { status: "Accepted" },
      }).unwrap();

      toast.success(
        res?.message || "Withdrawal approved and funds transferred via Stripe!",
      );
      setApproveTarget(null);
      refetchAllWithdraws();
    } catch (err: any) {
      toast.error(
        errorMessage(err, "Failed to approve withdrawal and transfer funds"),
      );
    }
  };

  // Admin Reject
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await reviewWithdraw({
        workerId: rejectTarget.workerId,
        withdrawId: rejectTarget.id,
        body: { status: "Rejected", note: rejectNote.trim() || undefined },
      }).unwrap();

      toast.success(res?.message || "Withdrawal request rejected.");
      setRejectTarget(null);
      setRejectNote("");
      refetchAllWithdraws();
    } catch (err: any) {
      toast.error(errorMessage(err, "Failed to reject withdrawal"));
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Payroll & Finance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {canRecord ? "Worker Payments & Withdrawals" : "My Earnings & Withdrawals"}
          </h1>
          <p className="mt-2 text-slate-500">
            {canRecord
              ? "Credit worker earnings for project work and review withdrawal payout requests."
              : "Track your earnings history, manage your Stripe payout account, and withdraw funds."}
          </p>
        </div>

        {/* Worker Action Buttons */}
        {!canRecord && (
          <div className="flex flex-wrap items-center gap-3">
            {stripeStatus?.isConnected && stripeStatus?.detailsSubmitted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Stripe Connected
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={generatingLink || stripeStatusLoading}
                className="btn-secondary text-xs"
              >
                {generatingLink ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CreditCard size={15} />
                )}
                Connect Stripe
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="btn-primary text-xs"
            >
              <ArrowUpRight size={16} />
              Request Withdrawal
            </button>
          </div>
        )}

        {/* Admin Action Button */}
        {canRecord && activeTab === "payments" && (
          <button
            className="btn-primary"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={17} />
            {showForm ? "Close form" : "Credit Worker Earnings"}
          </button>
        )}
      </div>

      {/* ── Worker Earnings Overview Cards ────────────────────────────────────── */}
      {!canRecord && (
        <div className="space-y-4">
          {earningsLoading ? (
            <div className="card-surface h-32 animate-pulse rounded-[9px] bg-slate-100" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Withdrawable Balance */}
              <div className="card-surface rounded-[9px] p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <Wallet className="text-amber-600" size={20} />
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-xs font-semibold text-amber-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Withdraw <ArrowUpRight size={13} />
                  </button>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Available to Withdraw
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${Number(currentEarnings).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Transfers directly to your bank via Stripe
                </p>
              </div>

              {/* All-time Earnings */}
              <div className="card-surface rounded-[9px] p-5">
                <CircleDollarSign className="text-emerald-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total Lifetime Earned
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${Number(earnings?.allTimeEarnings ?? ownWorker?.allTimeEarnings ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  All earnings credited from projects
                </p>
              </div>

              {/* Total Withdrawn via Stripe */}
              <div className="card-surface rounded-[9px] p-5">
                <Banknote className="text-blue-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Paid Out via Stripe
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${Number(totalWithdrawn).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Total successfully transferred to bank
                </p>
              </div>

              {/* Pending Withdrawals */}
              <div className="card-surface rounded-[9px] p-5">
                <History className="text-amber-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Pending Review
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  ${Number(pendingWithdrawn).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Awaiting administrator approval
                </p>
              </div>
            </div>
          )}

          {/* Stripe Account Status Alert for Worker */}
          {!(stripeStatus?.isConnected && stripeStatus?.detailsSubmitted) && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 text-amber-600 shrink-0" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">
                    Stripe Payout Account Required
                  </h4>
                  <p className="mt-0.5 text-xs text-amber-800">
                    To withdraw your earnings directly to your bank account, please connect your Stripe account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={generatingLink || stripeStatusLoading}
                className="btn-secondary self-start sm:self-center shrink-0 text-xs bg-white hover:bg-slate-50 border-amber-300 text-amber-900"
              >
                {generatingLink ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} />
                )}
                Connect Stripe Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Universal Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "payments"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Banknote size={16} />
          {canRecord ? "Worker Earnings Credited" : "Earnings History"}
        </button>
        <button
          onClick={() => setActiveTab("withdraws")}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "withdraws"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Wallet size={16} />
          {canRecord ? "Withdrawal Requests" : "Withdrawal History"}
          {canRecord && pendingWithdrawsCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {pendingWithdrawsCount}
            </span>
          )}
          {!canRecord && pendingWorkerWithdrawsCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
              {pendingWorkerWithdrawsCount} pending
            </span>
          )}
        </button>
      </div>

      {/* ── Admin: Credit Worker Earnings Form ──────────────────────────────── */}
      {canRecord && activeTab === "payments" && showForm && (
        <section className="card-surface rounded-[9px] p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Issue Worker Payment (Credit to Earnings)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Credits the selected worker&apos;s earnings balance for project labor. The worker can then withdraw their funds via Stripe.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <label className="form-label" htmlFor="projectId">
                Project *
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
                Worker *
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
                    ${worker.outstandingAmount || 0}
                  </option>
                ))}
              </select>
              {errors.workerId && (
                <p className="form-error">{errors.workerId.message}</p>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="amount">
                Amount ($) *
              </label>
              <input
                id="amount"
                type="number"
                placeholder="e.g. 500"
                className="form-input"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="form-error">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="reference">
                Reference / Task Code (Optional)
              </label>
              <input
                id="reference"
                placeholder="e.g. TASK-102 or Foundation-Shift"
                className="form-input"
                {...register("reference")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label" htmlFor="note">
                Note / Description (Optional)
              </label>
              <input
                id="note"
                placeholder="e.g. Overtime pay for milestone 2"
                className="form-input"
                {...register("note")}
              />
            </div>

            <div className="md:col-span-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                All payouts occur exclusively via Stripe Connect. Crediting this payment increases the worker&apos;s available earnings balance and settles their outstanding balance.
              </span>
            </div>

            {errors.root && (
              <p className="text-sm text-red-700 md:col-span-3">
                {errors.root.message}
              </p>
            )}

            <div className="flex gap-3 md:col-span-3 pt-2">
              <button
                type="submit"
                disabled={recording}
                className="btn-primary"
              >
                {recording ? "Crediting Earnings..." : "Confirm & Credit Earnings"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Admin Project Filter (When viewing Earnings Credited) ───────────── */}
      {canRecord && activeTab === "payments" && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="filter-project"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0"
          >
            Filter by Project:
          </label>
          <select
            id="filter-project"
            className="form-input max-w-xs"
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

      {/* ── Tab Content 1: Earnings History / Worker Earnings Credited ───────── */}
      {activeTab === "payments" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {canRecord ? "Worker Earnings Credited" : "My Earnings History"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {canRecord
                  ? "History of all labor payments and wage allocations credited to worker accounts."
                  : "All payments and earnings credited to your account for project assignments and approved labor."}
              </p>
            </div>
            <button
              onClick={() => refetchPayments()}
              className="btn-secondary text-xs"
            >
              Refresh
            </button>
          </div>

          {paymentsLoading ? (
            <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
          ) : paymentsError ? (
            <div className="card-surface rounded-[9px] p-8 text-center">
              <AlertCircle className="mx-auto text-red-600" size={24} />
              <p className="mt-3 font-semibold">Earnings history could not be loaded</p>
              <button className="mt-4 btn-secondary" onClick={() => refetchPayments()}>
                Try again
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
              {canRecord
                ? "No worker payments credited yet. Click 'Credit Worker Earnings' above to issue payment."
                : "No earnings credited to your account yet."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="card-surface rounded-[9px] p-5 flex flex-col justify-between border border-slate-100 hover:border-slate-200 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {canRecord
                              ? payment.worker?.userName || "Worker"
                              : payment.project?.projectName || "Project Work"}
                          </p>
                          {payment.reference && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                              Ref: {payment.reference}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {canRecord
                            ? `${payment.project?.projectName || "Project"} · Credited on ${new Date(payment.createdAt).toLocaleDateString()}`
                            : `Credited on ${new Date(payment.createdAt).toLocaleDateString()}`}
                          {payment.recordedBy?.userName && (
                            <span> · by {payment.recordedBy.userName}</span>
                          )}
                        </p>
                      </div>

                      <span className="font-bold text-lg text-emerald-700 shrink-0">
                        +${Number(payment.amount).toLocaleString()}
                      </span>
                    </div>

                    {payment.note && (
                      <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600 italic">
                        Note: {payment.note}
                      </p>
                    )}
                  </div>

                  {role === "ADMIN" && canRecord && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 transition"
                            title="Reverse payment credit"
                            aria-label="Reverse payment"
                          >
                            <RotateCcw size={13} />
                            Reverse
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Reverse this payment credit?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the payment credit, decrement the worker&apos;s earnings balance, and restore their outstanding balance.
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab Content 2: Worker Withdrawal History ────────────────────────── */}
      {!canRecord && activeTab === "withdraws" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                My Withdrawal History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All earnings payout requests transferred directly to your connected Stripe account.
              </p>
            </div>
            <button
              onClick={() => refetchWorkerWithdraws()}
              className="btn-secondary text-xs"
            >
              Refresh
            </button>
          </div>

          {workerWithdrawsLoading ? (
            <div className="card-surface h-40 animate-pulse rounded-[9px] bg-slate-100" />
          ) : workerWithdrawsError ? (
            <div className="card-surface rounded-[9px] p-8 text-center">
              <AlertCircle className="mx-auto text-red-600" size={24} />
              <p className="mt-3 font-semibold text-slate-800">Withdrawals could not be loaded</p>
              <button
                className="mt-4 btn-secondary text-xs"
                onClick={() => refetchWorkerWithdraws()}
              >
                Try again
              </button>
            </div>
          ) : workerWithdraws.length === 0 ? (
            <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
              No withdrawal requests submitted yet. Click &ldquo;Request Withdrawal&rdquo; above to cash out your available earnings.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {workerWithdraws.map((w: any) => (
                <div
                  key={w.id}
                  className="card-surface rounded-[9px] p-5 flex flex-col justify-between border border-slate-100 hover:border-slate-200 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-xl text-slate-900">
                          ${Number(w.amount).toLocaleString()}
                        </span>
                        <p className="mt-1 text-xs text-slate-500">
                          Requested on {new Date(w.createdAt).toLocaleDateString()} at{" "}
                          {new Date(w.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                          w.status === "Accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {w.status === "Accepted" ? "Transferred via Stripe" : w.status}
                      </span>
                    </div>

                    {w.transferId && (
                      <p className="mt-3 rounded-md bg-emerald-50 border border-emerald-100 p-2 text-xs text-emerald-800 font-mono">
                        Stripe Transfer ID: {w.transferId}
                      </p>
                    )}
                    {w.note && (
                      <p className="mt-2.5 rounded-md bg-slate-50 p-2 text-xs text-slate-600 italic">
                        Admin Note: {w.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab Content 2: Admin Withdrawal Requests Management ─────────────── */}
      {canRecord && activeTab === "withdraws" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Worker Withdrawal Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review worker payout requests and execute direct Stripe transfers to their connected accounts.
              </p>
            </div>
            <button
              onClick={() => refetchAllWithdraws()}
              className="btn-secondary text-xs"
            >
              Refresh Requests
            </button>
          </div>

          {allWithdrawsLoading ? (
            <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
          ) : allWithdraws.length === 0 ? (
            <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
              No withdrawal requests submitted.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {allWithdraws.map((w: any) => {
                const workerUser = w.worker;
                const workerProfile = workerUser?.workerProfile;
                const isStripeConnected = !!workerProfile?.stripeAccountId;

                return (
                  <div
                    key={w.id}
                    className="card-surface rounded-[9px] p-5 flex flex-col justify-between border border-slate-100 hover:border-slate-200 transition shadow-sm gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        {workerUser?.profileImage ? (
                          <Image
                            src={workerUser.profileImage}
                            alt={workerUser?.userName || "Worker"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-slate-600">
                            {(workerUser?.userName || "W").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {workerUser?.userName || "Worker"}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              w.status === "Accepted"
                                ? "bg-emerald-100 text-emerald-800"
                                : w.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {w.status}
                          </span>
                          {isStripeConnected ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                              <CreditCard size={11} className="text-emerald-600" />
                              Stripe Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                              No Stripe
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {workerUser?.email} · {workerProfile?.project?.projectName || "No Project"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            Requested:{" "}
                            <strong className="text-slate-900 font-bold text-sm">
                              ${Number(w.amount).toLocaleString()}
                            </strong>
                          </span>
                          <span>
                            Balance: ${Number(workerProfile?.currentEarnings ?? 0).toLocaleString()}
                          </span>
                          <span>
                            {new Date(w.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {w.transferId && (
                          <p className="mt-2 text-xs text-emerald-700 font-mono bg-emerald-50 rounded p-1.5 border border-emerald-100">
                            Transfer ID: {w.transferId}
                          </p>
                        )}
                        {w.note && (
                          <p className="mt-1 text-xs text-slate-600 italic">
                            Note: {w.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {w.status === "Pending" && (
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-end">
                        <button
                          onClick={() => setApproveTarget(w)}
                          disabled={!isStripeConnected}
                          title={
                            !isStripeConnected
                              ? "Worker has not connected a Stripe account"
                              : "Approve and execute Stripe transfer"
                          }
                          className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve & Transfer
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(w);
                            setRejectNote("");
                          }}
                          className="btn-secondary text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Worker Request Withdrawal Modal ─────────────────────────────────── */}
      <Dialog
        open={isWithdrawModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Earnings Withdrawal</DialogTitle>
            <DialogDescription>
              Transfer your earned funds directly to your connected Stripe bank account.
            </DialogDescription>
          </DialogHeader>

          {!(stripeStatus?.isConnected && stripeStatus?.detailsSubmitted) ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
                <p className="font-semibold text-amber-900">
                  Stripe Account Setup Required
                </p>
                <p>
                  You haven&apos;t connected your Stripe payout account yet. Please complete onboarding with Stripe to provide your banking details.
                </p>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={generatingLink}
                  className="btn-primary w-full text-xs"
                >
                  {generatingLink ? (
                    <Loader2 size={15} className="animate-spin mr-1" />
                  ) : (
                    <CreditCard size={15} className="mr-1" />
                  )}
                  Connect with Stripe
                </button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Available Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${Number(currentEarnings).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(currentEarnings))}
                  className="btn-secondary text-xs"
                >
                  Max
                </button>
              </div>

              <div>
                <label className="form-label" htmlFor="withdraw-amount">
                  Withdrawal Amount ($)
                </label>
                <input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={currentEarnings}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="form-input"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Funds will be transferred to your connected Stripe account upon admin approval.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw || Number(withdrawAmount) <= 0}
                  className="btn-primary text-xs"
                >
                  {submittingWithdraw ? (
                    <>
                      <Loader2 size={15} className="animate-spin mr-1" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Admin Approve Withdrawal Dialog ─────────────────────────────────── */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve & Transfer Funds</DialogTitle>
            <DialogDescription>
              This will execute a Stripe transfer of{" "}
              <strong className="text-slate-900 font-semibold">
                ${Number(approveTarget?.amount ?? 0).toLocaleString()}
              </strong>{" "}
              directly to {approveTarget?.worker?.userName}&apos;s connected Stripe account and decrement their earnings balance.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              Connected Stripe Account: {approveTarget?.worker?.workerProfile?.stripeAccountId}
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setApproveTarget(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reviewingWithdraw}
              onClick={handleConfirmApprove}
              className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              {reviewingWithdraw ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-1" />
                  Transferring via Stripe...
                </>
              ) : (
                "Confirm & Transfer Funds"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin Reject Withdrawal Dialog ──────────────────────────────────── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              Reject the withdrawal request of ${Number(rejectTarget?.amount ?? 0).toLocaleString()} for {rejectTarget?.worker?.userName}.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="form-label" htmlFor="reject-note">
              Reason / Note (Optional)
            </label>
            <textarea
              id="reject-note"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Incomplete timesheet verification..."
              className="form-input"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reviewingWithdraw}
              onClick={handleConfirmReject}
              className="btn-primary text-xs bg-red-600 hover:bg-red-700"
            >
              {reviewingWithdraw ? "Rejecting..." : "Reject Request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
