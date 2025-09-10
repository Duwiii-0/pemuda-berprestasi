import { useState } from "react";
import Select from "react-select";
import TextInput from "../../components/textInput";
import { Home, Phone, Mail, Upload, X, Image } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../config/api";
import Logo from '../../assets/logo/logo.png';

// Data provinsi dan kota
const provinsiKotaData = {
  "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam"],
  "Sumatera Utara": ["Medan", "Binjai", "Gunungsitoli", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
  "Riau": ["Pekanbaru", "Dumai"],
  "Kepulauan Riau": ["Tanjung Pinang", "Batam"],
  "Jambi": ["Jambi", "Sungai Penuh"],
  "Sumatera Selatan": ["Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih"],
  "Bangka Belitung": ["Pangkal Pinang"],
  "Bengkulu": ["Bengkulu"],
  "Lampung": ["Bandar Lampung", "Metro"],
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Banjar"],
  "Banten": ["Serang", "Tangerang", "Tangerang Selatan", "Cilegon"],
  "Jawa Tengah": ["Semarang", "Magelang", "Pekalongan", "Purwokerto", "Salatiga", "Solo", "Tegal"],
  "Yogyakarta": ["Yogyakarta"],
  "Jawa Timur": ["Surabaya", "Malang", "Batu", "Blitar", "Kediri", "Madiun", "Mojokerto", "Pasuruan", "Probolinggo"],
  "Bali": ["Denpasar"],
  "Nusa Tenggara Barat": ["Mataram", "Bima"],
  "Nusa Tenggara Timur": ["Kupang"],
  "Kalimantan Barat": ["Pontianak", "Singkawang"],
  "Kalimantan Tengah": ["Palangka Raya"],
  "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru"],
  "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang"],
  "Kalimantan Utara": ["Tarakan"],
  "Sulawesi Utara": ["Manado", "Bitung", "Kotamobagu", "Tomohon"],
  "Sulawesi Tengah": ["Palu"],
  "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare"],
  "Sulawesi Tenggara": ["Kendari", "Bau-Bau"],
  "Gorontalo": ["Gorontalo"],
  "Sulawesi Barat": ["Mamuju"],
  "Maluku": ["Ambon", "Tual"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan"],
  "Papua": ["Jayapura"],
  "Papua Tengah": ["Nabire"],
  "Papua Pegunungan": ["Wamena"],
  "Papua Selatan": ["Merauke"],
  "Papua Barat": ["Manokwari", "Sorong"],
  "Papua Barat Daya": ["Sorong"]
};

const provinsiOptions = Object.keys(provinsiKotaData).map(provinsi => ({
  value: provinsi,
  label: provinsi
}));

