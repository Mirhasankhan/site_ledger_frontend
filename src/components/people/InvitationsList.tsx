"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InviteItem,
  useDeleteInviteMutation,
  useFetchAllInvitesQuery,
} from "@/redux/features/invites/inviteApi";

export default function InvitationsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<InviteItem | null>(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useFetchAllInvitesQuery("limit=200");
  const [deleteInvite, { isLoading: isDeleting }] = useDeleteInviteMutation();

  const invites: InviteItem[] = useMemo(() => data?.data ?? [], [data?.data]);

  const filteredInvites = useMemo(() => {
    return invites.filter((inv) => {
      const email = (inv.email || "").toLowerCase();
      const searchLower = search.trim().toLowerCase();

      if (searchLower && !email.includes(searchLower)) {
        return false;
      }

      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "ALL" && inv.role !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [invites, search, statusFilter, roleFilter]);

  const pendingCount = invites.filter((i) => i.status === "Pending").length;
  const acceptedCount = invites.filter((i) => i.status === "Accepted").length;

  const handleCopyLink = async (invite: InviteItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/accept-invite?token=${invite.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invite.id);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCancelInvite = async () => {
    if (!inviteToCancel) return;
    try {
      await deleteInvite(inviteToCancel.id).unwrap();
      toast.success("Invitation cancelled successfully");
      setInviteToCancel(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to cancel invitation",
      );
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: InviteItem["status"]) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <Clock size={12} />
            Pending
          </span>
        );
      case "Accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={12} />
            Accepted
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            <Clock size={12} />
            Expired
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
            <XCircle size={12} />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: InviteItem["role"]) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            Admin
          </span>
        );
      case "SITE_MANAGER":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            Site Manager
          </span>
        );
      case "WORKER":
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Worker
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top filter bar */}
      <div className="card-surface rounded-[9px] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search invited email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input text-xs"
            >
              <option value="ALL">All Statuses ({invites.length})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Accepted">Accepted ({acceptedCount})</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input text-xs"
            >
              <option value="ALL">All Roles</option>
              <option value="WORKER">Workers</option>
              <option value="SITE_MANAGER">Site Managers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary flex items-center gap-1.5 self-end text-xs sm:self-auto"
            title="Refresh list"
          >
            <RefreshCw
              size={14}
              className={isFetching ? "animate-spin text-amber-600" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Invites list table */}
      <div className="card-surface overflow-hidden rounded-[9px]">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-amber-600" />
            Loading invitations...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-rose-600">
            <AlertCircle size={24} className="mx-auto mb-2 text-rose-500" />
            Failed to load invitations. Please try again.
          </div>
        ) : filteredInvites.length === 0 ? (
          <div className="py-16 text-center">
            <Mail size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No invitations found</p>
            <p className="mt-1 text-xs text-slate-400">
              {search || statusFilter !== "ALL" || roleFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "No member invitations have been created yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invited User</th>
                  <th className="px-4 py-3">Role & Trade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent Date</th>
                  <th className="px-4 py-3">Expires At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Mail size={13} />
                        </div>
                        <span className="font-medium text-slate-900">
                          {inv.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(inv.role)}
                        {inv.workerCategory && (
                          <span className="text-[11px] text-slate-500">
                            {inv.workerCategory.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDateTime(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDateTime(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv)}
                              className="btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1"
                              title="Copy activation link"
                            >
                              {copiedId === inv.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInviteToCancel(inv)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Cancel invitation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Cancelling Invite */}
      <AlertDialog
        open={!!inviteToCancel}
        onOpenChange={(open) => !open && setInviteToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation sent to{" "}
              <span className="font-semibold text-slate-800">
                {inviteToCancel?.email}
              </span>
              ? The recipient will no longer be able to use the link to activate
              their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvite}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Cancelling..." : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
