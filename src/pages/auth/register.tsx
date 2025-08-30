import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, User, Phone, Lock, IdCard, Eye, EyeOff, Building } from "lucide-react";
import Select from "react-select";
import GeneralButton from "../../components/generalButton";
import TextInput from "../../components/textInput";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { useDojang } from "../../context/dojangContext";


type OptionType = { value: string; label: string };

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth(); // Get register function from useAuth
  
  // Form states
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [telepon, setTelepon] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedDojang, setSelectedDojang] = useState<OptionType | null>(null);
  const { dojangOptions, isLoading: isDojangLoading, refreshDojang } = useDojang();
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
  // Fetch data dojang terbaru setiap kali halaman dibuka
  refreshDojang();
}, [refreshDojang]);


  // Handle registration
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      
      // Debug: Log semua data yang akan dikirim
      console.log('=== REGISTRATION DEBUG ===');
      console.log('Raw NIK value:', nik);
      console.log('NIK length:', nik.length);
      console.log('NIK type:', typeof nik);
      console.log('Is NIK valid digits?', /^\d+$/.test(nik));
      
      // Prepare data according to backend schema and API
      const registerData = {
        email: email.toLowerCase().trim(),
        password: password,
        confirmPassword: confirmPassword,
        nama_pelatih: nama.trim(),
        no_telp: telepon.trim(),
        nik: nik.trim(), // Pastikan NIK di-trim untuk menghilangkan spasi
        id_dojang: Number(selectedDojang?.value)
      };

      console.log('Final registration payload:', registerData);
      console.log('NIK in payload:', registerData.nik);
      console.log('===========================');

      // Use register method from useAuth context
      const result = await register(registerData);
      
      if (result.success) {
        toast.success("Registrasi berhasil! Silakan login.");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        throw new Error(result.message || 'Registrasi gagal');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Registrasi gagal';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation and submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check all required fields
    if (!nama || !email || !nik || !telepon || !password || !confirmPassword || !selectedDojang) {
      toast.error("Semua field harus terisi terlebih dahulu");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    // NIK validation (16 digits)
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      toast.error("NIK harus berupa 16 digit angka");
      return;
    }

    // Phone validation
    if (!/^(\+62|62|0)[0-9]{9,13}$/.test(telepon)) {
      toast.error("Format nomor telepon tidak valid");
      return;
    }

    // Password validation
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password harus mengandung minimal 1 huruf dan 1 angka");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      return;
    }

    handleRegister();
  };

  // Custom select styles matching the design
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      height: '44px',
      minHeight: '44px',
      border: `2px solid ${state.isFocused ? '#dc2626' : 'rgba(220, 38, 38, 0.25)'}`,
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(4px)',
      boxShadow: state.isFocused ? '0 4px 6px -1px rgba(220, 38, 38, 0.1)' : 'none',
      fontSize: '14px',
      fontFamily: 'Inter',
      paddingLeft: '40px',
      '&:hover': {
        border: `2px solid rgba(220, 38, 38, 0.4)`,
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      paddingLeft: '0',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'rgba(220, 38, 38, 0.5)',
      fontSize: '14px',
    }),
    menu: (base: any) => ({
      ...base,
      border: '2px solid rgba(220, 38, 38, 0.25)',
      borderRadius: '12px',
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      marginTop: '4px',
    }),
    menuList: (base: any) => ({
      ...base,
      maxHeight: '160px',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused 
        ? 'rgba(220, 38, 38, 0.1)' 
        : state.isSelected 
          ? '#dc2626' 
          : 'white',
      color: state.isSelected ? 'white' : 'black',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      '&:active': {
        backgroundColor: state.isSelected ? '#dc2626' : 'rgba(220, 38, 38, 0.2)',
      },
    }),
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 py-6 px-4">
      {/* Register Container */}
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-7 md:p-8">
          
          {/* Header Section */}
          <div className="text-center mb-6">
            {/* Logo */}
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
              <img 
                src="src/assets/logo/logojv.png" 
                alt="Taekwondo Logo" 
                className="relative h-12 w-12 sm:h-16 sm:w-16 mx-auto drop-shadow-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-bebas text-3xl sm:text-4xl leading-none tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  REGISTRASI
                </span>
              </h1>
              <div className="w-10 sm:w-14 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
              <p className="text-xs sm:text-sm font-plex text-black/70 mt-2">
                Daftar sebagai pelatih untuk bergabung dengan platform
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Nama Lengkap *
              </label>
              <div className="relative group">
                <TextInput
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Masukkan nama lengkap"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Email Address *
              </label>
              <div className="relative group">
                <TextInput
                  type="email"
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* NIK */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                NIK (16 digit) *
              </label>
              <div className="relative group">
                <TextInput
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="1234567890123456"
                  value={nik}
                  onChange={(e) => {
                    // Only allow numbers and limit to 16 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setNik(value);
                  }}
                  disabled={isLoading}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {nik.length}/16
                </div>
              </div>
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Nomor Telepon *
              </label>
              <div className="relative group">
                <TextInput
                  type="tel"
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="08xxxxxxxxxx"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  disabled={isLoading}
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Nama Dojang */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Nama Dojang *
              </label>
              <div className="relative group">
                <Select
                  options={dojangOptions}
                  value={selectedDojang}
                  onChange={setSelectedDojang}
                  placeholder="Pilih dojang..."
                  isSearchable
                  isDisabled={isLoading}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 pointer-events-none z-10" size={16} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Password *
              </label>
              <div className="relative group">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-10 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Min. 8 karakter, huruf & angka"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-plex font-medium text-black/80 block">
                Konfirmasi Password *
              </label>
              <div className="relative group">
                <TextInput
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-11 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm font-plex pl-10 pr-10 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-red transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Register Dojang Link */}
            <div className="text-right">
              <Link 
                to="/registerdojang" 
                className="text-xs sm:text-sm font-plex text-black/60 hover:text-red underline underline-offset-2 transition-colors duration-300"
              >
                Daftarkan dojang baru
              </Link>
            </div>
            
            {/* Register Button */}
            <div className="pt-2">
              <GeneralButton
                label={isLoading ? "Mendaftarkan..." : "Daftar"}
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red rounded-xl text-white text-sm font-plex font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              />
            </div>
            
            {/* Login Link */}
            <div className="text-center pt-3">
              <p className="text-xs sm:text-sm font-plex text-black/70">
                Sudah punya akun?{" "}
                <Link 
                  to="/login" 
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;