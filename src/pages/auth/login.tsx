import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const success = login(email, password);
    if (success) {
      navigate("/");
    } else {
      alert("Email atau password salah!");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // biar nggak reload page
    handleLogin();
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[32vw] rounded-xl flex flex-col justify-center items-center gap-8 pt-0 font-inter ">
        
        {/* Logo + Title */}
        <div className="flex flex-col gap-2 justify-center items-center">
          <img src="src/assets/logo/taekwondo.png" alt="taekwondo logo" className="h-50 w-50"/>
          <label className="font-bebas text-6xl text-red">Masuk</label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <TextInput
              className="h-12 placeholder-red"
              placeholder="your email address"
              icon={<Mail className="text-black" size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="w-full">
            <TextInput
              className="h-12 placeholder:text-red"
              placeholder="your password"
              icon={<KeyRound className="text-black" size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Link to="/resetpassword" className="flex justify-end hover:text-red underline">
            Forgot Password?
          </Link>

          <GeneralButton
            label="Login"
            type={"submit" as any}
            className="w-full bg-red border-2 border-red h-12 text-white round-lg font-semibold"
          />
        </form>

        {/* Register link */}
        <Link to="/register" className="pl-1 underline hover:text-red">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Login;
