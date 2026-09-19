import { BellOff, CircleAlert } from "lucide-react";

export default function NotificationsUnavailable() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Notifications
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Notifications are not connected yet
        </h1>
        <p className="mt-3 text-slate-500">
          The current backend has no notification endpoint or notification
          model. This view will become live once that API contract exists.
        </p>
      </div>
      <section className="card-surface rounded-[9px] p-8">
        <BellOff className="text-slate-400" size={28} />
        <div className="mt-5 flex gap-3 rounded-[6px] bg-amber-50 p-4 text-sm text-amber-800">
          <CircleAlert className="mt-0.5 shrink-0" size={17} />
          <p>
            No client-side notification data is being fabricated. Activity
            updates are available from the Activity feed.
          </p>
        </div>
      </section>
    </div>
  );
}
