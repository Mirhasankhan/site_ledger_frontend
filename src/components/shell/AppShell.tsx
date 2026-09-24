"use client";

import { useCurrentUser, logOut } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useProfileQuery } from "@/redux/features/auth/authApi";
import {
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  LogOut,
  MessageSquare,
  PanelLeft,
  FileText,
  ListTodo,
  Receipt,
  Boxes,
  WalletCards,
  CalendarHeart,
  Users,
  Activity,
  Settings,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useState } from "react";

const navigation = [
  {
    label: "Overview",
    href: "",
    icon: BarChart3,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: ClipboardCheck,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListTodo,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Daily reports",
    href: "/daily-reports",
    icon: FileText,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
    roles: ["ADMIN", "SITE_MANAGER"],
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    roles: ["ADMIN", "SITE_MANAGER"],
  },
  {
    label: "Materials",
    href: "/materials",
    icon: Boxes,
    roles: ["ADMIN", "SITE_MANAGER"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: WalletCards,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Leave",
    href: "/leave",
    icon: CalendarHeart,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Messages",
    href: "/chat",
    icon: MessageSquare,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN", "SITE_MANAGER", "WORKER"],
  },
];

const roleLabels = {
  ADMIN: "Administrator",
  SITE_MANAGER: "Site manager",
  WORKER: "Worker",
} as const;

export default function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector(useCurrentUser);
  const dispatch = useAppDispatch();
  const { data: profileResponse } = useProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse?.result;
  const displayName = profile?.userName || user.name || "Siteledger user";
  const profileImage = profile?.profileImage;

  const [mobileOpen, setMobileOpen] = useState(false);
  const base =
    role === "ADMIN"
      ? "/admin"
      : role === "SITE_MANAGER"
        ? "/site-manager"
        : "/worker";

  const signOut = () => {
    dispatch(logOut());
    Cookies.remove("token");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-950 px-4 py-5 text-slate-300 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2">
          <Link
            href={base}
            className="text-xl font-semibold tracking-tight text-white"
          >
            site<span className="text-amber-400">ledger</span>
          </Link>
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <PanelLeft size={19} />
          </button>
        </div>
        <div className="mt-10 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <nav className="mt-3 space-y-1">
            {navigation
              .filter((item) => item.roles.includes(role))
              .map((item) => {
                let itemHref = item.href;
                let itemLabel = item.label;
                if (item.href === "/payments") {
                  if (role === "WORKER") {
                    itemHref = "/earnings";
                    itemLabel = "Earnings & Payouts";
                  } else {
                    itemLabel = "Payroll & Payouts";
                  }
                }
                const href = `${base}${itemHref}`;
                const active =
                  pathname === href ||
                  (item.href === "/payments" &&
                    role === "WORKER" &&
                    (pathname === `${base}/earnings` ||
                      pathname === `${base}/payments`)) ||
                  (item.href === "/people" && pathname === `${base}/workers`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm transition ${active ? "bg-amber-500 text-white" : "hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon size={17} />
                    {itemLabel}
                  </Link>
                );
              })}
          </nav>
        </div>
        <div className="absolute bottom-5 left-4 right-4 border-t border-white/10 pt-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 lg:hidden"
            aria-label="Open navigation"
          >
            <PanelLeft size={20} />
          </button>
          <Link
            href={`${base}/settings`}
            className="group ml-auto flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-100/80"
            title="Open settings"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{roleLabels[role]}</p>
            </div>
            <div className="relative flex h-9 w-9 overflow-hidden items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800 ring-2 ring-transparent group-hover:ring-amber-500/30 transition shrink-0">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                (displayName || user.email || "S").slice(0, 1).toUpperCase()
              )}
            </div>
          </Link>
        </header>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

