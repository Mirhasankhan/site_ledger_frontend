"use client";
import { useVerifyOtpMutation } from "@/redux/features/auth/authApi";
import { KeySquare } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const VerifyOtp = ({ setActive }: { setActive: (value: string) => void }) => {
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const email = localStorage.getItem("email");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState({
    d1: "",
    d2: "",
    d3: "",
    d4: "",
  });

  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const rawValue = e.target.value;
    const value = rawValue.slice(0, 1);

    if (!/^\d?$/.test(value)) return;

    const field = `d${index + 1}` as keyof typeof otp;
    const newOtp = { ...otp, [field]: value };
    setOtp(newOtp);

    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpString = Object.values(otp).join("");
  const isComplete = otpString.length == 4;

  const handleVerify = async () => {
    const verifyData = {
      email,
      otp: otpString,
    };
    const response: any = await verifyOtp(verifyData);   

    if (response.data) {
      localStorage.removeItem("email");
      localStorage.setItem("forgetToken", response.data?.data?.accessToken);
      toast.success("Otp verified successfully");
      setActive("reset");
    } else {
      toast.error(response.error.data.message);
    }
  };

  return (
    <div className="bg-[#f8f8f8] min-h-screen flex items-center justify-center">
      <div className="mt-12 flex flex-col items-center w-full bg-white md:w-3/5 lg:w-2/5 xl:w-1/3 2xl:w-1/4 shadow-md mx-2 md:mx-auto p-3 rounded-[4px]">
        <div className="p-3 bg-blue-100 rounded-full">
          <KeySquare size={30} className="text-blue-800" />
        </div>
        <h1 className="text-xl font-medium py-2">Verify OTP</h1>
        <p className="text-gray-600">
          We&apos;ve sent a 4-digit verification code to
        </p>
        <p className="text-secondary">{email}</p>

        <div className="flex flex-col items-center gap-4">
          <div className="flex mt-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`w-12 h-12 text-center text-xl border-2 rounded-[4px] focus:outline-none transition 
                ${
                  focusedIndex === i
                    ? "border-primary shadow-md"
                    : "border-gray-300"
                }`}
                value={otp[`d${i + 1}` as keyof typeof otp]}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={() => setFocusedIndex(i)}
                disabled={i !== 0 && !otp[`d${i}` as keyof typeof otp]}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={!isComplete || isLoading}
            className={`mt-2 w-full py-2 rounded-[4px] text-white font-semibold transition 
            ${isComplete ? "bg-primary" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <p className="text-gray-600">Didn&apos;t receive the code?</p>
          <p className="text-secondary cursor-pointer">
            Resend verification code
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
