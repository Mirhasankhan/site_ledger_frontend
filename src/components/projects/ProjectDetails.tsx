"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeleteProjectMutation,
  useGetProjectQuery,
} from "@/redux/features/projects/projectApi";
import BudgetSummary from "@/components/finance/BudgetSummary";
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

export default function ProjectDetails({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetProjectQuery(projectId);
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();
  const project = data?.data;
  const tabs = [
    { label: "Overview", href: `/admin/projects/${projectId}` },
    { label: "Workers", href: `/admin/projects/${projectId}/workers` },
    { label: "Tasks", href: `/admin/projects/${projectId}/tasks` },
    { label: "Rates", href: `/admin/projects/${projectId}/rates` },
  ];
  const onDelete = async () => {
    await deleteProject(projectId).unwrap();
    router.replace("/admin/projects");
  };
  if (isLoading)
    return (
      <div className="space-y-5">
        <div className="h-10 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-52 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  if (isError || !project)
    return (
      <div className="card-surface rounded-lg p-8 text-center">
        <AlertCircle className="mx-auto text-red-600" size={24} />
        <p className="mt-3 font-semibold">Project could not be loaded</p>
        <button className="mt-4 btn-secondary" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  return (
    <div className="space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        All projects
      </Link>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {project.projectName}
            </h1>
            <span className="status-badge bg-amber-100 text-amber-800">
              {project.status}
            </span>
          </div>
          <p className="mt-2 text-slate-500">
            {project.projectCode || "No project code"} · {project.address}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/projects/${projectId}/edit`}
            className="btn-secondary"
          >
            <Pencil size={16} />
            Edit
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="btn-secondary text-red-700 hover:border-red-200 hover:bg-red-50">
                <Trash2 size={16} />
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the project and its project-linked
                  records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                  onClick={onDelete}
                >
                  {deleting ? "Deleting..." : "Delete project"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <nav className="flex gap-6 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab.label === "Overview" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="card-surface rounded-lg p-6">
          <h2 className="text-lg font-semibold">Project brief</h2>
          <p className="mt-4 leading-7 text-slate-600">{project.description}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4">
              <CalendarDays className="text-amber-600" size={19} />
              <p className="mt-3 text-xs text-slate-500">Schedule</p>
              <p className="mt-1 text-sm font-semibold">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "Not set"}{" "}
                to{" "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <Users className="text-amber-600" size={19} />
              <p className="mt-3 text-xs text-slate-500">Team size</p>
              <p className="mt-1 text-sm font-semibold">
                {project._count?.workerProfiles ?? 0} assigned workers
              </p>
            </div>
          </div>
        </section>
        <aside className="card-surface rounded-lg p-6">
          <p className="text-sm text-slate-500">Budget</p>
          <p className="mt-2 text-3xl font-semibold">
            {Number(project.budget || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Standard day: {project.standardWorkHours} hours
          </p>
          <div className="mt-7 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">Project manager</p>
            <p className="mt-1 font-semibold">
              {project.manager?.userName || project.managerId}
            </p>
            <p className="text-sm text-slate-500">
              {project.manager?.email || ""}
            </p>
          </div>
        </aside>
      </div>
      <BudgetSummary projectId={projectId} />
    </div>
  );
}
