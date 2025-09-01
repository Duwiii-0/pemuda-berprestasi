import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/authContext";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";

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

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

return (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10">
    {/* Login Container */}
    <div className="w-full max-w-sm mx-4 sm:max-w-md sm:mx-6 2xl:max-w-2xl 2xl:mx-8">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-7 md:p-8 2xl:p-10 2xl:py-16">
        
        {/* Header Section */}
        <div className="text-center mb-6 md:mb-8 2xl:mb-10">
          {/* Logo */}
          <div className="relative mb-4 md:mb-6 2xl:mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
            <img 
              src="src/assets/logo/logojv.png" 
              alt="Taekwondo Logo" 
              className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 2xl:h-28 2xl:w-28 mx-auto drop-shadow-md"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl leading-none tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                MASUK
              </span>
            </h1>
            <div className="w-10 md:w-14 2xl:w-20 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
            <p className="text-xs md:text-sm 2xl:text-base font-plex text-black/70 mt-2 md:mt-3 2xl:mt-4">
              Masuk ke akun Anda untuk mengakses platform
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 2xl:space-y-6">
          {/* Email Input */}
          <div className="space-y-1.5 2xl:space-y-2">
            <label className="text-xs md:text-sm 2xl:text-base font-plex font-medium text-black/80 block">
              Email Address
            </label>
            <div className="relative group">
              <TextInput
                className="h-11 md:h-12 2xl:h-14 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base 2xl:text-lg font-plex pl-10 md:pl-12 2xl:pl-14 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
              <Mail className="absolute left-3 md:left-4 2xl:left-5 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 2xl:space-y-2">
            <label className="text-xs md:text-sm 2xl:text-base font-plex font-medium text-black/80 block">
              Password
            </label>
            <div className="relative group">
              <TextInput
                className="h-11 md:h-12 2xl:h-14 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base 2xl:text-lg font-plex pl-10 md:pl-12 2xl:pl-14 pr-10 md:pr-12 2xl:pr-14 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                placeholder="your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
              <KeyRound className="absolute left-3 md:left-4 2xl:left-5 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 md:right-4 2xl:right-5 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link 
              to="/resetpassword" 
              className="text-xs md:text-sm 2xl:text-base font-plex text-black/60 hover:text-red underline underline-offset-2 transition-colors duration-300"
            >
              Lupa Password?
            </Link>
          </div>
          
          {/* Login Button */}
          <div className="pt-2 md:pt-3 2xl:pt-4">
            <GeneralButton
              type="submit"
              label={loading ? "Masuk..." : "Login"}
              disabled={loading || !email || !password}
              onClick={handleLogin}
              className="w-full h-11 md:h-12 2xl:h-14 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red rounded-xl text-white text-sm md:text-base 2xl:text-lg font-plex font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            />
          </div>
          
          {/* Register Link */}
          <div className="text-center pt-3 md:pt-4 2xl:pt-5">
            <p className="text-xs md:text-sm 2xl:text-base font-plex text-black/70">
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