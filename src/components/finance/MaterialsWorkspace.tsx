"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Boxes,
  PackagePlus,
  Plus,
  Send,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useListProjectsQuery } from "@/redux/features/projects/projectApi";
import {
  useCreateMaterialMutation,
  useCreateMaterialPurchaseMutation,
  useCreateMaterialRequestMutation,
  useCreateMaterialUsageMutation,
  useListMaterialRequestsQuery,
  useListMaterialsQuery,
  useReviewMaterialRequestMutation,
} from "@/redux/features/finance/financeApi";

const categories = [
  "Cement",
  "Brick",
  "Sand",
  "Steel",
  "Paint",
  "Tiles",
  "Wood",
  "Pipes",
  "Electrical",
  "Other",
] as const;
const units = [
  "Bag",
  "Piece",
  "Kg",
  "Ton",
  "Liter",
  "Meter",
  "CubicFeet",
  "Unit",
] as const;
const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(categories),
  unit: z.enum(units),
  unitCost: z
    .string()
    .refine((value) => Number(value) > 0, "Cost must be positive"),
  minimumStock: z
    .string()
    .refine((value) => Number(value) >= 0, "Threshold cannot be negative"),
  supplier: z.string().optional(),
  location: z.string().optional(),
});
const movementSchema = z.object({
  quantity: z
    .string()
    .refine((value) => Number(value) > 0, "Quantity must be positive"),
  unitCost: z.string().optional(),
  supplier: z.string().optional(),
  projectId: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});
const requestSchema = z.object({
  materialId: z.string().min(1, "Choose a material"),
  projectId: z.string().min(1, "Choose a project"),
  quantity: z
    .string()
    .refine((value) => Number(value) > 0, "Quantity must be positive"),
  requiredDate: z.string().optional(),
  reason: z.string().optional(),
});
function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { message?: string } })?.data?.message || fallback;
}

