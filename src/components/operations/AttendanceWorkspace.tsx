"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useListAttendanceQuery,
  useMarkAttendanceBulkMutation,
  useSelfCheckInMutation,
  useVerifyAttendanceMutation,
} from "@/redux/features/operations/operationsApi";

const statuses = ["Present", "Absent", "Half_Day", "Leave", "Holiday"] as const;
const selfSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
});

function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function AttendanceWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const managerMode = role !== "WORKER";
  const { data: projectsData, isLoading: projectsLoading } =
    useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [view, setView] = useState<"mark" | "verify">("mark");
  const [statusesByWorker, setStatusesByWorker] = useState<
    Record<string, string>
  >({});
  const [notesByWorker, setNotesByWorker] = useState<Record<string, string>>(
    {},
  );
  const [actionError, setActionError] = useState("");
  const [selfSuccess, setSelfSuccess] = useState("");
  const selectedProject =
    projects.find((project: any) => project.id === projectId) || projects[0];
  const activeProjectId = projectId || selectedProject?.id || "";
  const {
    data: workersData,
    isLoading: workersLoading,
    isError: workersError,
  } = useListWorkersQuery(
    activeProjectId ? `projectId=${activeProjectId}&limit=100` : "",
    { skip: !managerMode || !activeProjectId },
  );
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    isError: attendanceError,
    refetch,
  } = useListAttendanceQuery(
    activeProjectId
      ? `projectId=${activeProjectId}&date=${date}&limit=100`
      : "",
    { skip: !activeProjectId },
  );
  const [markBulk, { isLoading: marking }] = useMarkAttendanceBulkMutation();
  const [verify, { isLoading: verifying }] = useVerifyAttendanceMutation();
  const [selfCheckIn, { isLoading: checkingIn }] = useSelfCheckInMutation();
  const workers = workersData?.data ?? [];
  const records = attendanceData?.data ?? [];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof selfSchema>>({
    resolver: zodResolver(selfSchema),
  });

  useEffect(() => {
    if (!projectId && selectedProject?.id) setProjectId(selectedProject.id);
  }, [projectId, selectedProject?.id]);
  const submitBulk = async () => {
    setActionError("");
    try {
      await markBulk({
        projectId: activeProjectId,
        date,
        attendances: workers.map((worker: any) => ({
          workerId: worker.id,
          status: statusesByWorker[worker.id] || "Present",
          notes: notesByWorker[worker.id] || undefined,
        })),
      }).unwrap();
    } catch (error) {
      setActionError(errorMessage(error, "Attendance could not be saved."));
    }
  };
  const submitSelf = async (values: z.infer<typeof selfSchema>) => {
    setActionError("");
    setSelfSuccess("");
    try {
      await selfCheckIn({
        projectId: activeProjectId || undefined,
        date,
        checkIn: values.checkIn
          ? new Date(values.checkIn).toISOString()
          : undefined,
        checkOut: values.checkOut
          ? new Date(values.checkOut).toISOString()
          : undefined,
        notes: values.notes || undefined,
      }).unwrap();
      setSelfSuccess("Attendance submitted successfully! Pending manager verification.");
    } catch (error) {
      setError("root", {
        message: errorMessage(error, "Self check-in could not be saved."),
      });
    }
  };
  if (!managerMode)
    return (
      <div className="space-y-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Worker view
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Self check-in
          </h1>
          <p className="mt-2 text-slate-500">
            Submit today&apos;s attendance for your assigned project.
          </p>
        </div>
        {projectsLoading ? (
          <div className="card-surface h-32 animate-pulse rounded-[9px] bg-slate-100" />
        ) : !activeProjectId ? (
          <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
            You are not assigned to a project yet.
          </div>
        ) : (
          <>
            <div className="card-surface rounded-[9px] p-5">
              <p className="text-sm text-slate-500">Assigned project</p>
              <p className="mt-1 text-lg font-semibold">
                {selectedProject.projectName}
              </p>
            </div>

            {selfSuccess && (
              <div className="flex items-center gap-3 rounded-[9px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <p className="font-medium">{selfSuccess}</p>
              </div>
            )}

            {records.length > 0 && (
              <div className="card-surface rounded-[9px] border-l-4 border-l-amber-500 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Today&apos;s Attendance Record
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {records[0].status?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        (Source: {records[0].source})
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {records[0].selfCheckIn && (
                      <p>
                        Check-in:{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(records[0].selfCheckIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    )}
                    {records[0].selfCheckOut && (
                      <p>
                        Check-out:{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(records[0].selfCheckOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                {records[0].notes && (
                  <p className="mt-2 text-xs italic text-slate-600">
                    Note: {records[0].notes}
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit(submitSelf)}
              className="card-surface max-w-2xl rounded-[9px] p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor="checkIn">
                    Check in
                  </label>
                  <input
                    id="checkIn"
                    type="datetime-local"
                    placeholder="Select check-in time"
                    className="form-input"
                    {...register("checkIn")}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="checkOut">
                    Check out
                  </label>
                  <input
                    id="checkOut"
                    type="datetime-local"
                    placeholder="Select check-out time"
                    className="form-input"
                    {...register("checkOut")}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="form-label" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="form-input min-h-24"
                  placeholder="Optional note for the manager"
                  {...register("notes")}
                />
              </div>
              {errors.root && (
                <p className="form-error">{errors.root.message}</p>
              )}
              <button
                className="btn-primary mt-5"
                disabled={checkingIn}
                type="submit"
              >
                <Clock3 size={17} />
                {checkingIn ? "Submitting..." : "Submit attendance"}
              </button>
            </form>
          </>
        )}
      </div>
    );
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Field operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Attendance
          </h1>
          <p className="mt-2 text-slate-500">
            Mark a project day in bulk or verify worker submissions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={view === "mark" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("mark")}
          >
            <CalendarCheck size={17} />
            Mark day
          </button>
          <button
            className={view === "verify" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("verify")}
          >
            <ShieldCheck size={17} />
            Verify
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div>
          <label className="form-label" htmlFor="project">
            Project
          </label>
          <select
            id="project"
            className="form-input"
            value={activeProjectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="attendance-date">
            Date
          </label>
          <input
            id="attendance-date"
            type="date"
            placeholder="Select attendance date"
            className="form-input"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>
      {actionError && (
        <div className="rounded-[6px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {workersLoading || attendanceLoading ? (
        <div className="card-surface h-64 animate-pulse rounded-[9px] bg-slate-100" />
      ) : workersError || attendanceError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">
            Attendance data could not be loaded
          </p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : !activeProjectId ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
          Select a project to continue.
        </div>
      ) : view === "mark" ? (
        <section className="card-surface overflow-hidden rounded-[9px]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold">Daily attendance</h2>
              <p className="text-xs text-slate-500">
                {workers.length} workers in project scope
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={submitBulk}
              disabled={marking}
            >
              <Check size={17} />
              {marking ? "Saving..." : "Save attendance"}
            </button>
          </div>
          {workers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No workers assigned to this project.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {workers.map((worker: any) => (
                <div
                  key={worker.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-semibold">
                      {worker.worker?.userName || "Worker"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {worker.workerCategory}
                    </p>
                  </div>
                  <select
                    className="form-input"
                    value={statusesByWorker[worker.id] || "Present"}
                    onChange={(event) =>
                      setStatusesByWorker((current) => ({
                        ...current,
                        [worker.id]: event.target.value,
                      }))
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    placeholder="Half-day note if needed"
                    value={notesByWorker[worker.id] || ""}
                    onChange={(event) =>
                      setNotesByWorker((current) => ({
                        ...current,
                        [worker.id]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="card-surface overflow-hidden rounded-[9px]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Pending verification</h2>
            <p className="text-xs text-slate-500">
              Manager verification is authoritative.
            </p>
          </div>
          {records.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No attendance records for this date.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((record: any) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {record.worker?.worker?.userName || record.workerId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {record.status} · {record.source}
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    disabled={verifying}
                    onClick={async () => {
                      setActionError("");
                      try {
                        await verify({
                          id: record.id,
                          body: {
                            status:
                              record.status === "Pending_Verification"
                                ? "Present"
                                : record.status,
                            checkIn: record.checkIn,
                            checkOut: record.checkOut,
                            workingHours: record.workingHours,
                            overtimeHours: record.overtimeHours,
                            notes: record.notes,
                          },
                        }).unwrap();
                      } catch (error) {
                        setActionError(
                          errorMessage(
                            error,
                            "Attendance could not be verified.",
                          ),
                        );
                      }
                    }}
                  >
                    <ShieldCheck size={17} />
                    Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
