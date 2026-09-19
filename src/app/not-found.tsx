import Link from "next/link";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="h-8 w-8" />
        </div>

        <span className="inline-block text-xs font-semibold tracking-wider text-primary uppercase mb-2">
          Error 404
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Page Not Found
        </h1>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Sorry, the page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[9px] border border-gray-200 dark:border-zinc-700 bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </div>    
    </div>
  );
}
