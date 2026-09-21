"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Send, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateInviteMutation } from "@/redux/features/invites/inviteApi";

export const WORKER_CATEGORIES = [
  "Mason",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Cleaner",
  "Mechanic",
  "HVAC_Technician",
  "Welder",
] as const;

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"WORKER" | "SITE_MANAGER" | "ADMIN">("WORKER");
  const [workerCategory, setWorkerCategory] = useState<string>("Mason");
  const [createdInvite, setCreatedInvite] = useState<{
    email: string;
    role: string;
    expiresAt?: string;
  } | null>(null);

  const [createInvite, { isLoading }] = useCreateInviteMutation();

  const resetForm = () => {
    setEmail("");
    setRole("WORKER");
    setWorkerCategory("Mason");
    setCreatedInvite(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const payload: {
        email: string;
        role: "WORKER" | "SITE_MANAGER" | "ADMIN";
        workerCategory?: string;
      } = {
        email: email.trim().toLowerCase(),
        role,
      };

      if (role === "WORKER") {
        payload.workerCategory = workerCategory;
      }

      const res = await createInvite(payload).unwrap();
      toast.success(res.message || "Invitation email sent successfully");
      setCreatedInvite({
        email: res.data?.email || payload.email,
        role: res.data?.role || payload.role,
        expiresAt: res.data?.expiresAt,
      });
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to create invitation",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <UserPlus size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {createdInvite ? "Invitation Sent" : "Invite New Member"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {createdInvite
                  ? "The onboarding invitation has been emailed to the recipient."
                  : "Send an onboarding invitation to join your Siteledger team."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdInvite ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-base font-semibold text-emerald-950">
                Invitation Email Delivered
              </h3>
              <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed">
                An invitation email has been sent to{" "}
                <span className="font-semibold text-emerald-950">
                  {createdInvite.email}
                </span>{" "}
                with secure onboarding and account activation instructions.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-medium text-slate-800">{createdInvite.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-semibold text-amber-700">{createdInvite.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Link Validity:</span>
                <span className="text-slate-600">Expires in 7 days</span>
              </div>
            </div>

            <p className="text-[12px] text-slate-500 text-center">
              The recipient can click the button in their email to activate their account and set their password.
            </p>

            <DialogFooter className="mt-6 sm:justify-between">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary text-sm"
              >
                Invite Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary text-sm"
              >
                Done
              </button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="form-label" htmlFor="invite-email-input">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="invite-email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="form-input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="invite-role-select">
                Account Role <span className="text-red-500">*</span>
              </label>
              <select
                id="invite-role-select"
                className="form-input mt-1"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "WORKER" | "SITE_MANAGER" | "ADMIN")
                }
              >
                <option value="WORKER">Worker (Site Trades & Labor)</option>
                <option value="SITE_MANAGER">Site Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                {role === "WORKER"
                  ? "Can log attendance, view assigned tasks, and track earnings."
                  : role === "SITE_MANAGER"
                    ? "Can manage site projects, workers, materials, and reports."
                    : "Full system administration access across all projects."}
              </p>
            </div>

            {role === "WORKER" && (
              <div>
                <label className="form-label" htmlFor="invite-category-select">
                  Worker Trade / Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="invite-category-select"
                  className="form-input mt-1"
                  value={workerCategory}
                  onChange={(e) => setWorkerCategory(e.target.value)}
                  required
                >
                  {WORKER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-sm flex items-center gap-1.5"
                disabled={isLoading}
              >
                <UserPlus size={16} />
                {isLoading ? "Sending invitation email..." : "Send Invitation"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
