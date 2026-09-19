"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateProjectRateMutation,
  useGetProjectRatesQuery,
} from "@/redux/features/projects/projectApi";

const categories = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Cleaner",
  "Mechanic",
  "HVAC_Technician",
  "Mason",
  "Welder",
] as const;
const schema = z.object({
  category: z.enum(categories),
  dailyRate: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Enter a non-negative whole number",
    ),
  overtimeRate: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      "Enter a non-negative whole number",
    ),
});
export default function ProjectRates({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } = useGetProjectRatesQuery({
    projectId,
  });
  const [createRate, { isLoading: saving }] = useCreateProjectRateMutation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { category: "Mason", dailyRate: "0", overtimeRate: "" },
  });
  const rates = data?.data ?? [];
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createRate({
        projectId,
        body: {
          category: values.category,
          dailyRate: Number(values.dailyRate),
          overtimeRate: values.overtimeRate
            ? Number(values.overtimeRate)
            : undefined,
        },
      }).unwrap();
      reset({ category: values.category, dailyRate: "0", overtimeRate: "" });
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Unable to configure rate.",
      });
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Project details</p>
        <h2 className="mt-1 text-2xl font-semibold">Worker rates</h2>
        <p className="mt-2 text-sm text-slate-500">
          Rates are historical. Saving a category creates a new active rate and
          deactivates the previous one.
        </p>
      </div>
      <section className="card-surface rounded-lg p-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end"
        >
          <div>
            <label className="form-label" htmlFor="category">
              Worker category
            </label>
            <select
              id="category"
              className="form-input"
              {...register("category")}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="dailyRate">
              Daily rate
            </label>
            <input
              id="dailyRate"
              type="number"
              className="form-input"
              {...register("dailyRate")}
            />
            {errors.dailyRate && (
              <p className="form-error">{errors.dailyRate.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="overtimeRate">
              Overtime rate
            </label>
            <input
              id="overtimeRate"
              type="number"
              className="form-input"
              {...register("overtimeRate")}
            />
          </div>
          <button className="btn-primary" disabled={saving} type="submit">
            <CircleDollarSign size={17} />
            {saving ? "Saving..." : "Set rate"}
          </button>
        </form>
        {errors.root && (
          <p className="mt-3 text-sm text-red-700">{errors.root.message}</p>
        )}
      </section>
      {isLoading ? (
        <div className="card-surface h-44 animate-pulse rounded-lg bg-slate-100" />
      ) : isError ? (
        <div className="card-surface rounded-lg p-8 text-center text-sm">
          <p>Rates could not be loaded.</p>
          <button className="mt-3 btn-secondary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : rates.length === 0 ? (
        <div className="card-surface rounded-lg border-dashed p-10 text-center text-sm text-slate-500">
          No active rates configured.
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-lg">
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Category</span>
            <span>Daily rate</span>
            <span>Effective from</span>
          </div>
          {rates.map((rate: any) => (
            <div
              key={rate.id}
              className="table-row-hover grid grid-cols-3 px-5 py-4 text-sm"
            >
              <span className="font-semibold">{rate.category}</span>
              <span>{rate.dailyRate}</span>
              <span className="text-slate-500">
                {new Date(rate.effectiveFrom).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
