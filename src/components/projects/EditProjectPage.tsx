"use client";

import AppShell from "@/components/shell/AppShell";
import ProjectForm from "@/components/projects/ProjectForm";
import { useGetProjectQuery } from "@/redux/features/projects/projectApi";

export default function EditProjectPage({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useGetProjectQuery(projectId);
  const project = data?.data;
  return (
    <AppShell role="ADMIN">
      <div className="mx-auto max-w-4xl space-y-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Edit project
          </h1>
        </div>
        {isLoading ? (
          <div className="card-surface h-96 animate-pulse rounded-lg bg-slate-100" />
        ) : isError || !project ? (
          <div className="card-surface rounded-lg p-8 text-center text-red-700">
            Project could not be loaded.
          </div>
        ) : (
          <div className="card-surface rounded-lg p-6 sm:p-8">
            <ProjectForm project={project} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
