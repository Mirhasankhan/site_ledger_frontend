import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
} from "lucide-react";
import Link from "next/link";

const content = {
  ADMIN: {
    eyebrow: "Operations control",
    title: "Good morning, administrator.",
    description:
      "A concise view of the projects, people, and money moving through Siteledger.",
    metric: "12",
    metricLabel: "Active projects",
    action: "Create project",
    actionHref: "/admin/projects/new",
  },
  SITE_MANAGER: {
    eyebrow: "Site command",
    title: "Keep the day moving.",
    description:
      "Your managed projects, attendance, and open work in one place.",
    metric: "4",
    metricLabel: "Managed projects",
    action: "Open projects",
    actionHref: "/site-manager/projects",
  },
  WORKER: {
    eyebrow: "Your workday",
    title: "Know what matters next.",
    description:
      "Check attendance, follow assigned work, and keep the site team informed.",
    metric: "1",
    metricLabel: "Assigned project",
    action: "Check in",
    actionHref: "/worker/attendance",
  },
} as const;

export default function RoleOverview({ role }: { role: keyof typeof content }) {
  const item = content[role];
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            {item.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {item.title}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">{item.description}</p>
        </div>
        <Link href={item.actionHref} className="btn-primary">
          <Plus size={17} />
          {item.action}
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{item.metricLabel}</p>
            <FolderKanban className="text-amber-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold">{item.metric}</p>
          <p className="mt-1 text-xs text-slate-500">Current workspace scope</p>
        </div>
        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Today&apos;s status</p>
            <CheckCircle2 className="text-green-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold">On track</p>
          <p className="mt-1 text-xs text-slate-500">No urgent exceptions</p>
        </div>
        <div className="card-surface rounded-[9px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Recent activity</p>
            <Clock3 className="text-blue-600" size={19} />
          </div>
          <p className="mt-4 text-3xl font-semibold">8</p>
          <p className="mt-1 text-xs text-slate-500">
            Updates in the last 24 hours
          </p>
        </div>
      </div>
      <section className="card-surface rounded-[9px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live project activity will appear here as you work.
            </p>
          </div>
          <ArrowUpRight className="text-slate-400" size={20} />
        </div>
        <div className="mt-8 rounded-[6px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
          No recent activity to show.
        </div>
      </section>
    </div>
  );
}
