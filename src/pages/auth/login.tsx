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

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-20 bg-white h-screen md:h-[50vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[42vw] rounded-xl flex flex-col justify-center items-center gap-8 border-3 border-yellow py-10 font-inter">
        <label className="font-bebas text-6xl">login</label>

        <div className="w-full flex flex-col gap-4">
          <div className="w-full">
            <label className="pl-2">Email address</label>
            <TextInput
              className="h-12 placeholder-red"
              placeholder="your email address"
              icon={<Mail className="text-red" size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="w-full">
            <label className="pl-2">Password</label>
            <TextInput
              className="h-12 placeholder:text-cyan-300"
              placeholder="your password"
              icon={<KeyRound className="text-red" size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Link to="/" className="flex justify-end hover:text-red underline">
            Forgot Password?
          </Link>
        </div>

        <div className="w-full flex flex-col gap-2">
          <GeneralButton
            label="Login"
            type="action"
            onClick={handleLogin}
            className="w-full bg-red border-2 border-red h-12 text-white round-lg font-semibold"
          />
          <Link to="/register" className="pl-1 underline hover:text-red">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
