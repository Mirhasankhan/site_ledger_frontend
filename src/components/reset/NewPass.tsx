"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";

import { useRouter } from "next/navigation";
import { TLoginValues } from "@/types/common";
import { toast } from "react-toastify";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";
import Link from "next/link";

const NewPass = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetPassword] = useResetPasswordMutation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginValues>();

  const onSubmit: SubmitHandler<TLoginValues> = async (datas) => {
    const token = localStorage.getItem("forgetToken");
    if (datas.password !== datas.confirmPassword) {
      toast.error("Password didn't match");
      return;
    }
    setIsLoading(true);
    const data = {
      newPassword: datas.password,
      token,
    };
    try {
      const response = await resetPassword(data);
      console.log(response);

      if (response.data) {
        toast.success(response.data.message);
        router.push("/");
        setIsLoading(false);
        localStorage.removeItem("forgetToken");
      } else if (response.error) {
        if ("data" in response.error) {
          const errorData = response.error.data as { message?: string };
          toast.error(errorData.message || "Something went wrong.");
          setIsLoading(false);
        } else {
          toast.error("Unexpected error structure.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f8f8] min-h-screen flex items-center justify-center">
      <div className="mt-12 flex flex-col items-center w-full bg-white md:w-3/5 lg:w-2/5 xl:w-1/3 2xl:w-1/4 shadow-md mx-2 md:mx-auto p-5  rounded-[4px]">
        <div className="p-3 bg-blue-100 rounded-full">
          <Lock className="text-blue-800"></Lock>
        </div>
        <h1 className="text-xl font-medium py-2">Set New Password</h1>
        <p className="text-gray-600 text-center">
          Please create a new password for your account
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-[9px] pt-6 bg-white w-full"
        >
          <div className="mb-4 w-full">
            <label className="block pb-2 font-medium">New Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
              })}
              className="w-full p-2 border rounded-[4px]"
              placeholder="Enter new password"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="mb-4 w-full">
            <label className="block pb-2 font-medium">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Password is required",
              })}
              className="w-full p-2 border rounded-[4px]"
              placeholder="Retype password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="bg-primary text-white py-3 w-full font-medium rounded-[4px]"
          >
            {isLoading ? "updating...." : "Update Password"}
          </button>
        </form>
        <Link href="/auth/login" className="flex items-center gap-1 pt-6">
          <ArrowLeft size={15} /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default NewPass;
