import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("Password baru tidak boleh sama dengan password lama");
      return;
    }

    // TODO: panggil API reset password di sini
    toast.success("Password berhasil direset (dummy)!");
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-10 sm:px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[32vw] rounded-xl flex flex-col justify-center items-center gap-8 pt-0 font-plex ">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img
            src="src/assets/logo/taekwondo.png"
            alt="taekwondo logo"
            className="h-50 w-50"
          />
          <label className="font-bebas text-6xl text-red text-center">Reset Password</label>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <TextInput
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="h-12 border-red"
              placeholder="your old password"
              icon={<Mail className="text-black" size={20} />}
            />
          </div>

          <div className="w-full">
            <TextInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12  border-red"
              placeholder="your new password"
              icon={<KeyRound className="text-black" size={20} />}
            />
          </div>

          <div className="w-full flex flex-col gap-2">
            <GeneralButton
              label="Reset"
              type={ "submit" as any }
              className="w-full bg-red border-2 border-red h-12 rounded-xl text-white text-lg font-semibold hover:scale-101 transition-discrete duration-300 hover:shadow-xl"
            />
            <Link to="/login" className="pl-1 underline hover:text-red">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
