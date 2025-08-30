import { useState } from "react";
import TextInput from "../../components/textInput";
import { Home, Phone, MapPin, Map, User, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../../pemuda-berprestasi-mvp/src/config/api";

const RegisterDojang = () => {
  const [namaDojang, setNamaDojang] = useState("");
  const [email, setEmail] = useState("");
  const [no_telp, setno_telp] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const payload = {
        nama_dojang: namaDojang.trim(),
        email: email.trim() || "",
        no_telp: no_telp.trim() || "",
        negara: negara.trim() || "",
        provinsi: provinsi.trim() || "",
        kota: kabupaten.trim() || "",
      };

      console.log("Sending payload:", payload);
      console.log("Payload yang dikirim ke backend:", payload);

      const response = await apiClient.post("/dojang", payload);

      toast.success("Registrasi dojang berhasil! Silahkan registrasi.");

      // Reset form
      setNamaDojang("");
      setEmail("");
      setno_telp("");
      setKabupaten("");
      setProvinsi("");
      setNegara("");

      console.log("Registration successful:", response);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.data?.errors) {
        console.table(err.data.errors);
        toast.error("Ada field yang tidak valid. Cek console untuk detail.");
      } else {
        toast.error(err.message || "Terjadi kesalahan sistem.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!namaDojang.trim()) {
      toast.error("Nama dojang harus diisi");
      return;
    }

    if (namaDojang.trim().length < 3) {
      toast.error("Nama dojang minimal 3 karakter");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    if (no_telp && !/^[\d\s\-\+\(\)]+$/.test(no_telp)) {
      toast.error("Format nomor HP tidak valid");
      return;
    }

    handleRegister();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 py-8">
      {/* Register Container */}
      <div className="w-full max-w-lg mx-4 sm:max-w-xl sm:mx-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-7 md:p-8">
          
          {/* Header Section */}
          <div className="text-center mb-6 md:mb-8">
            {/* Logo */}
            <div className="relative mb-4 md:mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
              <img 
                src="src/assets/logo/logojv.png" 
                alt="Taekwondo Logo" 
                className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto drop-shadow-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl leading-none tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  REGISTRASI DOJANG
                </span>
              </h1>
              <div className="w-14 md:w-20 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
              <p className="text-xs md:text-sm font-plex text-black/70 mt-2 md:mt-3">
                Daftarkan dojang Anda untuk bergabung dengan komunitas taekwondo
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            
            {/* Nama Dojang */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Nama Dojang <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={namaDojang}
                  onChange={(e) => setNamaDojang(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Contoh: Dojang Garuda Sakti"
                  type="text"
                  disabled={isLoading}
                />
                <Home className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Email <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="email@example.com"
                  type="email"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                No HP <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={no_telp}
                  onChange={(e) => setno_telp(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="08123456789"
                  disabled={isLoading}
                />
                <Phone className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Location Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kabupaten/Kota */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Kota <span className="text-xs text-black/50">(Opsional)</span>
                </label>
                <div className="relative group">
                  <TextInput
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                    placeholder="Jakarta Selatan"
                    disabled={isLoading}
                  />
                  <MapPin className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                </div>
              </div>

              {/* Provinsi */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Provinsi <span className="text-xs text-black/50">(Opsional)</span>
                </label>
                <div className="relative group">
                  <TextInput
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                    placeholder="DKI Jakarta"
                    disabled={isLoading}
                  />
                  <Map className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
                </div>
              </div>
            </div>

            {/* Negara */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Negara <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={negara}
                  onChange={(e) => setNegara(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-10 md:pl-12 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Indonesia"
                  disabled={isLoading}
                />
                <Map className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={16} />
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-4 md:pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 md:h-12 rounded-xl text-white text-sm md:text-base font-plex font-semibold transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 active:scale-[0.98]"
                }`}
              >
                {isLoading ? "Mendaftarkan..." : "Daftar Dojang"}
              </button>
            </div>

            {/* Links */}
            <div className="text-center pt-4 md:pt-6 space-y-2">
              <p className="text-xs md:text-sm font-plex text-black/70">
                Belum punya akun pelatih?{" "}
                <Link 
                  to="/register" 
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Daftar sebagai pelatih
                </Link>
              </p>
              
              <p className="text-xs md:text-sm font-plex text-black/70">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Login di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterDojang;