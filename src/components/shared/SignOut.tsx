import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const SignOut = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const logOut = () => {
    dispatch(
      setUser({
        name: "",
        email: "",
        role: "",
        token: "",
      })
    );
    Cookies.remove("token");

    router.push("/auth/login");
  };
  return (
    <button
      onClick={() => logOut()}
      className="bg-transparent border text-red-600 border-red-600 px-3 md:px-5 py-2 rounded-[6px]"
    >
      
      Sign Out
    </button>
  );
};

export default SignOut;
