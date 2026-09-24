"use client";

import {
  AlertCircle,
  KanbanSquare,
  List,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  useCreateTaskMutation,
  useListProjectsQuery,
  useListTasksQuery,
  useListWorkersQuery,
  useUpdateTaskMutation,
} from "@/redux/features/projects/projectApi";

const columns = [
  "To_Do",
  "In_Progress",
  "Blocked",
  "Completed",
  "Cancelled",
] as const;

const workerColumns = [
  "To_Do",
  "In_Progress",
  "Completed",
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProjectId, setCreateProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState("");
  const [createError, setCreateError] = useState("");

  const { data, isLoading, isError, refetch } = useListTasksQuery(
    mode === "kanban" ? "kanban=true" : "",
  );
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];

  const { data: workersData } = useListWorkersQuery(
    createProjectId ? `projectId=${createProjectId}&limit=100` : "limit=100",
  );
  const availableWorkers = workersData?.data ?? [];

  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();

  const tasks = data?.data ?? [];
  const board = data?.data && !Array.isArray(data.data) ? data.data : null;
  const list = Array.isArray(tasks) ? tasks : Object.values(tasks).flat();

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateTask({ id, body: { status } }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update task status");
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      await updateTask({ id, body: { progress } }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update task progress");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const targetProject = createProjectId || projects[0]?.id;
    if (!targetProject) {
      setCreateError("Please select a project.");
      return;
    }
    if (!title.trim()) {
      setCreateError("Task title is required.");
      return;
    }

    try {
      await createTask({
        projectId: targetProject,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        workerIds: assignedWorkerId ? [assignedWorkerId] : [],
      }).unwrap();

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedWorkerId("");
    } catch (err: any) {
      setCreateError(err?.data?.message || "Failed to create task.");
    }
  };

  const isWorker = role === "WORKER";
  const allowedStatuses = isWorker ? workerColumns : columns;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Work management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-2 text-slate-500">
            {isWorker
              ? "Track and update progress on your assigned tasks."
              : "Scan the work queue, assign tasks, or move through status columns."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isWorker && (
            <button
              className="btn-primary"
              onClick={() => {
                setCreateProjectId(projects[0]?.id || "");
                setShowCreateModal(true);
              }}
            >
              <Plus size={17} />
              Create task
            </button>
          )}
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
          <div className="grid grid-cols-[1.5fr_1.1fr_0.8fr_1fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Task</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Progress</span>
          </div>
          {list.map((task: any) => (
            <div
              key={task.id}
              className="table-row-hover grid grid-cols-[1.5fr_1.1fr_0.8fr_1fr] items-center px-5 py-4 text-sm"
            >
              <div>
                <span className="font-semibold text-slate-900">{task.title}</span>
                {task.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {task.description}
                  </p>
                )}
                {task.project?.projectName && (
                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                    {task.project.projectName}
                  </p>
                )}
              </div>
              <div>
                <select
                  className="form-input max-w-36 text-xs"
                  value={task.status}
                  disabled={updating}
                  onChange={(event) =>
                    updateStatus(task.id, event.target.value)
                  }
                >
                  {allowedStatuses.map((column) => (
                    <option key={column} value={column}>
                      {labels[column] || column}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    task.priority === "Urgent"
                      ? "bg-rose-100 text-rose-800"
                      : task.priority === "High"
                        ? "bg-amber-100 text-amber-800"
                        : task.priority === "Medium"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={task.progress || 0}
                  className="h-1.5 w-24 cursor-pointer accent-amber-600"
                  onChange={(e) =>
                    updateProgress(task.id, parseInt(e.target.value, 10))
                  }
                />
                <span className="w-8 text-xs font-medium text-slate-700">
                  {task.progress || 0}%
                </span>
              </div>
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
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((task: any) => (
                    <article
                      key={task.id}
                      className="rounded-[6px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            task.priority === "Urgent"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "High"
                                ? "bg-amber-100 text-amber-800"
                                : task.priority === "Medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="font-medium text-slate-700">
                          {task.progress || 0}%
                        </span>
                      </div>

                      <div className="mt-3">
                        <label className="text-[11px] font-medium text-slate-500">
                          Update status:
                        </label>
                        <select
                          className="form-input mt-1 text-xs"
                          value={task.status}
                          disabled={updating}
                          onChange={(event) =>
                            updateStatus(task.id, event.target.value)
                          }
                        >
                          {allowedStatuses.map((item) => (
                            <option key={item} value={item}>
                              {labels[item] || item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">
                          Progress:
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={task.progress || 0}
                          className="h-1.5 flex-1 cursor-pointer accent-amber-600"
                          onChange={(e) =>
                            updateProgress(task.id, parseInt(e.target.value, 10))
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg rounded-[12px] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Create New Task</h3>
                <p className="text-xs text-slate-500">Add an operational task to a project</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-5 space-y-4">
              {createError && (
                <div className="rounded-[6px] bg-rose-50 p-3 text-xs text-rose-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="form-label" htmlFor="task-project">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  id="task-project"
                  className="form-input"
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  required
                >
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="task-title">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="task-title"
                  className="form-input"
                  placeholder="e.g., Foundation Rebar Inspection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="task-desc">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  className="form-input min-h-20"
                  placeholder="Details, safety instructions, or technical specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label" htmlFor="task-priority">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    className="form-input"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as "Low" | "Medium" | "High" | "Urgent")
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" htmlFor="task-due">
                    Due Date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="task-assignee">
                  Assign Worker (Optional)
                </label>
                <select
                  id="task-assignee"
                  className="form-input"
                  value={assignedWorkerId}
                  onChange={(e) => setAssignedWorkerId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {availableWorkers.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.worker?.userName || "Worker"} ({w.workerCategory || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
