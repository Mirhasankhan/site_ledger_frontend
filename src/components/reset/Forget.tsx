"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { TLoginValues } from "@/types/common";
import { useSendOtpMutation } from "@/redux/features/auth/authApi";

const ForgetPassword = ({
  setActive,
}: {
  setActive: (value: string) => void;
}) => {
  const [sendOpt, { isLoading }] = useSendOtpMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginValues>();

  const onSubmit: SubmitHandler<TLoginValues> = async (data) => {
    try {
      const response: any = await sendOpt({ email: data.email });

      if (response.data) {
        toast.success(response.data.message);
        setActive("verify");
        localStorage.setItem("email", data.email);
      } else {
        toast.error(response.error.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="bg-[#f8f8f8] min-h-screen flex items-center justify-center px-3">
      <div className="mt-12 flex flex-col items-center w-full max-w-md bg-white shadow-md p-6 rounded-[4px]">
        <div className="p-3 bg-blue-100 rounded-full">
          <Mail size={30} className="text-blue-800" />
        </div>

        <h1 className="text-xl font-medium py-2">Reset Password</h1>
        <p className="text-gray-600 text-center text-sm sm:text-base">
          Enter your email address and we&apos;ll send you a verification code
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-[9px] pt-6 bg-white w-full"
        >
          <div className="mb-4">
            <label className="block pb-2 font-medium">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
              })}
              className="w-full p-2 border rounded-[4px]"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="bg-primary text-white py-3 w-full font-medium rounded-[4px]"
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin mx-auto" />
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        <Link href="/auth/login" className="flex items-center gap-1 pt-6 text-sm">
          <ArrowLeft size={15} /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgetPassword;
