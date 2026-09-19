"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "@/redux/features/projects/projectApi";

const schema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectCode: z.string().optional(),
  managerId: z.string().min(1, "Manager ID is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().min(1, "Description is required"),
  projectImage: z.string().min(1, "Project image is required"),
  budget: z
    .string()
    .refine((value) => Number(value) >= 0, "Budget cannot be negative"),
  status: z.enum(["Ongoing", "Paused", "Completed"]),
  standardWorkHours: z
    .string()
    .refine((value) => Number(value) >= 1, "Must be at least one hour"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const initialValues: Values = {
  projectName: "",
  projectCode: "",
  managerId: "",
  address: "",
  description: "",
  projectImage: "",
  budget: "0",
  status: "Ongoing",
  standardWorkHours: "8",
  startDate: "",
  endDate: "",
};

export default function ProjectForm({
  project,
}: {
  project?: Partial<Values> & { id?: string };
}) {
  const router = useRouter();
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ...initialValues, ...project },
  });
  const isLoading = creating || updating;
  const onSubmit = async (values: Values) => {
    try {
      const body = {
        ...values,
        budget: Number(values.budget),
        standardWorkHours: Number(values.standardWorkHours),
        projectCode: values.projectCode || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      };
      if (project?.id) {
        await updateProject({ id: project.id, body }).unwrap();
        router.push(`/admin/projects/${project.id}`);
      } else {
        const result = await createProject(body).unwrap();
        router.push(`/admin/projects/${result.data.id}`);
      }
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Unable to save project.",
      });
    }
  };
  const field = (
    name: keyof Values,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className="form-input"
        {...register(name)}
      />
      {errors[name] && <p className="form-error">{errors[name]?.message}</p>}
    </div>
  );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {field("projectName", "Project name", "text", "North Tower Retrofit")}
        {field("projectCode", "Project code", "text", "NTR-01")}
        {field(
          "managerId",
          "Site manager ID",
          "text",
          "Paste the SITE_MANAGER user ID",
        )}
        {field("address", "Address", "text", "Project site address")}
        {field(
          "projectImage",
          "Project image",
          "text",
          "Filename or uploaded URL",
        )}
        {field("budget", "Budget", "number", "0")}
        {field("standardWorkHours", "Standard work hours", "number", "8")}
        {field("startDate", "Start date", "date")}
        {field("endDate", "End date", "date")}
        <div>
          <label className="form-label" htmlFor="status">
            Status
          </label>
          <select id="status" className="form-input" {...register("status")}>
            <option value="Ongoing">Ongoing</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>
          {errors.status && (
            <p className="form-error">{errors.status.message}</p>
          )}
        </div>
      </div>
      <div>
        {field(
          "description",
          "Description",
          "text",
          "What is this project delivering?",
        )}
      </div>
      {errors.root && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          <Save size={17} />
          {isLoading
            ? "Saving..."
            : project?.id
              ? "Save changes"
              : "Create project"}
        </button>
      </div>
    </form>
  );
}
