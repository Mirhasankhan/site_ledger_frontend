"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  useEffect(
    () =>
      setToken(new URLSearchParams(window.location.search).get("token") || ""),
    [],
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!token) {
      setError("root", { message: "The reset link is missing its token." });
      return;
    }
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      window.location.assign("/login");
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "This reset link is invalid or expired.",
      });
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="card-surface w-full max-w-md rounded-xl p-7 sm:p-9">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <KeyRound size={21} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your new password must be at least six characters.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div>
            <label className="form-label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              {...register("password")}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}
          <button
            className="btn-primary w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update password"}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-amber-700"
        >
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
