"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useForgotPasswordMutation } from "@/redux/features/auth/authApi";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await forgotPassword(values).unwrap();
      setSent(true);
    } catch (error) {
      setError("root", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Unable to send reset instructions.",
      });
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="card-surface w-full max-w-md rounded-xl p-7 sm:p-9">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[9px] bg-amber-100 text-amber-700">
          <Mail size={21} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter your account email and we&apos;ll send a secure reset link.
        </p>
        {sent ? (
          <div className="mt-6 rounded-[6px] bg-green-50 p-4 text-sm text-green-700">
            Reset instructions sent. Check your email to continue.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            <div>
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Enter your email address"
                {...register("email")}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="rounded-[6px] bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.root.message}
              </p>
            )}
            <button
              className="btn-primary w-full"
              type="submit"
              disabled={isLoading}
            >
              <Send size={17} />
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
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
