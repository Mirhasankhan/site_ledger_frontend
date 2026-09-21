"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  LockKeyhole,
  Mail,
  RotateCcw,
  Search,
  UserPlus,
  UserRoundMinus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import InviteModal from "../people/InviteModal";
import InvitationsList from "../people/InvitationsList";
import { useFetchAllInvitesQuery } from "@/redux/features/invites/inviteApi";
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
import {
  useAssignWorkerMutation,
  useListProjectsQuery,
  useListWorkersQuery,
  useUnassignWorkerMutation,
} from "@/redux/features/projects/projectApi";

interface WorkerItem {
  id: string;
  workerId: string;
  workerCategory?: string;
  dailyRate?: number;
  outstandingAmount?: number | string;
  currentEarnings?: number | string;
  allTimeEarnings?: number | string;
  projectId?: string | null;
  project?: {
    id: string;
    projectName?: string;
    name?: string;
  };
  worker?: {
    id?: string;
    userName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
  };
}

export default function WorkersWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER";
}) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Tab state for Admin
  const [activeTab, setActiveTab] = useState<"WORKFORCE" | "INVITATIONS">("WORKFORCE");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [targetProjectId, setTargetProjectId] = useState("");
  const [overrideRate, setOverrideRate] = useState<string>("");

  // Invites query (Admin only)
  const { data: invitesData } = useFetchAllInvitesQuery("limit=200", {
    skip: role !== "ADMIN",
  });
  const pendingInvitesCount = useMemo(
    () => invitesData?.data?.filter((i) => i.status === "Pending").length ?? 0,
    [invitesData?.data],
  );

  // Queries & mutations
  const {
    data: workersData,
    isLoading: workersLoading,
    isError: workersError,
    refetch: refetchWorkers,
  } = useListWorkersQuery("limit=200");

  const { data: projectsData } = useListProjectsQuery("");

  const [assignWorker, { isLoading: assigning }] = useAssignWorkerMutation();
  const [unassignWorker, { isLoading: unassigning }] =
    useUnassignWorkerMutation();

  const workers: WorkerItem[] = useMemo(
    () => workersData?.data ?? [],
    [workersData?.data],
  );
  const projects = useMemo(
    () => projectsData?.data ?? [],
    [projectsData?.data],
  );

  const base = role === "ADMIN" ? "/admin" : "/site-manager";

  // Create a map of projects for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const proj of projects) {
      map.set(proj.id, proj.projectName || proj.name || "Untitled Project");
    }
    return map;
  }, [projects]);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const w of workers) {
      if (w.workerCategory) set.add(w.workerCategory);
    }
    return Array.from(set).sort();
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const name = (
        worker.worker?.userName ||
        worker.workerId ||
        ""
      ).toLowerCase();
      const email = (worker.worker?.email || "").toLowerCase();
      const category = (worker.workerCategory || "").toLowerCase();
      const searchLower = search.trim().toLowerCase();

      // Search matching
      if (
        searchLower &&
        !name.includes(searchLower) &&
        !email.includes(searchLower) &&
        !category.includes(searchLower)
      ) {
        return false;
      }

      // Project filter
      if (projectFilter === "ASSIGNED" && !worker.projectId) return false;
      if (projectFilter === "UNASSIGNED" && worker.projectId) return false;
      if (
        projectFilter !== "ALL" &&
        projectFilter !== "ASSIGNED" &&
        projectFilter !== "UNASSIGNED"
      ) {
        if (worker.projectId !== projectFilter) return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && worker.workerCategory !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [workers, search, projectFilter, categoryFilter]);

  // Stats calculation
  const totalCount = workers.length;
  const assignedCount = workers.filter((w) => !!w.projectId).length;
  const unassignedCount = totalCount - assignedCount;
  const totalOutstanding = workers.reduce(
    (sum, w) => sum + Number(w.outstandingAmount || 0),
    0,
  );

  // Handle open assign dialog for a specific worker
  const handleOpenAssign = (workerId?: string) => {
    if (workerId) {
      setSelectedWorkerId(workerId);
      const worker = workers.find((w) => w.id === workerId);
      setTargetProjectId(worker?.projectId || "");
      setOverrideRate(worker?.dailyRate ? String(worker.dailyRate) : "");
    } else {
      setSelectedWorkerId("");
      setTargetProjectId("");
      setOverrideRate("");
    }
    setIsAssignModalOpen(true);
  };

  // Submit assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !targetProjectId) {
      toast.error("Please select both a worker and a project");
      return;
    }

    try {
      const body: { projectId: string; overrideDailyRate?: number } = {
        projectId: targetProjectId,
      };
      if (overrideRate && !isNaN(Number(overrideRate))) {
        body.overrideDailyRate = Number(overrideRate);
      }

      await assignWorker({
        workerId: selectedWorkerId,
        body,
      }).unwrap();

      toast.success("Worker assigned successfully");
      setIsAssignModalOpen(false);
      setSelectedWorkerId("");
      setTargetProjectId("");
      setOverrideRate("");
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to assign worker",
      );
    }
  };

  // Handle unassign
  const handleUnassign = async (workerId: string) => {
    try {
      await unassignWorker(workerId).unwrap();
      toast.success("Worker unassigned from project");
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to remove worker",
      );
    }
  };

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Workforce Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            People &amp; Workers
          </h1>
          <p className="mt-2 text-slate-500">
            Monitor workforce deployment, project assignments, daily rates, and
            compensation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === "ADMIN" && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="btn-primary flex items-center gap-1.5"
              type="button"
            >
              <UserPlus size={17} />
              Invite person
            </button>
          )}
          <button
            onClick={() => handleOpenAssign()}
            className="btn-secondary flex items-center gap-1.5"
            type="button"
          >
            <FolderKanban size={17} />
            Assign worker
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      {role === "ADMIN" && (
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("WORKFORCE")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "WORKFORCE"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users size={16} />
            Active Workforce
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {totalCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("INVITATIONS")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "INVITATIONS"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail size={16} />
            Invitations
            {pendingInvitesCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {pendingInvitesCount} pending
              </span>
            )}
          </button>
        </div>
      )}

      {role === "ADMIN" && activeTab === "INVITATIONS" ? (
        <InvitationsList />
      ) : (
        <>
          {/* Overview Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Workforce</p>
            <div className="rounded-full bg-slate-100 p-2 text-slate-700">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-500">Registered worker profiles</p>
        </div>

        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Assigned</p>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {assignedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active on site projects</p>
        </div>

        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Available / Bench</p>
            <div className="rounded-full bg-amber-50 p-2 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-700">
            {unassignedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ready for assignment</p>
        </div>

        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Outstanding
            </p>
            <div className="rounded-full bg-rose-50 p-2 text-rose-600">
              <Wallet size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-700">
            ${totalOutstanding.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Pending worker payouts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface rounded-[9px] p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="form-input pl-10"
              placeholder="Search by name, ID, or trade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Project Statuses</option>
              <option value="ASSIGNED">Assigned (Any project)</option>
              <option value="UNASSIGNED">Unassigned only</option>
              {projects.map((proj: any) => (
                <option key={proj.id} value={proj.id}>
                  Project: {proj.projectName || proj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories &amp; Trades</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(search || projectFilter !== "ALL" || categoryFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("ALL");
                  setCategoryFilter("ALL");
                }}
                className="btn-secondary w-full"
              >
                <RotateCcw size={15} />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / Content */}
      {workersLoading ? (
        <div className="card-surface divide-y divide-slate-100 rounded-[9px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-slate-50/70 p-5" />
          ))}
        </div>
      ) : workersError ? (
        <div className="card-surface rounded-[9px] p-12 text-center">
          <AlertCircle className="mx-auto text-red-600" size={28} />
          <h3 className="mt-3 text-lg font-semibold text-slate-800">
            Failed to load workforce
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            There was an error connecting to the workers service.
          </p>
          <button
            type="button"
            className="mt-4 btn-secondary"
            onClick={() => refetchWorkers()}
          >
            Try again
          </button>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-12 text-center">
          <Users className="mx-auto text-slate-400" size={32} />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            No workers found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {search || projectFilter !== "ALL" || categoryFilter !== "ALL"
              ? "No worker profiles match your active filters."
              : "No worker profiles have been registered yet."}
          </p>
          {(search || projectFilter !== "ALL" || categoryFilter !== "ALL") && (
            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() => {
                setSearch("");
                setProjectFilter("ALL");
                setCategoryFilter("ALL");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-[9px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Worker
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Trade / Category
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Project Assignment
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Daily Rate
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Outstanding
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Earnings (Cur/All)
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map((worker) => {
                  const hasProject = !!worker.projectId;
                  const projectName = worker.projectId
                    ? projectMap.get(worker.projectId) ||
                      worker.project?.projectName ||
                      worker.project?.name ||
                      "Assigned Project"
                    : null;
                  const outstanding = Number(worker.outstandingAmount || 0);
                  const isLocked = outstanding > 0;
                  const userName =
                    worker.worker?.userName ||
                    worker.worker?.email ||
                    worker.workerId;
                  const initials = (userName || "W")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={worker.id} className="table-row-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {userName}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {worker.workerId.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {worker.workerCategory || "General"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {hasProject ? (
                          <Link
                            href={`${base}/projects/${worker.projectId}/workers`}
                            className="group inline-flex items-center gap-1.5 font-medium text-amber-700 hover:text-amber-800 hover:underline"
                          >
                            <FolderKanban
                              size={15}
                              className="text-amber-600 transition group-hover:scale-110"
                            />
                            <span>{projectName}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-800">
                        {worker.dailyRate !== undefined &&
                        worker.dailyRate !== null
                          ? `$${Number(worker.dailyRate).toLocaleString()}`
                          : "—"}
                      </td>

                      <td className="px-6 py-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            <LockKeyhole size={12} />
                            ${outstanding.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            $0.00
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          ${Number(worker.currentEarnings || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400"> / </span>
                        <span>
                          ${Number(worker.allTimeEarnings || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(worker.id)}
                            className="btn-secondary px-3 py-1.5 text-xs font-medium text-slate-700"
                            title={
                              hasProject
                                ? "Reassign to different project"
                                : "Assign to project"
                            }
                          >
                            {hasProject ? "Reassign" : "Assign"}
                          </button>

                          {hasProject && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  type="button"
                                  disabled={isLocked || unassigning}
                                  className="btn-secondary px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:border-slate-200 disabled:text-slate-300"
                                  title={
                                    isLocked
                                      ? "Worker has outstanding unpaid balance. Clear balance before unassigning."
                                      : "Unassign worker from project"
                                  }
                                >
                                  <UserRoundMinus size={14} />
                                  Remove
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Unassign {userName}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will release {userName} from project &quot;
                                    {projectName}&quot;. All past earnings,
                                    attendance, and payment logs will remain intact.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleUnassign(worker.id)}
                                  >
                                    Unassign Worker
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
            Showing {filteredWorkers.length} of {workers.length} workers. Workers
            with an outstanding balance are locked from project removal until settled.
          </div>
        </div>
      )}
        </>
      )}

      {/* Assignment Dialog Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAssignSubmit}>
            <DialogHeader>
              <DialogTitle>Assign Worker to Project</DialogTitle>
              <DialogDescription>
                Assign or transfer a worker to an active site. This establishes
                their daily wage rate for the project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="form-label" htmlFor="assign-worker-select">
                  Worker Profile <span className="text-red-500">*</span>
                </label>
                <select
                  id="assign-worker-select"
                  className="form-input"
                  value={selectedWorkerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedWorkerId(id);
                    const selected = workers.find((w) => w.id === id);
                    if (selected?.dailyRate) {
                      setOverrideRate(String(selected.dailyRate));
                    }
                  }}
                  required
                >
                  <option value="">Choose a worker...</option>
                  {workers.map((w) => {
                    const label =
                      w.worker?.userName || w.worker?.email || w.workerId;
                    const cat = w.workerCategory
                      ? ` (${w.workerCategory})`
                      : "";
                    const currentProj = w.projectId
                      ? ` - Currently: ${projectMap.get(w.projectId) || "Assigned"}`
                      : " - Available";
                    return (
                      <option key={w.id} value={w.id}>
                        {label}
                        {cat}
                        {currentProj}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="assign-project-select">
                  Target Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="assign-project-select"
                  className="form-input"
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  required
                >
                  <option value="">Select project...</option>
                  {projects.map((proj: any) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.projectName || proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="override-daily-rate">
                  Override Daily Rate (Optional)
                </label>
                <input
                  id="override-daily-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to use category snapshot rate"
                  className="form-input"
                  value={overrideRate}
                  onChange={(e) => setOverrideRate(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  If unspecified, default rate for the worker&apos;s category in the
                  project rate schedule will apply.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning || !selectedWorkerId || !targetProjectId}
                className="btn-primary"
              >
                <UserPlus size={16} />
                {assigning ? "Assigning..." : "Confirm Assignment"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal (Admin only) */}
      {role === "ADMIN" && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
