// Update bagian ini di src/pages/auth/login.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, isAdmin, isPelatih } = useAuth(); // tambah props ini
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Update handleLogin untuk async
  const handleLogin = async () => {
    try {
      await login(email, password); // sekarang async
      // Navigation akan dihandle di useEffect bawah
    } catch (error: any) {
      toast.error(error.message || 'Email atau password salah');
    }
  };

  // Auto redirect setelah login berhasil
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/dashboard");
        toast.success("Login berhasil sebagai Admin!");
      } else if (isPelatih) {
        navigate("/");
        toast.success("Login berhasil sebagai Pelatih!");
      }
    }
  }, [isAuthenticated, isAdmin, isPelatih, navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  // Rest of your component stays the same, just add loading state to button:
  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('src/assets/photos/login.jpg')" }}
    >
      <div className="px-10 sm:px-25 bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[80vh] w-full md:w-[72vw] lg:w-[56vw] xl:w-[32vw] rounded-xl flex flex-col justify-center items-center gap-8 pt-0 font-plex ">
        
        {/* Logo + Title */}
        <div className="flex flex-col gap-2 justify-center items-center">
          <img src="src/assets/logo/taekwondo.png" alt="taekwondo logo" className="h-50 w-50"/>
          <label className="font-bebas text-6xl text-red">Masuk</label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full">
            <TextInput
              className="h-12 border-red"
              placeholder="your email address"
              icon={<Mail className="text-black" size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading} // tambah ini
            />
          </div>

          <div className="w-full">
            <TextInput
              className="h-12  border-red"
              placeholder="your password"
              icon={<KeyRound className="text-black" size={20} />}
              type="password" // tambah ini untuk hide password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading} // tambah ini
            />
          </div>

          <div className="w-full text-end">
          <Link to="/resetpassword" className="hover:text-red underline">
            Forgot Password?
          </Link>
          </div>
          
          <GeneralButton
            label={loading ? "Masuk..." : "Login"} // update label
            type={"submit" as any}
            disabled={loading} // tambah disabled state
            className="active:scale-97 w-full bg-red border-2 border-red h-12 rounded-xl text-white text-lg font-semibold hover:scale-101 transition-discrete duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          <span className="text-center">
            Dont have an account? 
           <Link to="/register" className="pl-1 underline hover:text-red">
             Register here
           </Link>
          </span>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
            <p className="font-medium text-yellow-800">Demo Akun:</p>
            <p className="text-yellow-700">Admin: admin@example.com / admin123</p>
            <p className="text-yellow-700">Pelatih: pelatih@example.com / pelatih123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;