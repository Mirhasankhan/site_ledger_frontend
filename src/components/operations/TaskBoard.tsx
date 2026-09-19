"use client";

import { AlertCircle, KanbanSquare, List, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  useListTasksQuery,
  useUpdateTaskMutation,
} from "@/redux/features/projects/projectApi";

const columns = [
  "To_Do",
  "In_Progress",
  "Blocked",
  "Completed",
  "Cancelled",
] as const;
const labels: Record<string, string> = {
  To_Do: "To do",
  In_Progress: "In progress",
  Blocked: "Blocked",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export default function TaskBoard({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const [mode, setMode] = useState<"list" | "kanban">("kanban");
  const { data, isLoading, isError, refetch } = useListTasksQuery(
    mode === "kanban" ? "kanban=true" : "",
  );
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
  const tasks = data?.data ?? [];
  const board = data?.data && !Array.isArray(data.data) ? data.data : null;
  const list = Array.isArray(tasks) ? tasks : Object.values(tasks).flat();
  const updateStatus = async (id: string, status: string) => {
    await updateTask({ id, body: { status } }).unwrap();
  };
  const canUpdate = role !== "WORKER";
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Work management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-2 text-slate-500">
            Scan the work queue or move through status columns.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={mode === "list" ? "btn-primary" : "btn-secondary"}
            onClick={() => setMode("list")}
          >
            <List size={17} />
            List
          </button>
          <button
            className={mode === "kanban" ? "btn-primary" : "btn-secondary"}
            onClick={() => setMode("kanban")}
          >
            <KanbanSquare size={17} />
            Kanban
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-surface h-64 animate-pulse rounded-[9px] bg-slate-100" />
          <div className="card-surface h-64 animate-pulse rounded-[9px] bg-slate-100" />
          <div className="card-surface h-64 animate-pulse rounded-[9px] bg-slate-100" />
        </div>
      ) : isError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Tasks could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
          No tasks found in your project scope.
        </div>
      ) : mode === "list" ? (
        <div className="card-surface overflow-hidden rounded-[9px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Task</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Progress</span>
          </div>
          {list.map((task: any) => (
            <div
              key={task.id}
              className="table-row-hover grid grid-cols-[1.5fr_1fr_1fr_0.7fr] items-center px-5 py-4 text-sm"
            >
              <span className="font-semibold">{task.title}</span>
              {canUpdate ? (
                <select
                  className="form-input max-w-36"
                  value={task.status}
                  disabled={updating}
                  onChange={(event) =>
                    updateStatus(task.id, event.target.value)
                  }
                >
                  {columns.map((column) => (
                    <option key={column}>{column}</option>
                  ))}
                </select>
              ) : (
                <span className="text-slate-600">
                  {labels[task.status] || task.status}
                </span>
              )}
              <span className="text-slate-600">{task.priority}</span>
              <span className="text-slate-600">{task.progress || 0}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((column) => {
            const items = board
              ? board[column] || []
              : list.filter((task: any) => task.status === column);
            return (
              <section
                key={column}
                className="min-h-64 rounded-[9px] border border-slate-200 bg-slate-100/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{labels[column]}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((task: any) => (
                    <article
                      key={task.id}
                      className="rounded-[6px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {task.priority} · {task.progress || 0}%
                      </p>
                      {canUpdate && (
                        <select
                          className="form-input mt-3 text-xs"
                          value={task.status}
                          disabled={updating}
                          onChange={(event) =>
                            updateStatus(task.id, event.target.value)
                          }
                        >
                          {columns.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
