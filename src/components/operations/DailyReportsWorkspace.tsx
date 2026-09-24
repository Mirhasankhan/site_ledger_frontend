"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useListProjectsQuery } from "@/redux/features/projects/projectApi";
import {
  useCreateDailyReportMutation,
  useDeleteDailyReportMutation,
  useListDailyReportsQuery,
} from "@/redux/features/operations/operationsApi";
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

const schema = z.object({
  projectId: z.string().min(1, "Choose a project"),
  date: z.string().min(1, "Choose a report date"),
  weather: z.string().optional(),
  presentWorkers: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Enter a non-negative whole number",
    ),
  absentWorkers: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Enter a non-negative whole number",
    ),
  workCompleted: z.string().optional(),
  workInProgress: z.string().optional(),
  issues: z.string().optional(),
  delays: z.string().optional(),
  safetyNotes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function DailyReportsWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canCreate = role !== "WORKER";
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState("");
  const { data, isLoading, isError, refetch } = useListDailyReportsQuery(
    projectId ? `projectId=${projectId}` : "",
  );
  const [createReport, { isLoading: creating }] =
    useCreateDailyReportMutation();
  const [deleteReport, { isLoading: deleting }] =
    useDeleteDailyReportMutation();
  const [showForm, setShowForm] = useState(false);
  const reports = data?.data ?? [];
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
      date: new Date().toISOString().slice(0, 10),
      presentWorkers: "0",
      absentWorkers: "0",
    },
  });
  const onSubmit = async (values: Values) => {
    try {
      await createReport({
        ...values,
        presentWorkers: Number(values.presentWorkers),
        absentWorkers: Number(values.absentWorkers),
      }).unwrap();
      reset({
        projectId: values.projectId,
        date: values.date,
        presentWorkers: "0",
        absentWorkers: "0",
        weather: "",
        workCompleted: "",
        workInProgress: "",
        issues: "",
        delays: "",
        safetyNotes: "",
      });
      setProjectId(values.projectId);
      setShowForm(false);
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Daily report could not be saved.",
      });
    }
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Site journal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Daily reports
          </h1>
          <p className="mt-2 text-slate-500">
            Keep a dated record of progress, issues, and site safety.
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={17} />
            {showForm ? "Close form" : "New report"}
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
                <label className="form-label" htmlFor="date">
                  Report date
                </label>
                <input
                  id="date"
                  type="date"
                  placeholder="Select report date"
                  className="form-input"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="form-error">{errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="weather">
                  Weather
                </label>
                <input
                  id="weather"
                  placeholder="e.g. Sunny, 24°C / Light rain"
                  className="form-input"
                  {...register("weather")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="presentWorkers">
                  Present workers
                </label>
                <input
                  id="presentWorkers"
                  type="number"
                  placeholder="0"
                  className="form-input"
                  {...register("presentWorkers")}
                />
                {errors.presentWorkers && (
                  <p className="form-error">{errors.presentWorkers.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="absentWorkers">
                  Absent workers
                </label>
                <input
                  id="absentWorkers"
                  type="number"
                  placeholder="0"
                  className="form-input"
                  {...register("absentWorkers")}
                />
                {errors.absentWorkers && (
                  <p className="form-error">{errors.absentWorkers.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["workCompleted", "Work completed"],
                  ["workInProgress", "Work in progress"],
                  ["issues", "Issues"],
                  ["delays", "Delays"],
                  ["safetyNotes", "Safety notes"],
                ] as const
              ).map(([name, label]) => (
                <div key={name}>
                  <label className="form-label" htmlFor={name}>
                    {label}
                  </label>
                  <textarea
                    id={name}
                    placeholder={`Describe ${label.toLowerCase()}...`}
                    className="form-input min-h-24"
                    {...register(name)}
                  />
                </div>
              ))}
            </div>
            {errors.root && (
              <p className="text-sm text-red-700">{errors.root.message}</p>
            )}
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Saving..." : "Submit report"}
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
      {isLoading ? (
        <div className="card-surface h-56 animate-pulse rounded-[9px] bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Reports could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center">
          <FileText className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 font-semibold">No daily reports</p>
          <p className="mt-1 text-sm text-slate-500">
            Reports will appear here once submitted.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((report: any) => (
            <article key={report.id} className="card-surface rounded-[9px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                  <h2 className="mt-1 font-semibold">
                    {report.project?.projectName || "Project report"}
                  </h2>
                </div>
                {canCreate && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Delete daily report"
                      >
                        <Trash2 size={17} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the daily report from the project
                          journal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleting}
                          onClick={() => deleteReport(report.id)}
                        >
                          {deleting ? "Deleting..." : "Delete report"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {report.workCompleted ||
                  report.workInProgress ||
                  "No work summary provided."}
              </p>
              <div className="mt-5 flex gap-4 text-xs text-slate-500">
                <span>{report.presentWorkers} present</span>
                <span>{report.absentWorkers} absent</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