const RegisterDojang = () => {
  const [namaDojang, setNamaDojang] = useState("");
  const [email, setEmail] = useState("");
  const [no_telp, setno_telp] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get city options based on selected province
  const kotaOptions = provinsi ? provinsiKotaData[provinsi]?.map(kota => ({
    value: kota,
    label: kota
  })) || [] : [];

  const handleProvinsiChange = (selectedOption) => {
    setProvinsi(selectedOption?.value || "");
    setKabupaten(""); 
  };

  const handleKotaChange = (selectedOption) => {
    setKabupaten(selectedOption?.value || "");
  };

  const getSelectValue = (options, value) => {
    return options.find(option => option.value === value) || null;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format file harus JPG, PNG, atau WebP");
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    // Reset input file
    const fileInput = document.getElementById('logo-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama_dojang', namaDojang.trim());
      formData.append('email', email.trim() || "");
      formData.append('no_telp', no_telp.trim() || "");
      formData.append('negara', negara.trim() || "");
      formData.append('provinsi', provinsi.trim() || "");
      formData.append('kota', kabupaten.trim() || "");
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await apiClient.post("/dojang", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Registrasi dojang berhasil! Silahkan registrasi.");

      setNamaDojang("");
      setEmail("");
      setno_telp("");
      setKabupaten("");
      setProvinsi("");
      setNegara("");
      removeLogo();

    } catch (err) {
      if (err.data?.errors) {
        toast.error("Ada field yang tidak valid.");
      } else {
        toast.error("Terjadi kesalahan saat mendaftar");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 py-4 sm:py-8">
      {/* Register Container */}
      <div className="w-full max-w-sm mx-3 sm:max-w-lg sm:mx-4 md:max-w-xl md:mx-6 2xl:max-w-2xl">
        <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-7 lg:p-8">
          
          {/* Header Section */}
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            {/* Logo */}
            <div className="relative mb-3 sm:mb-4 md:mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-red/10 to-red/5 rounded-full blur-md opacity-60"></div>
              <img 
                src={Logo}
                alt="Taekwondo Logo" 
                className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 mx-auto drop-shadow-md"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="font-bebas text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-none tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  REGISTRASI DOJANG
                </span>
              </h1>
              <div className="w-12 sm:w-14 md:w-20 h-0.5 bg-gradient-to-r from-red/40 via-red to-red/40 mx-auto rounded-full"></div>
              <p className="text-xs sm:text-sm md:text-base font-plex text-black/70 mt-2 md:mt-3 px-2">
                Daftarkan dojang Anda untuk bergabung dengan komunitas taekwondo
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 md:space-y-5">
            
            {/* Logo Upload */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                Logo Dojang <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              
              {logoPreview ? (
                // Preview dengan tombol hapus
                <div className="relative">
                  <div className="flex items-center justify-center w-full h-24 sm:h-28 md:h-32 border-2 border-red/25 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-red text-white rounded-full flex items-center justify-center hover:bg-red/80 transition-colors shadow-md"
                  >
                    <X size={12} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                // Upload area
                <div className="relative group">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center justify-center w-full h-24 sm:h-28 md:h-32 border-2 border-dashed border-red/25 rounded-xl bg-white/80 backdrop-blur-sm hover:border-red/40 hover:bg-red/5 transition-all duration-300 cursor-pointer">
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red/10 rounded-full flex items-center justify-center">
                        <Image className="w-4 h-4 sm:w-5 sm:h-5 text-red/70" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-plex font-medium text-black/70">
                          Klik untuk upload logo
                        </p>
                        <p className="text-xs font-plex text-black/50 mt-0.5">
                          JPG, PNG, WebP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nama Dojang */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                Nama Dojang <span className="text-red">*</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={namaDojang}
                  onChange={(e) => setNamaDojang(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-9 sm:pl-10 md:pl-12 pr-3 sm:pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Contoh: Dojang Garuda Sakti"
                  type="text"
                  disabled={isLoading}
                />
                <Home className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={14} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                Email <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-9 sm:pl-10 md:pl-12 pr-3 sm:pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="email@example.com"
                  type="email"
                  disabled={isLoading}
                />
                <Mail className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={14} />
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                No HP <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={no_telp}
                  onChange={(e) => setno_telp(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-9 sm:pl-10 md:pl-12 pr-3 sm:pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="08123456789"
                  disabled={isLoading}
                />
                <Phone className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors" size={14} />
              </div>
            </div>

            {/* Location Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Provinsi */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                  Provinsi <span className="text-xs text-black/50">(Opsional)</span>
                </label>
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 50 })
                  }}
                  isDisabled={isLoading}
                  value={getSelectValue(provinsiOptions, provinsi)}
                  onChange={handleProvinsiChange}
                  options={provinsiOptions}
                  placeholder="Pilih provinsi"
                  classNames={{
                    control: () =>
                      `flex items-center border-2 ${
                        !isLoading 
                          ? 'border-red/25 hover:border-red/40 focus-within:border-red bg-white/80' 
                          : 'border-gray-200 bg-gray-50'
                      } rounded-lg sm:rounded-xl px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-0.5 sm:px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs sm:text-sm md:text-base",
                    singleValue: () => "text-black/80 font-plex text-xs sm:text-sm md:text-base",
                    menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl mt-1 sm:mt-2 overflow-hidden z-50",
                    menuList: () => "max-h-28 sm:max-h-32 overflow-y-auto",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 sm:px-4 py-2 sm:py-3 cursor-pointer font-plex text-xs sm:text-sm transition-colors duration-200 hover:text-red",
                        isFocused ? "bg-red/10 text-red" : "text-black/80",
                        isSelected ? "bg-red text-white" : ""
                      ].join(" "),
                  }}
                />
              </div>

              {/* Kota */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                  Kota <span className="text-xs text-black/50">(Opsional)</span>
                </label>
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 50 })
                  }}
                  isDisabled={isLoading || !provinsi}
                  value={getSelectValue(kotaOptions, kabupaten)}
                  onChange={handleKotaChange}
                  options={kotaOptions}
                  placeholder={provinsi ? "Pilih kota" : "Pilih provinsi dulu"}
                  classNames={{
                    control: () =>
                      `flex items-center border-2 ${
                        !isLoading && provinsi
                          ? 'border-red/25 hover:border-red/40 focus-within:border-red bg-white/80' 
                          : 'border-gray-200 bg-gray-50'
                      } rounded-lg sm:rounded-xl px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-0.5 sm:px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs sm:text-sm md:text-base",
                    singleValue: () => "text-black/80 font-plex text-xs sm:text-sm md:text-base",
                    menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl mt-1 sm:mt-2 overflow-hidden z-50",
                    menuList: () => "max-h-28 sm:max-h-32 overflow-y-auto",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 sm:px-4 py-2 sm:py-3 cursor-pointer font-plex text-xs sm:text-sm transition-colors duration-200 hover:text-red",
                        isFocused ? "bg-red/10 text-red" : "text-black/80",
                        isSelected ? "bg-red text-white" : ""
                      ].join(" "),
                  }}
                />
              </div>
            </div>

            {/* Negara */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm md:text-base font-plex font-medium text-black/80 block">
                Negara <span className="text-xs text-black/50">(Opsional)</span>
              </label>
              <div className="relative group">
                <TextInput
                  value={negara}
                  onChange={(e) => setNegara(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-3 sm:pl-4 pr-3 sm:pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Indonesia"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-3 sm:pt-4 md:pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl text-white text-sm md:text-base font-plex font-semibold transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red border-2 border-red hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 active:scale-[0.98]"
                }`}
              >
                {isLoading ? "Mendaftarkan..." : "Daftar Dojang"}
              </button>
            </div>

            {/* Links */}
            <div className="text-center pt-3 sm:pt-4 md:pt-6 space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm md:text-base font-plex text-black/70 px-2">
                Belum punya akun pelatih?{" "}
                <Link 
                  to="/register" 
                  className="font-medium text-red hover:text-red/80 underline underline-offset-2 transition-colors duration-300"
                >
                  Daftar sebagai pelatih
                </Link>
              </p>
              
              <p className="text-xs sm:text-sm md:text-base font-plex text-black/70 px-2">
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