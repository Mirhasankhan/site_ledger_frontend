"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useGetProjectQuery } from "@/redux/features/projects/projectApi";

export default function ProjectTabHeader({
  projectId,
  active,
  role = "ADMIN",
}: {
  projectId: string;
  active: "Workers" | "Tasks" | "Rates";
  role?: "ADMIN" | "SITE_MANAGER";
}) {
  const { data, isLoading } = useGetProjectQuery(projectId);
  const project = data?.data;
  const base = role === "SITE_MANAGER" ? "/site-manager" : "/admin";
  return (
    <div className="space-y-5">
      <Link
        href={`${base}/projects`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        All projects
      </Link>
      <div>
        <p className="text-sm text-slate-500">Project details</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {isLoading ? "Loading project..." : project?.projectName || "Project"}
        </h1>
      </div>
      <nav className="flex gap-6 overflow-x-auto border-b border-slate-200">
        <Link
          href={`${base}/projects/${projectId}`}
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Overview
        </Link>
        {["Workers", "Tasks", "Rates"].map((tab) => (
          <Link
            key={tab}
            href={`${base}/projects/${projectId}/${tab.toLowerCase()}`}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold ${active === tab ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            {tab}
          </Link>
        ))}
      </nav>
    </div>
  );
}
