"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useListTasksQuery,
} from "@/redux/features/projects/projectApi";
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
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  status: z.enum(["To_Do", "In_Progress", "Blocked", "Completed", "Cancelled"]),
  progress: z
    .string()
    .refine(
      (value) =>
        Number.isInteger(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 100,
      "Enter a whole number from 0 to 100",
    ),
});
export default function ProjectTasks({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } = useListTasksQuery(
    `projectId=${projectId}`,
  );
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation();
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "Medium", status: "To_Do", progress: "0" },
  });
  const tasks = data?.data ?? [];
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createTask({
        projectId,
        ...values,
        progress: Number(values.progress),
      }).unwrap();
      reset({
        priority: "Medium",
        status: "To_Do",
        progress: "0",
        title: "",
        description: "",
      });
      setShowForm(false);
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Unable to create task.",
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">Project details</p>
          <h2 className="mt-1 text-2xl font-semibold">Tasks</h2>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus size={17} />
          {showForm ? "Close form" : "New task"}
        </button>
      </div>
      {showForm && (
        <section className="card-surface rounded-[9px] p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  placeholder="e.g. Install second floor plumbing"
                  className="form-input"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="progress">
                  Progress
                </label>
                <input
                  id="progress"
                  type="number"
                  placeholder="0"
                  className="form-input"
                  {...register("progress")}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  className="form-input"
                  {...register("priority")}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="form-input"
                  {...register("status")}
                >
                  <option value="To_Do">To do</option>
                  <option value="In_Progress">In progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Detailed description of the task requirements..."
                className="form-input min-h-24"
                {...register("description")}
              />
            </div>
            {errors.root && (
              <p className="text-sm text-red-700">{errors.root.message}</p>
            )}
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Creating..." : "Create task"}
            </button>
          </form>
        </section>
      )}
      {isLoading ? (
        <div className="card-surface h-48 animate-pulse rounded-[9px] bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-[9px] p-8 text-center">
          <AlertCircle className="mx-auto text-red-600" size={24} />
          <p className="mt-3 font-semibold">Tasks could not be loaded</p>
          <button className="mt-4 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card-surface rounded-[9px] border-dashed p-10 text-center text-sm text-slate-500">
          No tasks in this project.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task: any) => (
            <div key={task.id} className="card-surface rounded-[9px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.priority} · {task.status}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This task and its assignments will be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleting}
                        onClick={() => deleteTask(task.id)}
                      >
                        {deleting ? "Deleting..." : "Delete task"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${task.progress || 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {task.progress || 0}% complete
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
