import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";

const ResetPassword = () => {


  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[32vw] rounded-xl flex flex-col justify-center items-center gap-8 pt-0 font-inter ">
        <div className="flex flex-col gap-2 justify-center items-center">
            <img src="src/assets/logo/taekwondo.png" alt="taekwondo logo" className="h-50 w-50"/>
            <label className="font-bebas text-6xl text-red">Reset Password</label>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="w-full">
            <TextInput
              className="h-12 placeholder-red"
              placeholder="your old password"
              icon={<Mail className="text-black" size={20} />}
            />
          </div>

          <div className="w-full">
            <TextInput
              className="h-12 placeholder:text-cyan-300"
              placeholder="your new password"
              icon={<KeyRound className="text-black" size={20} />}
            />
          </div>

          <Link to="/" className="flex justify-end hover:text-red underline">
            Forgot Password?
          </Link>
        </div>

        <div className="w-full flex flex-col gap-2">
          <GeneralButton
            label="Reset"
            type="action"
            className="w-full bg-red border-2 border-red h-12 text-white round-lg font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
