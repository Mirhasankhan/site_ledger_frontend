"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useCreateLeaveMutation,
  useListLeavesQuery,
  useReviewLeaveMutation,
} from "@/redux/features/payroll/payrollApi";

const schema = z
  .object({
    workerId: z.string().min(1, "Choose a worker"),
    projectId: z.string().min(1, "Choose a project"),
    leaveType: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(1, "Reason is required"),
  })
  .refine(
    (values) =>
      !values.startDate ||
      !values.endDate ||
      values.startDate <= values.endDate,
    { path: ["endDate"], message: "End date must be on or after start date" },
  );
function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function LeaveWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canReview = role !== "WORKER";
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");
  const { data: workersData } = useListWorkersQuery(
    projectId ? `projectId=${projectId}&limit=100` : "limit=100",
  );
  const workers = workersData?.data ?? [];
  const { data, isLoading, isError, refetch } = useListLeavesQuery(
    projectId ? `projectId=${projectId}` : "",
  );
  const [createLeave, { isLoading: creating }] = useCreateLeaveMutation();
  const [reviewLeave, { isLoading: reviewing }] = useReviewLeaveMutation();
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { startDate: "", endDate: "" },
  });
  const leaves = data?.data ?? [];
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createLeave(values).unwrap();
      reset({
        workerId: "",
        projectId: values.projectId,
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
      setProjectId(values.projectId);
      setShowForm(false);
    } catch (error) {
      setError("root", {
        message: errorMessage(error, "Leave request could not be submitted."),
      });
    }
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            People operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Leave requests
          </h1>
          <p className="mt-2 text-slate-500">
            Submit and review project leave requests.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus size={17} />
          {showForm ? "Close form" : "Request leave"}
        </button>
      </div>
      {showForm && (
        <section className="card-surface rounded-lg p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <label className="form-label" htmlFor="leave-project">
                Project
              </label>
              <select
                id="leave-project"
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
              <label className="form-label" htmlFor="leave-worker">
                Worker
              </label>
              <select
                id="leave-worker"
                className="form-input"
                {...register("workerId")}
              >
                <option value="">Select worker</option>
                {workers.map((worker: any) => (
                  <option key={worker.workerId} value={worker.workerId}>
                    {worker.worker?.userName || worker.workerId}
                  </option>
                ))}
              </select>
              {errors.workerId && (
                <p className="form-error">{errors.workerId.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="leaveType">
                Leave type
              </label>
              <input
                id="leaveType"
                className="form-input"
                placeholder="Annual leave"
                {...register("leaveType")}
              />
              {errors.leaveType && (
                <p className="form-error">{errors.leaveType.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="startDate">
                Start date
              </label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="form-error">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="endDate">
                End date
              </label>
              <input
                id="endDate"
                type="date"
                className="form-input"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="form-error">{errors.endDate.message}</p>
              )}
            </div>
            <div className="md:col-span-3">
              <label className="form-label" htmlFor="reason">
                Reason
              </label>
              <textarea
                id="reason"
                className="form-input min-h-20"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="form-error">{errors.reason.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-red-700 md:col-span-3">
                {errors.root.message}
              </p>
            )}
            <div className="md:col-span-3">
              <button className="btn-primary" disabled={creating} type="submit">
                {creating ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="max-w-sm">
        <label className="form-label" htmlFor="leave-filter">
          Filter project
        </label>
        <select
          id="leave-filter"
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
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {isLoading ? (
        <div className="card-surface h-56 animate-pulse rounded-lg bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">
            Leave requests could not be loaded
          </p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : leaves.length === 0 ? (
        <div className="card-surface rounded-lg border-dashed p-10 text-center">
          <CalendarDays className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 font-semibold">No leave requests</p>
          <p className="mt-1 text-sm text-slate-500">
            Submitted requests will appear here.
          </p>
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-lg">
          <div className="divide-y divide-slate-100">
            {leaves.map((leave: any) => (
              <div
                key={leave.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {leave.worker?.worker?.userName || leave.workerId} ·{" "}
                    {leave.leaveType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(leave.startDate).toLocaleDateString()} to{" "}
                    {new Date(leave.endDate).toLocaleDateString()} ·{" "}
                    {leave.project?.projectName || leave.projectId}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{leave.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="status-badge bg-slate-100 text-slate-700">
                    {leave.status}
                  </span>
                  {canReview && leave.status === "Pending" && (
                    <select
                      className="form-input max-w-32"
                      defaultValue=""
                      disabled={reviewing}
                      onChange={async (event) => {
                        if (!event.target.value) return;
                        try {
                          await reviewLeave({
                            id: leave.id,
                            body: { status: event.target.value },
                          }).unwrap();
                        } catch (error) {
                          setActionError(
                            errorMessage(error, "Leave review failed."),
                          );
                        }
                      }}
                    >
                      <option value="">Review</option>
                      <option>Accepted</option>
                      <option>Rejected</option>
                    </select>
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
