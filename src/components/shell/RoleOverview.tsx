"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  useGetGlobalActivityQuery,
  useListProjectsQuery,
  useListTasksQuery,
} from "@/redux/features/projects/projectApi";

const content = {
  ADMIN: {
    eyebrow: "Operations control",
    title: "Good morning, administrator.",
    description:
      "A concise view of the projects, people, and money moving through Siteledger.",
    metricLabel: "Active projects",
    action: "Create project",
    actionHref: "/admin/projects/new",
  },
  SITE_MANAGER: {
    eyebrow: "Site command",
    title: "Keep the day moving.",
    description:
      "Your managed projects, attendance, and open work in one place.",
    metricLabel: "Managed projects",
    action: "Open projects",
    actionHref: "/site-manager/projects",
  },
  WORKER: {
    eyebrow: "Your workday",
    title: "Know what matters next.",
    description:
      "Check attendance, follow assigned work, and keep the site team informed.",
    metricLabel: "Assigned project",
    action: "Check in",
    actionHref: "/worker/attendance",
  },
} as const;

export default function RoleOverview({ role }: { role: keyof typeof content }) {
  const item = content[role];

  const { data: projectsData, isLoading: projectsLoading } =
    useListProjectsQuery("");
  const projects = projectsData?.data ?? [];

  const { data: tasksData, isLoading: tasksLoading } = useListTasksQuery("");
  const tasks = Array.isArray(tasksData?.data)
    ? tasksData?.data
    : tasksData?.data
      ? Object.values(tasksData.data).flat()
      : [];

  const { data: activityData } =
    useGetGlobalActivityQuery("", { skip: role !== "ADMIN" });
  const globalActivities = activityData?.data ?? [];

  const activeProjectsCount = projects.length;
  const pendingTasksCount = tasks.filter(
    (t: any) => t.status !== "Completed" && t.status !== "Cancelled",
  ).length;
  const completedTasksCount = tasks.filter(
    (t: any) => t.status === "Completed",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            {item.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {item.title}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">{item.description}</p>
        </div>
        <Link href={item.actionHref} className="btn-primary">
          <Plus size={17} />
          {item.action}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{item.metricLabel}</p>
            <FolderKanban className="text-amber-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {projectsLoading ? "..." : activeProjectsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Current workspace scope</p>
        </div>

        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Open tasks</p>
            <ListTodo className="text-blue-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {tasksLoading ? "..." : pendingTasksCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {completedTasksCount} completed across projects
          </p>
        </div>

        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Project health</p>
            <CheckCircle2 className="text-emerald-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {pendingTasksCount === 0 && activeProjectsCount > 0
              ? "All clear"
              : "Active"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Operations progressing normally
          </p>
        </div>
      </div>

      <section className="card-surface rounded-[9px] p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              {role === "ADMIN"
                ? "Live audit trail and operational updates across all projects."
                : "Active work updates and team progress."}
            </p>
          </div>
          <ArrowUpRight className="text-slate-400" size={20} />
        </div>

        {role === "ADMIN" && globalActivities.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100">
            {globalActivities.slice(0, 6).map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {activity.actor?.userName || "System"}
                  </span>{" "}
                  <span className="text-slate-600">
                    {activity.action.toLowerCase().replace(/_/g, " ")}
                  </span>
                  {activity.project?.projectName && (
                    <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {activity.project.projectName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100">
            {tasks.slice(0, 5).map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {task.title}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    ({task.priority} priority)
                  </span>
                  {task.project?.projectName && (
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {task.project.projectName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {task.status?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {task.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[6px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
            No recent activity to show.
          </div>
        )}
      </section>
    </div>
  );
}
