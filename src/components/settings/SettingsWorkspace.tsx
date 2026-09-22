"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/redux/features/auth/authApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser, useCurrentUser } from "@/redux/features/auth/authSlice";
import {
  Camera,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Shield,
  UploadCloud,
  User,
  Briefcase,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface SettingsWorkspaceProps {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}

const roleBadgeStyles: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: {
    bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200",
    text: "text-purple-700",
    label: "Administrator",
  },
  SITE_MANAGER: {
    bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200",
    text: "text-blue-700",
    label: "Site Manager",
  },
  WORKER: {
    bg: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200",
    text: "text-amber-800",
    label: "Worker",
  },
};

export default function SettingsWorkspace({ role }: SettingsWorkspaceProps) {
  const dispatch = useAppDispatch();
  const currentAuth = useAppSelector(useCurrentUser);

  const {
    data: profileResponse,
    isLoading,
    isError,
    refetch,
  } = useProfileQuery(undefined, { refetchOnMountOrArgChange: true });

  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const profile = profileResponse?.data || profileResponse?.result;
  const workerInfo = profile?.workerProfile;

  // Personal Info Form State
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  // Instant Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync form when profile data loads
  useEffect(() => {
    if (profile) {
      setUserName(profile.userName || "");
      setPhoneNumber(workerInfo?.phoneNumber || "");
      setPresentAddress(workerInfo?.presentAddress || "");
      setPermanentAddress(workerInfo?.permanentAddress || "");
    }
  }, [profile, workerInfo]);

  // Instant Avatar Upload on file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be smaller than 5MB");
      return;
    }

    // Temporary local preview
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);
    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await updateProfile(formData).unwrap();
      toast.success(res?.message || "Profile photo updated successfully!");
      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to upload profile photo to Cloudinary.";
      toast.error(msg);
      // Revert preview on error
      setPreviewUrl(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetProfileForm = () => {
    if (profile) {
      setUserName(profile.userName || "");
      setPhoneNumber(workerInfo?.phoneNumber || "");
      setPresentAddress(workerInfo?.presentAddress || "");
      setPermanentAddress(workerInfo?.permanentAddress || "");
    }
  };

  // Submit Personal Details (Name, Phone, Addresses)
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = userName.trim();
    if (!trimmedName) {
      toast.error("Full name cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("userName", trimmedName);
    formData.append("fullName", trimmedName);
    formData.append("name", trimmedName);

    if (phoneNumber.trim()) {
      formData.append("phone", phoneNumber.trim());
      formData.append("phoneNumber", phoneNumber.trim());
    }

    if (role === "WORKER") {
      if (presentAddress.trim()) {
        formData.append("presentAddress", presentAddress.trim());
      }
      if (permanentAddress.trim()) {
        formData.append("permanentAddress", permanentAddress.trim());
      }
    }

    try {
      const res = await updateProfile(formData).unwrap();
      toast.success(res?.message || "Profile details updated successfully!");

      // Update Redux user name if changed
      if (currentAuth?.token) {
        dispatch(
          setUser({
            id: currentAuth.id,
            name: trimmedName,
            email: currentAuth.email,
            token: currentAuth.token,
            role: currentAuth.role,
          })
        );
      }

      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Failed to update profile details.";
      toast.error(msg);
    }
  };

  // Submit Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      const res = await changePassword({
        oldPassword,
        newPassword,
      }).unwrap();

      toast.success(res?.message || "Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to change password. Please check your current password.";
      toast.error(msg);
    }
  };

  const currentDisplayImage = previewUrl || profile?.profileImage;
  const roleBadge = roleBadgeStyles[role] || roleBadgeStyles.WORKER;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 w-1/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-base font-semibold text-red-800">
          Failed to load profile details
        </p>
        <p className="mt-1 text-sm text-red-600">
          Please check your network connection and try again.
        </p>
        <button onClick={() => refetch()} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              Account & Preferences
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${roleBadge.bg}`}
            >
              {roleBadge.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 size={12} />
              {profile?.status || "Active"}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Settings
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
            Manage your personal profile, Cloudinary avatar, and account security.
          </p>
        </div>
      </div>

      {/* Profile Photo Card (Instant Cloudinary Upload) */}
      <div className="card-surface rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Profile Photo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a photo to update your avatar instantly on Cloudinary.
              </p>
            </div>
            {isUploadingAvatar && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                Uploading to Cloudinary...
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar circle with live preview and upload trigger */}
          <div className="relative group shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-2 ring-slate-200">
              {currentDisplayImage ? (
                <Image
                  src={currentDisplayImage}
                  alt={profile?.userName || "User Avatar"}
                  fill
                  sizes="112px"
                  className={`object-cover transition ${isUploadingAvatar ? "opacity-40" : ""}`}
                  unoptimized={!!previewUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-amber-500 font-bold text-3xl text-white">
                  {(profile?.userName || profile?.email || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}

              {/* Uploading Overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="mt-1 text-[10px] font-semibold">Saving...</span>
                </div>
              )}
            </div>

            {/* Camera Overlay Button */}
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg transition hover:bg-amber-700 hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Change Photo Instantly"
            >
              <Camera size={16} />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={isUploadingAvatar}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action Buttons & Cloudinary Notice */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
              >
                <UploadCloud size={15} />
                {isUploadingAvatar ? "Uploading..." : "Choose new photo"}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Cloud size={13} className="text-amber-600 shrink-0" />
              <span>
                Uploads immediately upon selection. Supports JPG, PNG, WEBP up to 5MB.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Details Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-8">
        <div className="card-surface rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your personal name and contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Full Name / Username */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-1.5">
                <User size={15} className="text-slate-400" />
                Full Name / Username
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isUpdatingProfile}
                className="form-input"
                required
              />
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-1.5">
                <Mail size={15} className="text-slate-400" />
                Email Address
                <span className="ml-auto text-[11px] font-normal text-slate-400 flex items-center gap-1">
                  <Lock size={11} />
                  Read only
                </span>
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="form-input bg-slate-100/70 text-slate-500 cursor-not-allowed border-slate-200"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-1.5">
                <Phone size={15} className="text-slate-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +1 (555) 000-1234"
                disabled={isUpdatingProfile}
                className="form-input"
              />
            </div>

            {/* Role Display */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-1.5">
                <Shield size={15} className="text-slate-400" />
                Assigned Role
              </label>
              <div className="flex h-[42px] items-center rounded-[6px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 font-medium">
                {roleBadge.label}
              </div>
            </div>
          </div>

          {/* Worker Specific Fields */}
          {role === "WORKER" && (
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Worker Address Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Residential address recorded for compliance and job assignments.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="form-label flex items-center gap-1.5">
                    <MapPin size={15} className="text-slate-400" />
                    Present Address
                  </label>
                  <input
                    type="text"
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    placeholder="Enter current residential address"
                    disabled={isUpdatingProfile}
                    className="form-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="form-label flex items-center gap-1.5">
                    <MapPin size={15} className="text-slate-400" />
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="Enter permanent home address"
                    disabled={isUpdatingProfile}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Worker Financial & Profile Overview */}
              {workerInfo && (
                <div className="pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Worker Summary
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Briefcase size={15} className="text-amber-600" />
                        Category
                      </div>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {workerInfo.workerCategory || "Standard"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <DollarSign size={15} className="text-emerald-600" />
                        Daily Rate
                      </div>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        ${workerInfo.dailyRate ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <TrendingUp size={15} className="text-blue-600" />
                        Current Earnings
                      </div>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        ${workerInfo.currentEarnings ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Controls for Profile Details */}
          <div className="flex flex-col-reverse items-center justify-end gap-3 pt-4 border-t border-slate-100 sm:flex-row">
            <button
              type="button"
              onClick={handleResetProfileForm}
              disabled={isUpdatingProfile}
              className="btn-secondary w-full sm:w-auto"
            >
              <RotateCcw size={15} />
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={isUpdatingProfile || !userName.trim()}
              className="btn-primary w-full sm:w-auto min-w-[150px]"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Details
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Security & Change Password Card */}
      <div className="card-surface rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <KeyRound size={17} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Change Password
              </h2>
              <p className="text-xs text-slate-500">
                Ensure your account stays secure by using a strong password.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center justify-between">
                <span>Current Password</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={isChangingPassword}
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[11px] text-slate-400">Min 6 chars</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isChangingPassword}
                  className="form-input pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="form-label flex items-center justify-between">
                <span>Confirm New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={isChangingPassword}
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Match / Validation Indicator */}
          {newPassword && confirmPassword && (
            <div className="text-xs">
              {newPassword === confirmPassword ? (
                <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 size={13} />
                  Passwords match
                </p>
              ) : (
                <p className="text-red-500 font-medium">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {/* Action Buttons for Password Change */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                isChangingPassword ||
                !oldPassword ||
                !newPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="btn-primary w-full sm:w-auto min-w-[170px]"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
