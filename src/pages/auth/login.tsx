import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";
import Logo from '../../assets/logo/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      toast.error("Email dan password harus diisi");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Format email tidak valid");
      return;
    }

    try {
      const result = await login(email, password);
      
      // Check if login was successful
      if (result && (result as any).success !== false) {
        toast.success("Login berhasil!");
        
        // Don't navigate here, let useEffect handle it after state updates
      }
    } catch (error: any) {
      toast.error('Email atau password salah');
    }
  };

  // Handle redirect after successful authentication
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTimeout = setTimeout(() => {
        // Check user role and redirect accordingly
        if (user.role === 'ADMIN') {
          navigate("/admin", { replace: true });
          toast.success("Login berhasil sebagai Admin!");
        } else if (user.role === 'PELATIH') {
          navigate("/", { replace: true });
          toast.success("Login berhasil sebagai Pelatih!");
        } else {
          // Default redirect for other users
          navigate("/", { replace: true });
          toast.success("Login berhasil!");
        }
      }, 500);

      return () => clearTimeout(redirectTimeout);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

return (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 p-3 sm:p-4">
    {/* Mobile-Optimized Login Container */}
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md 2xl:max-w-2xl">
      <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8 2xl:p-10 2xl:py-16">
        
        {/* Compact Header Section */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 2xl:mb-10">
          {/* Smaller Logo */}
          <div className="relative mb-3 sm:mb-4 md:mb-6 2xl:mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
            <img 
              src={Logo}
              alt="Taekwondo Logo" 
              className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 2xl:h-28 2xl:w-28 mx-auto drop-shadow-md"
            />
          </div>

          {/* Compact Title */}
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="font-bebas text-2xl sm:text-3xl md:text-4xl 2xl:text-6xl leading-none tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                MASUK
              </span>
            </h1>
            <div className="w-8 sm:w-10 md:w-14 2xl:w-20 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
            <p className="text-xs sm:text-xs md:text-sm 2xl:text-base font-plex text-black/70 mt-1.5 sm:mt-2 md:mt-3 2xl:mt-4 px-2">
              Masuk ke akun Anda untuk mengakses platform
            </p>
          </div>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5 2xl:space-y-6">
          {/* Email Input - Mobile Optimized */}
          <div className="space-y-1 sm:space-y-1.5 2xl:space-y-2">
            <label className="text-xs sm:text-xs md:text-sm 2xl:text-base font-plex font-medium text-black/80 block">
              Email Address
            </label>
            <div className="relative group">
              <TextInput
                className="h-9 sm:h-10 md:h-11 2xl:h-14 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-xs sm:text-sm md:text-base 2xl:text-lg font-plex pl-8 sm:pl-9 md:pl-10 2xl:pl-14 pr-3 sm:pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Mail className="absolute left-2.5 sm:left-3 md:left-3 2xl:left-5 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={14} />
            </div>
          </div>

          {/* Password Input - Mobile Optimized */}
          <div className="space-y-1 sm:space-y-1.5 2xl:space-y-2">
            <label className="text-xs sm:text-xs md:text-sm 2xl:text-base font-plex font-medium text-black/80 block">
              Password
            </label>
            <div className="relative group">
              <TextInput
                className="h-9 sm:h-10 md:h-11 2xl:h-14 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-xs sm:text-sm md:text-base 2xl:text-lg font-plex pl-8 sm:pl-9 md:pl-10 2xl:pl-14 pr-8 sm:pr-9 md:pr-10 2xl:pr-14 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                placeholder="your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <KeyRound className="absolute left-2.5 sm:left-3 md:left-3 2xl:left-5 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={14} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 md:right-3 2xl:right-5 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Compact Forgot Password */}
          <div className="text-right">
            <Link 
              to="/resetpassword" 
              className="text-xs sm:text-xs md:text-sm 2xl:text-base font-plex text-black/60 hover:text-red underline underline-offset-2 transition-colors duration-300"
            >
              Lupa Password?
            </Link>
          </div>
          
          {/* Compact Login Button */}
          <div className="pt-1.5 sm:pt-2 md:pt-3 2xl:pt-4">
            <GeneralButton
              type="submit"
              label={loading ? "Masuk..." : "Login"}
              disabled={loading || !email || !password}
              onClick={handleLogin}
              className="w-full h-9 sm:h-10 md:h-11 2xl:h-14 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red rounded-lg sm:rounded-xl text-white text-xs sm:text-sm md:text-base 2xl:text-lg font-plex font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            />
          </div>
          
          {/* Compact Register Link */}
          <div className="text-center pt-2 sm:pt-3 md:pt-4 2xl:pt-5">
            <p className="text-xs sm:text-xs md:text-sm 2xl:text-base font-plex text-black/70">
              Belum punya akun?{" "}
              <Link 
                to="/register" 
                className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
);

};

export default Login;