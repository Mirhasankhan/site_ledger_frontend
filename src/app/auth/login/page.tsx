"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import Link from "next/link";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      const response = await login(values).unwrap();
      const { accessToken, user } = response.data;
      Cookies.set("token", accessToken, { sameSite: "lax" });
      dispatch(
        setUser({
          id: user.id,
          name: user.userName,
          email: user.email,
          role: user.role,
          token: accessToken,
        }),
      );
      router.replace(
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "SITE_MANAGER"
            ? "/site-manager"
            : "/worker",
      );
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Unable to sign in. Check your credentials.";
      setError("root", { message });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden text-white lg:block">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">
            Siteledger
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            The site office, with a clearer line of sight.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Coordinate projects, people, attendance, materials, and payments
            from one working surface.
          </p>
        </section>
        <section className="card-surface mx-auto w-full max-w-md rounded-xl p-7 sm:p-9">
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <LockKeyhole size={21} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
              Welcome back
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to Siteledger
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.root.message}
              </p>
            )}
            <button
              className="btn-primary w-full"
              disabled={isLoading}
              type="submit"
            >
              <LogIn size={17} />
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <Link
            href="/forgot-password"
            className="mt-6 block text-center text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            Forgot your password?
          </Link>
        </section>
      </div>
    </main>
  );
}
