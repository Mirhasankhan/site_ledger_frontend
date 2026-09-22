"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Save,
  Trash2,
  UploadCloud,
  UserCheck,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  useCreateProjectMutation,
  useListSiteManagersQuery,
  useUpdateProjectMutation,
} from "@/redux/features/projects/projectApi";

const schema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectCode: z.string().optional(),
  managerId: z.string().min(1, "Please select a site manager"),
  address: z.string().min(1, "Address is required"),
  description: z.string().min(1, "Description is required"),
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

interface ProjectData extends Partial<Values> {
  id?: string;
  projectImage?: string;
}

const initialValues: Values = {
  projectName: "",
  projectCode: "",
  managerId: "",
  address: "",
  description: "",
  budget: "0",
  status: "Ongoing",
  standardWorkHours: "8",
  startDate: "",
  endDate: "",
};

export default function ProjectForm({ project }: { project?: ProjectData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const { data: managersData, isLoading: loadingManagers } =
    useListSiteManagersQuery();

  const siteManagers = managersData?.data || [];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    project?.projectImage || null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Format dates for HTML date input (YYYY-MM-DD)
  const defaultDates = {
    startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
    endDate: project?.endDate ? project.endDate.slice(0, 10) : "",
    budget:
      project?.budget !== undefined ? String(project.budget) : initialValues.budget,
    standardWorkHours:
      project?.standardWorkHours !== undefined
        ? String(project.standardWorkHours)
        : initialValues.standardWorkHours,
  };

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({

    resolver: zodResolver(schema),
    defaultValues: { ...initialValues, ...project, ...defaultDates },
  });

  const selectedManagerId = watch("managerId");
  const selectedManager = siteManagers.find(
    (m: any) => m.id === selectedManagerId,
  );

  // Sync image preview if project changes
  useEffect(() => {
    if (project?.projectImage && !selectedFile) {
      setPreviewUrl(project.projectImage);
    }
  }, [project?.projectImage, selectedFile]);

  const isLoading = creating || updating;

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image file size must be less than 5MB");
      toast.error("Image file must be smaller than 5MB");
      return;
    }
    setImageError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: Values) => {
    if (!selectedFile && !previewUrl) {
      setImageError("Project image is required for Cloudinary upload");
      toast.error("Please upload a project image");
      return;
    }

    try {
      const formData = new FormData();
      const jsonPayload: Record<string, any> = {
        projectName: values.projectName.trim(),
        managerId: values.managerId,
        address: values.address.trim(),
        description: values.description.trim(),
        budget: Number(values.budget),
        status: values.status,
        standardWorkHours: Number(values.standardWorkHours),
      };

      if (values.projectCode?.trim()) {
        jsonPayload.projectCode = values.projectCode.trim();
      }
      if (values.startDate) {
        jsonPayload.startDate = values.startDate;
      }
      if (values.endDate) {
        jsonPayload.endDate = values.endDate;
      }

      if (selectedFile) {
        formData.append("projectImage", selectedFile);
      } else if (previewUrl) {
        jsonPayload.projectImage = previewUrl;
      }

      formData.append("data", JSON.stringify(jsonPayload));

      if (project?.id) {
        const res = await updateProject({
          id: project.id,
          body: formData,
        }).unwrap();
        toast.success(res?.message || "Project updated successfully");
        router.push(`/admin/projects/${project.id}`);
      } else {
        const result = await createProject(formData).unwrap();
        toast.success(result?.message || "Project created successfully");
        router.push(`/admin/projects/${result.data.id}`);
      }
    } catch (error: any) {
      const errorMsg =
        error?.data?.message ||
        error?.message ||
        "Unable to save project. Please check the inputs.";
      setError("root", { message: errorMsg });
      toast.error(errorMsg);
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

        {/* Site Manager Select Field */}
        <div>
          <label className="form-label" htmlFor="managerId">
            Site Manager
          </label>
          <select
            id="managerId"
            className="form-input"
            disabled={loadingManagers}
            {...register("managerId")}
          >
            <option value="">
              {loadingManagers
                ? "Loading site managers..."
                : "Select an active site manager"}
            </option>
            {siteManagers.map((manager: any) => {
              const activeCount = manager._count?.managedProjects ?? 0;
              const assignmentBadge =
                activeCount > 0
                  ? `(${activeCount} assigned project${activeCount > 1 ? "s" : ""})`
                  : "(Available)";
              return (
                <option key={manager.id} value={manager.id}>
                  {manager.userName} — {assignmentBadge}
                </option>
              );
            })}
          </select>
          {errors.managerId && (
            <p className="form-error">{errors.managerId.message}</p>
          )}

          {/* Selected manager details or no managers hint */}
          {selectedManager ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
              <UserCheck size={14} className="text-amber-600" />
              <span>
                Assigned to: <strong>{selectedManager.userName}</strong> (
                {selectedManager.email})
              </span>
            </div>
          ) : !loadingManagers && siteManagers.length === 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle size={14} />
              <span>
                No active site managers found.{" "}
                <Link
                  href="/admin/people"
                  className="underline font-medium hover:text-amber-700"
                >
                  Invite or activate a Site Manager
                </Link>
              </span>
            </div>
          ) : null}
        </div>

        {field("address", "Address", "text", "Sector 10, Uttara, Dhaka")}
        {field("budget", "Budget ($)", "number", "500000")}
        {field("standardWorkHours", "Standard work hours per day", "number", "8")}
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

      {/* Cloudinary Project Image Upload Field */}
      <div>
        <label className="form-label">Project Image (Cloudinary Upload)</label>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <div className="mt-2 relative rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative h-28 w-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Project preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    {selectedFile ? "Ready to upload" : "Current image"}
                  </span>
                  {selectedFile && (
                    <span className="text-xs text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile ? selectedFile.name : "Uploaded to Cloudinary"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedFile
                    ? "Will be uploaded directly to Cloudinary upon saving."
                    : "This image is currently active for the project."}
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <UploadCloud size={14} />
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn-secondary !py-1 !px-2.5 text-xs text-red-600 hover:text-red-700 hover:border-red-200 inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-amber-500 bg-amber-50/50 scale-[0.99]"
                : imageError
                  ? "border-red-300 bg-red-50/30 hover:bg-red-50/50"
                  : "border-slate-300 hover:border-amber-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <UploadCloud size={24} />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-800">
              Click to select or drag and drop project photo
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG, WEBP or GIF up to 5MB. Automatically uploaded to Cloudinary.
            </p>
          </div>
        )}

        {imageError && <p className="form-error mt-1">{imageError}</p>}
      </div>

      <div>
        {field(
          "description",
          "Description",
          "text",
          "What is this project delivering? Scope, objectives, key phases...",
        )}
      </div>

      {errors.root && (
        <p className="rounded-[6px] bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errors.root.message}</span>
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
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
            ? "Uploading & Saving..."
            : project?.id
              ? "Save changes"
              : "Create project"}
        </button>
      </div>
    </form>
  );
}
