"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
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

  const [createInvite, { isLoading }] = useCreateInviteMutation();

  const resetForm = () => {
    setEmail("");
    setRole("WORKER");
    setWorkerCategory("Mason");
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
      handleClose();
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
                Invite New Member
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Send an onboarding invitation to join your Siteledger team.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
