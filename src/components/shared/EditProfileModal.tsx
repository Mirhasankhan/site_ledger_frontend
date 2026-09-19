"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateProfileMutation } from "@/redux/features/auth/authApi";
import { Camera, Loader2, User, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentImage: string | null;
  email?: string;
}

const EditProfileModal = ({
  open,
  onOpenChange,
  currentName,
  currentImage,
  email,
}: EditProfileModalProps) => {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [fullName, setFullName] = useState(currentName || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or currentName changes
  useEffect(() => {
    if (open) {
      setFullName(currentName || "");
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [open, currentName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", trimmed);
    if (selectedFile) {
      formData.append("profileImage", selectedFile);
    }

    try {
      const res = await updateProfile(formData).unwrap();
      toast.success(res?.message || "Profile updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Edit Profile
          </DialogTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Update your photo and personal details
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Avatar Upload Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt="Profile Preview"
                    fill
                    className="object-cover"
                    unoptimized={!!previewUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay to Trigger File Picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your full name"
              className="input-design"
            />
          </div>

          {/* Email (Read only) */}
          {email && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full rounded-[9px] border border-zinc-200 bg-zinc-100 px-3.5 py-2 text-sm text-zinc-500 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="rounded-[9px] border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="inline-flex items-center gap-1.5 rounded-[9px]  px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 bg-primary"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
