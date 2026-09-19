"use client";

import { AlertCircle, FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useListProjectsQuery } from "@/redux/features/projects/projectApi";

export default function ProjectList({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useListProjectsQuery(
    search ? `search=${encodeURIComponent(search)}` : "",
  );
  const projects = data?.data ?? [];
  const base =
    role === "ADMIN"
      ? "/admin"
      : role === "SITE_MANAGER"
        ? "/site-manager"
        : "/worker";
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="mt-2 text-slate-500">
            Projects visible within your role and assignment scope.
          </p>
        </div>
        {role === "ADMIN" && (
          <Link className="btn-primary" href="/admin/projects/new">
            <Plus size={17} />
            New project
          </Link>
        )}
      </div>
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={17}
        />
        <input
          className="form-input pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects"
        />
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="card-surface h-44 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="card-surface rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Projects could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="card-surface rounded-lg border-dashed p-12 text-center">
          <FolderKanban className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 font-semibold">No projects found</p>
          <p className="mt-1 text-sm text-slate-500">
            Projects matching your scope will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`${base}/projects/${project.id}`}
              className="card-surface table-row-hover rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{project.projectName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.projectCode || "No project code"}
                  </p>
                </div>
                <span className="status-badge bg-amber-100 text-amber-800">
                  {project.status}
                </span>
              </div>
              <p className="mt-5 line-clamp-2 text-sm text-slate-600">
                {project.description}
              </p>
              <div className="mt-5 flex gap-5 text-xs text-slate-500">
                <span>{project._count?.workerProfiles ?? 0} workers</span>
                <span>{project._count?.tasks ?? 0} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
