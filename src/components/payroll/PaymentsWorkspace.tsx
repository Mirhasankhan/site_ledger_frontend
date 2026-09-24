"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  History,
  Loader2,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useGetWorkerEarningsQuery,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function PaymentsWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canRecord = role !== "WORKER";

  // Navigation tab: "withdraws" (Stripe Payouts) or "overview" (Balances / Breakdown)
  const [activeTab, setActiveTab] = useState<"withdraws" | "overview">("withdraws");

  // Profile data
  const { data: profileData } = useProfileQuery(undefined);
  const profile = profileData?.data || profileData?.result;

  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");

  const {
    data: workersData,
    isLoading: workersLoading,
    refetch: refetchWorkers,
  } = useListWorkersQuery(
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

  // Worker live earnings (derived from verified attendance shifts)
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useGetWorkerEarningsQuery(
    { workerId: ownWorkerId },
    { skip: !ownWorkerId || role !== "WORKER" },
  );

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

  const earnings = earningsData?.data;
  const currentEarnings =
    earnings?.availableBalance ??
    earnings?.currentEarnings ??
    ownWorker?.currentEarnings ??
    0;

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
        `Withdrawal amount cannot exceed your available earnings ($${currentEarnings.toLocaleString()})`,
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

  // Admin Approve & Transfer via Stripe
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
      refetchWorkers();
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
      refetchWorkers();
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
            {canRecord ? "Payouts & Financial Operations" : "Earnings & Payouts"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {canRecord ? "Worker Payouts & Withdrawals" : "My Earnings & Payouts"}
          </h1>
          <p className="mt-2 text-slate-500">
            {canRecord
              ? "All worker compensation is paid exclusively via Stripe Connect. Review requests and audit attendance earnings."
              : "Attendance shifts automatically accrue earnings. Withdraw your available balance directly to your bank via Stripe Connect."}
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
                  <Loader2 size={15} className="animate-spin mr-1" />
                ) : (
                  <CreditCard size={15} className="mr-1" />
                )}
                Connect Stripe
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="btn-primary text-xs"
            >
              <ArrowUpRight size={16} className="mr-1" />
              Request Withdrawal
            </button>
          </div>
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
              <div className="card-surface rounded-[9px] p-5 border-l-4 border-l-amber-500 shadow-sm">
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
                  Earned from attendance, ready for Stripe payout
                </p>
              </div>

              {/* All-time Earnings */}
              <div className="card-surface rounded-[9px] p-5 shadow-sm">
                <CircleDollarSign className="text-emerald-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total Lifetime Earned
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${Number(earnings?.grossEarnings ?? earnings?.allTimeEarnings ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Cumulative verified attendance shifts
                </p>
              </div>

              {/* Total Withdrawn via Stripe */}
              <div className="card-surface rounded-[9px] p-5 shadow-sm">
                <Banknote className="text-blue-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Paid Out via Stripe
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ${Number(earnings?.totalWithdrawn ?? totalWithdrawn).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Direct transfers completed to bank
                </p>
              </div>

              {/* Pending Withdrawals */}
              <div className="card-surface rounded-[9px] p-5 shadow-sm">
                <History className="text-amber-600" size={20} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Pending Review
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  ${Number(earnings?.pendingWithdrawals ?? pendingWithdrawn).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Awaiting administrator review
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
                    To receive payouts from your attendance earnings, connect your Stripe account. There are no offline payments.
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
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <CreditCard size={14} className="mr-1" />
                )}
                Connect Stripe Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200">
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

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Banknote size={16} />
          {canRecord ? "Worker Balances & Accrued Earnings" : "Shift Earnings Breakdown"}
        </button>
      </div>

      {/* ── Admin: Withdrawal Requests Management ────────────────────────────── */}
      {canRecord && activeTab === "withdraws" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Stripe Withdrawal Requests
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
                            {w.status === "Accepted" ? "Settled via Stripe" : w.status}
                          </span>
                          {isStripeConnected ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                              <CreditCard size={11} className="text-emerald-600" />
                              Stripe Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                              No Stripe Account
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
                            Available: ${Number(workerProfile?.currentEarnings ?? 0).toLocaleString()}
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
                          Approve & Transfer via Stripe
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

      {/* ── Admin: Worker Balances & Accrued Earnings Overview ─────────────────── */}
      {canRecord && activeTab === "overview" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Worker Balances & Accrued Earnings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Earnings are accrued exclusively through verified attendance. Outstanding balances block worker removal.
              </p>
            </div>

            {/* Filter by Project */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-project"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0"
              >
                Project:
              </label>
              <select
                id="filter-project"
                className="form-input text-xs py-1.5 max-w-xs"
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
          </div>

          {workersLoading ? (
            <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
          ) : workers.length === 0 ? (
            <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
              No workers found in current project scope.
            </div>
          ) : (
            <div className="card-surface overflow-hidden rounded-[9px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Worker</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3 text-right">Daily Rate</th>
                      <th className="px-4 py-3 text-right">Lifetime Earned</th>
                      <th className="px-4 py-3 text-right">Available to Withdraw</th>
                      <th className="px-4 py-3 text-right">Outstanding (Project)</th>
                      <th className="px-4 py-3 text-center">Stripe Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workers.map((w: any) => {
                      const hasOutstanding = Number(w.outstandingAmount || 0) > 0;
                      return (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                                {(w.worker?.userName || "W").slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <p>{w.worker?.userName || "Unnamed"}</p>
                                <p className="text-[11px] text-slate-400 font-normal">{w.worker?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {w.workerCategory}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {w.project?.projectName || (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                            ${Number(w.dailyRate || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-slate-900">
                            ${Number(w.allTimeEarnings || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                            ${Number(w.currentEarnings || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold">
                            <span
                              className={
                                hasOutstanding ? "text-red-700" : "text-slate-500"
                              }
                            >
                              ${Number(w.outstandingAmount || 0).toLocaleString()}
                            </span>
                            {hasOutstanding && (
                              <p className="text-[10px] text-red-500 font-normal">
                                Removal locked
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {w.stripeAccountId ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Not Connected
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Worker: Withdrawal History ────────────────────────────────────────── */}
      {!canRecord && activeTab === "withdraws" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                My Withdrawal History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All earnings payouts transferred directly to your connected Stripe account.
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

      {/* ── Worker: Attendance Shift Earnings Breakdown ───────────────────────── */}
      {!canRecord && activeTab === "overview" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Attendance Shift Earnings Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every dollar in your account is calculated directly from your verified attendance records.
              </p>
            </div>
            <button
              onClick={() => refetchEarnings()}
              className="btn-secondary text-xs"
            >
              Refresh
            </button>
          </div>

          {earningsLoading ? (
            <div className="card-surface h-48 animate-pulse rounded-[9px] bg-slate-100" />
          ) : !earnings?.breakdown || earnings.breakdown.length === 0 ? (
            <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
              No verified attendance shifts recorded yet. As your manager records and verifies your attendance, your earnings will accrue here.
            </div>
          ) : (
            <div className="card-surface overflow-hidden rounded-[9px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Shift Status</th>
                      <th className="px-4 py-3 text-right">Base Pay</th>
                      <th className="px-4 py-3 text-right">Overtime</th>
                      <th className="px-4 py-3 text-right">Total Shift Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {earnings.breakdown.map((shift: any) => (
                      <tr key={shift.id || shift.date} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {new Date(shift.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {shift.projectName || "Assigned Project"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              shift.status === "Present"
                                ? "bg-emerald-100 text-emerald-800"
                                : shift.status === "Half_Day"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {shift.status === "Half_Day" ? "Half Day" : shift.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                          ${Number(shift.base || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-600">
                          {shift.overtimeHours > 0 ? (
                            <span>
                              {shift.overtimeHours}h (+${Number(shift.overtimePay || 0).toLocaleString()})
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                          +${Number(shift.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-right">
                        Total Gross Earnings from Shifts:
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 text-base font-bold">
                        ${Number(earnings.grossEarnings || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
              Transfer your earned attendance funds directly to your connected Stripe bank account.
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
                  Funds will be transferred directly to your bank account via Stripe upon approval.
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
                  disabled={submittingWithdraw || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > currentEarnings}
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
            <DialogTitle>Approve & Transfer Funds via Stripe</DialogTitle>
            <DialogDescription>
              This will execute an actual Stripe transfer of{" "}
              <strong className="text-slate-900 font-semibold">
                ${Number(approveTarget?.amount ?? 0).toLocaleString()}
              </strong>{" "}
              directly to {approveTarget?.worker?.userName}&apos;s connected Stripe account and settle their earnings.
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
              The reserved amount will be restored to their available balance.
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