export default function MaterialsWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const canManage = role !== "WORKER";
  const {
    data: materialsData,
    isLoading,
    isError,
    refetch,
  } = useListMaterialsQuery("");
  const { data: projectsData } = useListProjectsQuery("");
  const projects = projectsData?.data ?? [];
  const materials = materialsData?.data ?? [];
  const { data: requestsData } = useListMaterialRequestsQuery("", {
    skip: !canManage,
  });
  const requests = requestsData?.data ?? [];
  const [createMaterial, { isLoading: creating }] = useCreateMaterialMutation();
  const [purchase, { isLoading: purchasing }] =
    useCreateMaterialPurchaseMutation();
  const [usage, { isLoading: using }] = useCreateMaterialUsageMutation();
  const [createRequest, { isLoading: requesting }] =
    useCreateMaterialRequestMutation();
  const [reviewRequest, { isLoading: reviewing }] =
    useReviewMaterialRequestMutation();
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    register: registerMaterial,
    handleSubmit: submitMaterial,
    reset: resetMaterial,
    setError: materialError,
    formState: { errors: materialErrors },
  } = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      category: "Cement",
      unit: "Unit",
      unitCost: "",
      minimumStock: "0",
    },
  });
  const {
    register: registerMovement,
    handleSubmit: submitMovement,
    reset: resetMovement,
    setError: movementError,
    formState: { errors: movementErrors },
  } = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
  });
  const {
    register: registerRequest,
    handleSubmit: submitRequest,
    reset: resetRequest,
    setError: requestError,
    formState: { errors: requestErrors },
  } = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
  });
  const onCreateMaterial = async (values: z.infer<typeof materialSchema>) => {
    try {
      await createMaterial({
        ...values,
        unitCost: Number(values.unitCost),
        minimumStock: Number(values.minimumStock),
      }).unwrap();
      resetMaterial({
        category: "Cement",
        unit: "Unit",
        unitCost: "",
        minimumStock: "0",
        name: "",
        supplier: "",
        location: "",
      });
      setShowMaterialForm(false);
    } catch (error) {
      materialError("root", {
        message: errorMessage(error, "Material could not be created."),
      });
    }
  };
  const onPurchase = async (values: z.infer<typeof movementSchema>) => {
    if (!selectedMaterial) return;
    try {
      await purchase({
        id: selectedMaterial,
        body: {
          quantity: Number(values.quantity),
          unitCost: Number(values.unitCost),
          supplier: values.supplier || undefined,
          date: values.date || undefined,
        },
      }).unwrap();
      resetMovement();
    } catch (error) {
      movementError("root", {
        message: errorMessage(error, "Purchase could not be recorded."),
      });
    }
  };
  const onUsage = async (values: z.infer<typeof movementSchema>) => {
    if (!selectedMaterial || !values.projectId) return;
    try {
      await usage({
        id: selectedMaterial,
        body: {
          projectId: values.projectId,
          quantityUsed: Number(values.quantity),
          date: values.date || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap();
      resetMovement();
      setActionError("");
    } catch (error) {
      setActionError(
        errorMessage(
          error,
          "Usage could not be recorded. Check current stock and project access.",
        ),
      );
    }
  };
  const onRequest = async (values: z.infer<typeof requestSchema>) => {
    try {
      await createRequest({
        ...values,
        quantity: Number(values.quantity),
      }).unwrap();
      resetRequest();
    } catch (error) {
      requestError("root", {
        message: errorMessage(
          error,
          "Material request could not be submitted.",
        ),
      });
    }
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Supply chain
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Materials
          </h1>
          <p className="mt-2 text-slate-500">
            Monitor stock, record movement, and keep project requests moving.
          </p>
        </div>
        {canManage && (
          <button
            className="btn-primary"
            onClick={() => setShowMaterialForm((value) => !value)}
          >
            <Plus size={17} />
            {showMaterialForm ? "Close form" : "Add material"}
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface rounded-[9px] p-5">
          <p className="text-sm text-slate-500">Catalog items</p>
          <p className="mt-2 text-3xl font-semibold">{materials.length}</p>
        </div>
        <div className="card-surface rounded-[9px] p-5">
          <p className="text-sm text-slate-500">Low stock alerts</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">
            {
              materials.filter(
                (material: any) =>
                  Number(material.currentStock) <=
                  Number(material.minimumStock),
              ).length
            }
          </p>
        </div>
        <div className="card-surface rounded-[9px] p-5">
          <p className="text-sm text-slate-500">Open requests</p>
          <p className="mt-2 text-3xl font-semibold">
            {
              requests.filter((request: any) => request.status === "Pending")
                .length
            }
          </p>
        </div>
      </div>
      {showMaterialForm && (
        <section className="card-surface rounded-[9px] p-6">
          <form
            onSubmit={submitMaterial(onCreateMaterial)}
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <label className="form-label" htmlFor="material-name">
                Name
              </label>
              <input
                id="material-name"
                className="form-input"
                {...registerMaterial("name")}
              />
              {materialErrors.name && (
                <p className="form-error">{materialErrors.name.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="material-category">
                Category
              </label>
              <select
                id="material-category"
                className="form-input"
                {...registerMaterial("category")}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="material-unit">
                Unit
              </label>
              <select
                id="material-unit"
                className="form-input"
                {...registerMaterial("unit")}
              >
                {units.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="unitCost">
                Unit cost
              </label>
              <input
                id="unitCost"
                type="number"
                className="form-input"
                {...registerMaterial("unitCost")}
              />
              {materialErrors.unitCost && (
                <p className="form-error">{materialErrors.unitCost.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="minimumStock">
                Minimum stock
              </label>
              <input
                id="minimumStock"
                type="number"
                className="form-input"
                {...registerMaterial("minimumStock")}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="supplier">
                Supplier
              </label>
              <input
                id="supplier"
                className="form-input"
                {...registerMaterial("supplier")}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className="form-input"
                {...registerMaterial("location")}
              />
            </div>
            {materialErrors.root && (
              <p className="text-sm text-red-700 md:col-span-3">
                {materialErrors.root.message}
              </p>
            )}
            <div className="md:col-span-3">
              <button className="btn-primary" disabled={creating} type="submit">
                <PackagePlus size={17} />
                {creating ? "Saving..." : "Create material"}
              </button>
            </div>
          </form>
        </section>
      )}
      <section>
        {isLoading ? (
          <div className="card-surface h-64 animate-pulse rounded-[9px] bg-slate-100" />
        ) : isError ? (
          <div className="card-surface rounded-[9px] p-8 text-center">
            <AlertCircle className="mx-auto text-red-600" size={24} />
            <p className="mt-3 font-semibold">Inventory could not be loaded</p>
            <button className="mt-4 btn-secondary" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="card-surface rounded-[9px] border-dashed p-10 text-center">
            <Boxes className="mx-auto text-slate-400" size={28} />
            <p className="mt-3 font-semibold">No materials in inventory</p>
          </div>
        ) : (
          <div className="card-surface overflow-hidden rounded-[9px]">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.3fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Material</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Unit cost</span>
              <span>Actions</span>
            </div>
            {materials.map((material: any) => {
              const low =
                Number(material.currentStock) <= Number(material.minimumStock);
              return (
                <div
                  key={material.id}
                  className="table-row-hover flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.3fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{material.name}</p>
                    <p className="text-xs text-slate-500">
                      {material.location || "No location"}
                    </p>
                    {low && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <TriangleAlert size={13} />
                        Low stock
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-slate-600">
                    {material.category}
                  </span>
                  <span className="text-sm font-semibold">
                    {material.currentStock} {material.unit}
                  </span>
                  <span className="text-sm text-slate-600">
                    {material.unitCost}
                  </span>
                  {canManage && (
                    <select
                      className="form-input"
                      value={
                        selectedMaterial === material.id ? material.id : ""
                      }
                      onChange={(event) =>
                        setSelectedMaterial(event.target.value)
                      }
                    >
                      <option value="">Manage...</option>
                      <option value={material.id}>Use selected below</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      {canManage && (
        <>
          <section className="grid gap-5 lg:grid-cols-2">
            <form
              onSubmit={submitMovement(onPurchase)}
              className="card-surface rounded-[9px] p-5"
            >
              <h2 className="font-semibold">Record purchase</h2>
              <select
                className="form-input mt-4"
                value={selectedMaterial}
                onChange={(event) => setSelectedMaterial(event.target.value)}
              >
                <option value="">Select material</option>
                {materials.map((material: any) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Quantity"
                  {...registerMovement("quantity")}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Unit cost"
                  {...registerMovement("unitCost")}
                />
                <input
                  className="form-input"
                  placeholder="Supplier"
                  {...registerMovement("supplier")}
                />
                <input
                  className="form-input"
                  type="date"
                  {...registerMovement("date")}
                />
              </div>
              {movementErrors.root && (
                <p className="mt-3 text-sm text-red-700">
                  {movementErrors.root.message}
                </p>
              )}
              <button
                className="btn-primary mt-4"
                disabled={!selectedMaterial || purchasing}
                type="submit"
              >
                <PackagePlus size={17} />
                {purchasing ? "Recording..." : "Record purchase"}
              </button>
            </form>
            <form
              onSubmit={submitMovement(onUsage)}
              className="card-surface rounded-[9px] p-5"
            >
              <h2 className="font-semibold">Log usage</h2>
              <select
                className="form-input mt-4"
                value={selectedMaterial}
                onChange={(event) => setSelectedMaterial(event.target.value)}
              >
                <option value="">Select material</option>
                {materials.map((material: any) => (
                  <option key={material.id} value={material.id}>
                    {material.name} · {material.currentStock} available
                  </option>
                ))}
              </select>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Quantity used"
                  {...registerMovement("quantity")}
                />
                <select
                  className="form-input"
                  {...registerMovement("projectId")}
                >
                  <option value="">Project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
                <input
                  className="form-input"
                  type="date"
                  {...registerMovement("date")}
                />
                <input
                  className="form-input"
                  placeholder="Usage note"
                  {...registerMovement("notes")}
                />
              </div>
              {actionError && (
                <p className="mt-3 text-sm text-red-700">{actionError}</p>
              )}
              <button
                className="btn-primary mt-4"
                disabled={!selectedMaterial || using}
                type="submit"
              >
                <Send size={17} />
                {using ? "Logging..." : "Log usage"}
              </button>
            </form>
          </section>
          <section className="card-surface rounded-[9px] p-5">
            <h2 className="font-semibold">Request material for a project</h2>
            <form
              onSubmit={submitRequest(onRequest)}
              className="mt-4 grid gap-4 md:grid-cols-4"
            >
              <select className="form-input" {...registerRequest("materialId")}>
                <option value="">Material</option>
                {materials.map((material: any) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
              <select className="form-input" {...registerRequest("projectId")}>
                <option value="">Project</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
              <input
                className="form-input"
                type="number"
                placeholder="Quantity"
                {...registerRequest("quantity")}
              />
              <input
                className="form-input"
                type="date"
                {...registerRequest("requiredDate")}
              />
              <input
                className="form-input md:col-span-3"
                placeholder="Reason"
                {...registerRequest("reason")}
              />
              <button
                className="btn-primary"
                disabled={requesting}
                type="submit"
              >
                {requesting ? "Submitting..." : "Submit request"}
              </button>
            </form>
            {requestErrors.root && (
              <p className="mt-3 text-sm text-red-700">
                {requestErrors.root.message}
              </p>
            )}
          </section>
          <section className="card-surface overflow-hidden rounded-[9px]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold">Material requests</h2>
            </div>
            {requests.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No material requests found.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {request.material?.name || request.materialId} ·{" "}
                        {request.quantity}
                      </p>
                      <p className="text-xs text-slate-500">
                        {request.project?.projectName || request.projectId} ·{" "}
                        {request.status}
                      </p>
                    </div>
                    {request.status === "Pending" && (
                      <select
                        className="form-input max-w-32"
                        defaultValue=""
                        disabled={reviewing}
                        onChange={async (event) => {
                          if (!event.target.value) return;
                          await reviewRequest({
                            id: request.id,
                            body: { status: event.target.value },
                          }).unwrap();
                        }}
                      >
                        <option value="">Review</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                        <option>Fulfilled</option>
                        <option>Cancelled</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
