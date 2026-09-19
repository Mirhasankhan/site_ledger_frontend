"use client";

import {
  AlertCircle,
  LockKeyhole,
  UserPlus,
  UserRoundMinus,
} from "lucide-react";
import { useState } from "react";
import {
  useAssignWorkerMutation,
  useListWorkersQuery,
  useUnassignWorkerMutation,
} from "@/redux/features/projects/projectApi";
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

export default function ProjectWorkers({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } =
    useListWorkersQuery(`limit=100`);
  const [assignWorker, { isLoading: assigning }] = useAssignWorkerMutation();
  const [unassignWorker, { isLoading: unassigning }] =
    useUnassignWorkerMutation();
  const [selectedId, setSelectedId] = useState("");
  const workers = data?.data ?? [];
  const assigned = workers.filter(
    (worker: any) => worker.projectId === projectId,
  );
  const available = workers.filter((worker: any) => !worker.projectId);
  const assign = async () => {
    if (!selectedId) return;
    try {
      await assignWorker({
        workerId: selectedId,
        body: { projectId },
      }).unwrap();
      setSelectedId("");
    } catch {
      /* server message remains visible through query refresh */
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Project team</p>
        <h2 className="mt-1 text-2xl font-semibold">Workers</h2>
      </div>
      <section className="card-surface rounded-lg p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="form-input"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">Select an unassigned worker</option>
            {available.map((worker: any) => (
              <option key={worker.id} value={worker.id}>
                {worker.worker?.userName || worker.workerId} ·{" "}
                {worker.workerCategory}
              </option>
            ))}
          </select>
          <button
            className="btn-primary shrink-0"
            disabled={!selectedId || assigning}
            onClick={assign}
          >
            <UserPlus size={17} />
            {assigning ? "Assigning..." : "Assign worker"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Assignment snapshots the project rate for the worker&apos;s category.
        </p>
      </section>
      {isLoading ? (
        <div className="card-surface h-48 animate-pulse rounded-lg bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Workers could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : assigned.length === 0 ? (
        <div className="card-surface rounded-lg border-dashed p-10 text-center text-sm text-slate-500">
          No workers are assigned to this project.
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-lg">
          <div className="divide-y divide-slate-100">
            {assigned.map((worker: any) => {
              const locked = Number(worker.outstandingAmount || 0) > 0;
              return (
                <div
                  key={worker.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {worker.worker?.userName || "Unnamed worker"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {worker.workerCategory} · Daily rate {worker.dailyRate}
                    </p>
                    {locked && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                        <LockKeyhole size={14} />
                        Removal locked: outstanding balance{" "}
                        {Number(worker.outstandingAmount).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="btn-secondary shrink-0 text-red-700"
                        disabled={locked}
                      >
                        <UserRoundMinus size={16} />
                        Remove
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this worker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the worker from the project. Their
                          payment history remains intact.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          disabled={unassigning}
                          onClick={() => unassignWorker(worker.id)}
                        >
                          {unassigning ? "Removing..." : "Remove worker"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">
        The backend remains authoritative. A worker with an outstanding balance
        cannot be reassigned or removed.
      </p>
    </div>
  );
}
