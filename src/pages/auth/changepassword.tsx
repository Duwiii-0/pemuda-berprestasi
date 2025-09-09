import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";
import Logo from '../../assets/logo/logo.png';
import { apiClient } from "../../config/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validasi frontend
    if (!email || !newPassword || !confirmNewPassword) {
      toast.error("Semua field harus diisi");
      return;
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    // Validasi pattern (minimal satu huruf dan satu angka)
    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      toast.error("Password baru harus mengandung minimal satu huruf dan satu angka");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiClient.post('/auth/reset-password', {
        email,
        newPassword,
        confirmNewPassword
      });

      if (data.success) {
        toast.success("Password berhasil direset!");
        
        // Reset form
        setEmail("");
        setNewPassword("");
        setConfirmNewPassword("");
        
        // Redirect ke login setelah berhasil
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        throw new Error(data.message || 'Gagal mereset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Handle specific error messages
      if (error.status === 404 || error.data?.message === 'Email not found') {
        toast.error("Email tidak terdaftar dalam sistem");
      } else if (error.data?.message === 'Password confirmation does not match') {
        toast.error("Konfirmasi password tidak cocok");
      } else if (error.data?.message?.includes('validation')) {
        toast.error("Data yang dimasukkan tidak valid");
      } else {
        toast.error(error.data?.message || error.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10">
      {/* Reset Password Container */}
      <div className="w-full max-w-sm mx-4 sm:max-w-md sm:mx-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-7 md:p-8">
          
          {/* Header Section */}
          <div className="text-center mb-6 md:mb-8">
            {/* Logo */}
            <div className="relative mb-4 md:mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
              <img 
                src={Logo}
                alt="Taekwondo Logo" 
                className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto drop-shadow-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl leading-none tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  RESET PASSWORD
                </span>
              </h1>
              <div className="w-16 md:w-24 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
              <p className="text-xs md:text-sm font-plex text-black/70 mt-2 md:mt-3">
                Masukkan email dan password baru untuk reset akun Anda
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Email <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Masukkan email Anda"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Password Baru <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-10 md:pr-12 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Masukkan password baru"
                  disabled={isLoading}
                />
                <KeyRound className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Konfirmasi Password Baru <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-10 md:pr-12 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Konfirmasi password baru"
                  disabled={isLoading}
                />
                <KeyRound className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-50/70 border border-amber-200/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-amber-900 mb-2">Syarat Password Baru:</p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Minimal 8 karakter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Mengandung minimal satu huruf dan satu angka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Email harus terdaftar di sistem</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Konfirmasi password harus sama</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Reset Password Button */}
            <div className="pt-2 md:pt-3">
              <GeneralButton
                label={isLoading ? "Mereset Password..." : "Reset Password"}
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 md:h-12 rounded-xl text-white text-sm md:text-base font-plex font-semibold transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 active:scale-[0.98]"
                }`}
              />
            </div>
            
            {/* Navigation Links */}
            <div className="text-center pt-3 md:pt-4 space-y-2">
              <p className="text-xs md:text-sm font-plex text-black/70">
                Sudah ingat password?{" "}
                <Link 
                  to="/login" 
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;