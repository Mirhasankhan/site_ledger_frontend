"use client";

import { Activity, AlertCircle, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useListProjectsQuery } from "@/redux/features/projects/projectApi";
import {
  useGetGlobalActivityQuery,
  useGetProjectActivityQuery,
} from "@/redux/features/collaboration/collaborationApi";

export default function ActivityWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const isAdmin = role === "ADMIN";
  const { data: projectsData } = useListProjectsQuery("");
  const projects = useMemo(
    () => projectsData?.data ?? [],
    [projectsData?.data],
  );
  const [projectId, setProjectId] = useState("");
  const {
    data: globalData,
    isLoading: globalLoading,
    isError: globalError,
    refetch: refetchGlobal,
  } = useGetGlobalActivityQuery("", { skip: !isAdmin });
  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
    refetch: refetchProject,
  } = useGetProjectActivityQuery(
    { projectId },
    { skip: isAdmin || !projectId },
  );
  const activities = isAdmin
    ? (globalData?.data ?? [])
    : (projectData?.data ?? []);
  const isLoading = isAdmin ? globalLoading : projectLoading;
  const isError = isAdmin ? globalError : projectError;
  useEffect(() => {
    if (!projectId && projects[0]?.id && !isAdmin) setProjectId(projects[0].id);
  }, [projectId, projects, isAdmin]);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Audit trail
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Activity feed
        </h1>
        <p className="mt-2 text-slate-500">
          {isAdmin
            ? "Global activity across every project."
            : "Activity from your visible project scope."}
        </p>
      </div>
      {!isAdmin && (
        <div className="max-w-md">
          <label className="form-label" htmlFor="activity-project">
            Project
          </label>
          <select
            id="activity-project"
            className="form-input"
            value={projectId}
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
      )}
      {isLoading ? (
        <div className="card-surface h-64 animate-pulse rounded-lg bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Activity could not be loaded</p>
          <button
            className="mt-4 btn-secondary"
            onClick={() => (isAdmin ? refetchGlobal() : refetchProject())}
          >
            Try again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="card-surface rounded-lg border-dashed p-12 text-center">
          <Activity className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 font-semibold">No activity yet</p>
          <p className="mt-1 text-sm text-slate-500">
            System activity will appear as work is recorded.
          </p>
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-lg">
          <div className="divide-y divide-slate-100">
            {activities.map((item: any) => (
              <article key={item.id} className="flex gap-4 px-5 py-5">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Clock3 size={16} />
                </div>
                <div>
                  <p className="font-semibold">
                    {item.action?.replaceAll("_", " ") || "Activity update"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.entityType} · {item.entityId}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.actor?.userName || "System"} ·{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
