"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  useAcceptInviteMutation,
  useVerifyInviteQuery,
} from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

const schema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type Values = z.infer<typeof schema>;

export default function AcceptInvitePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [token, setToken] = useState("");
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();
  useEffect(
    () =>
      setToken(new URLSearchParams(window.location.search).get("token") || ""),
    [],
  );
  const { data, isLoading, isError, error } = useVerifyInviteQuery(token, {
    skip: !token,
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      userName: "",
      password: "",
      confirmPassword: "",
    },
  });
  const invite = data?.data;
  const errorMessage =
    (error as { data?: { message?: string } })?.data?.message ||
    "This invite link is invalid or expired.";

  const onSubmit = async (values: Values) => {
    try {
      const response = await acceptInvite({
        token,
        userName: values.userName.trim(),
        password: values.password,
      }).unwrap();
      Cookies.set("token", response.data.accessToken, { sameSite: "lax" });
      dispatch(
        setUser({
          id: response.data.user.id,
          name: response.data.user.userName,
          email: response.data.user.email,
          role: response.data.user.role,
          token: response.data.accessToken,
        }),
      );
      router.replace(
        response.data.user.role === "ADMIN"
          ? "/admin"
          : response.data.user.role === "SITE_MANAGER"
            ? "/site-manager"
            : "/worker",
      );
    } catch (submitError) {
      setError("root", {
        message:
          (submitError as { data?: { message?: string } })?.data?.message ||
          "Unable to accept this invite.",
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="card-surface w-full max-w-lg rounded-xl p-7 sm:p-9">
        <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-[9px] bg-amber-100 text-amber-700">
          <ShieldCheck size={22} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Invitation
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Set up your account
        </h1>
        {!token || isLoading ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={18} />
            Verifying your invitation...
          </div>
        ) : isError || !invite ? (
          <div className="mt-6 rounded-[6px] bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="invite-email">
                  Invited Email
                </label>
                <input
                  id="invite-email"
                  placeholder="name@example.com"
                  className="form-input bg-slate-900/50 text-slate-400"
                  value={invite.email}
                  disabled
                />
              </div>
              <div>
                <label className="form-label" htmlFor="invite-role">
                  Assigned Role
                </label>
                <input
                  id="invite-role"
                  placeholder="Assigned role"
                  className="form-input bg-slate-900/50 text-slate-400"
                  value={invite.role.replace("_", " ")}
                  disabled
                />
              </div>
              {invite.workerCategory && (
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="invite-category">
                    Worker category
                  </label>
                  <input
                    id="invite-category"
                    placeholder="Worker category"
                    className="form-input bg-slate-900/50 text-slate-400"
                    value={invite.workerCategory.replace("_", " ")}
                    disabled
                  />
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="form-label" htmlFor="userName">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Enter your full name"
                  className="form-input"
                  {...register("userName")}
                />
                {errors.userName && (
                  <p className="form-error">{errors.userName.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="form-input"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  className="form-input"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>
              {errors.root && (
                <p className="rounded-[6px] bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errors.root.message}
                </p>
              )}
              <button
                className="btn-primary w-full"
                disabled={isAccepting}
                type="submit"
              >
                <CheckCircle2 size={17} />
                {isAccepting ? "Activating account..." : "Accept invitation"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
