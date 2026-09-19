"use client";

import Container from "@/utils/Container";
import Link from "next/link";
import Image from "next/image";
import { useProfileQuery } from "@/redux/features/auth/authApi";
import { User } from "lucide-react";
import { useState } from "react";
import EditProfileModal from "./EditProfileModal";
import SignOut from "./SignOut";

const Header = () => {
    const { data: profileData, isLoading } = useProfileQuery("", {
        refetchOnMountOrArgChange: true,
    });

    const [isEditOpen, setIsEditOpen] = useState(false);

    const user = profileData?.result || profileData?.data;

    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 dark:bg-zinc-950/90 dark:border-zinc-800">
            <Container>
                <div className="flex justify-between items-center py-3.5">
                    {/* Logo */}
                    <Link
                        style={{
                            fontFamily: "'Satisfy', cursive",
                        }}
                        href="/"
                        className="flex text-green-600 text-xl md:text-3xl font-bold items-center gap-2"
                    >
                        <span className="tracking-wide">Flowboard</span>
                    </Link>

                    {/* User Profile & Edit Option */}
                    <div className="flex items-center gap-3.5">
                        {isLoading ? (
                            <div className="flex items-center gap-2.5 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                <div className="hidden sm:block space-y-1.5">
                                    <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                                    <div className="h-2.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                                </div>
                            </div>
                        ) : user ? (
                            <div className="flex items-center">
                                <div className="flex items-center gap-3">
                                    {/* Clickable Profile Card */}
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(true)}
                                        className="group flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition hover:bg-zinc-100/80 dark:hover:bg-zinc-900"
                                        title="Click to edit profile"
                                    >
                                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-sm transition group-hover:ring-2 group-hover:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-800 shrink-0">
                                            {user?.profileImage ? (
                                                <Image
                                                    src={user.profileImage}
                                                    alt={user.fullName || "User"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center font-bold text-sm text-zinc-600 dark:text-zinc-300">
                                                    {user?.fullName ? (
                                                        user.fullName.charAt(0).toUpperCase()
                                                    ) : (
                                                        <User className="h-5 w-5" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                {user?.fullName || "User"}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
                                                {user?.email || ""}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                                {
                                    user && <SignOut />
                                }
                            </div>
                        ) : null}
                    </div>

                </div>
            </Container>

            {/* Edit Profile Modal */}
            {user && (
                <EditProfileModal
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    currentName={user?.fullName || ""}
                    currentImage={user?.profileImage || null}
                    email={user?.email || ""}
                />
            )}

        </header>
    );
};

export default Header;
