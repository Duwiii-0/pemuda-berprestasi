import { useState, useEffect } from "react";
import type { ChangeEvent } from "react"; // Change to type-only import
import { Phone, Mail, MapPin, Map, Building, Flag, Menu, Award, Upload, X } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard"; // Import NavbarDashboard
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../config/api";

// Types untuk components
interface TextInputProps {
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  value?: string;
  type?: string | "text";
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface GeneralButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// Add logo interface
interface DojangData {
  id_dojang: number;
  nama_dojang: string;
  email: string;
  no_telp: string;
  negara: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  logo_url?: string;
  tanggal_didirikan?: string;
}

interface FormDataType {
  name: string;
  email: string;
  phone: string;
  negara: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
}

export const TextInput: React.FC<TextInputProps> = ({ placeholder, className, icon, value, disabled,type , onChange }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center border-2 border-red/20 hover:border-red/40 focus-within:border-red rounded-xl px-4 py-3 gap-3 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
        {icon && <span className="text-red/60 group-focus-within:text-red transition-colors">{icon}</span>}
        <input
          value={value}
          type={type}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full outline-none bg-transparent placeholder-red/30 text-black/80 font-plex"
        />
      </div>
      {disabled && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
    </div>
  );
};

export const GeneralButton: React.FC<GeneralButtonProps> = ({ label, className,disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`font-plex font-medium px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 ${className}`}
  >
    {label}
  </button>
);

const Dojang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [userDojang, setUserDojang] = useState<DojangData | null>(null);
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);

  // Set token global sekali aja
  useEffect(() => {
    // Token handled by apiClient automatically
  }, [token]);

  // Close mobile sidebar on window resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 🔹 Fetch data my-dojang
  useEffect(() => {
    if (!user) {
      toast.error("Anda harus login dulu");
      navigate("/", { replace: true });
      return;
    }

    const fetchDojang = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{data: DojangData}>("/dojang/my-dojang");
        const dojangData = response.data.data;

        setUserDojang(dojangData);
        setFormData({
          name: dojangData.nama_dojang || "",
          email: dojangData.email || "",
          phone: dojangData.no_telp || "",
          negara: dojangData.negara || "",
          provinsi: dojangData.provinsi || "",
          kota: dojangData.kota || "",
          kecamatan: dojangData.kecamatan || "",
          kelurahan: dojangData.kelurahan || "",
          alamat: dojangData.alamat || "",
        });
        
        if (dojangData.logo_url) {
          setLogoPreview(dojangData.logo_url);
        }
        
      } catch (err: any) {
        console.error(err);
        toast.error("Gagal mengambil data dojang");
      } finally {
        setLoading(false);
      }
    };

    fetchDojang();
  }, [user, navigate]);
  const handleCancel = () => {
    setIsEditing(false);
    setLogoFile(null); // TAMBAHKAN INI
    setLogoPreview(userDojang?.logo_url || null); // TAMBAHKAN INI - Reset to original logo
    
    if (userDojang) {
      setFormData({
        name: userDojang.nama_dojang,
        email: userDojang.email,
        phone: userDojang.no_telp,
        negara: userDojang.negara,
        provinsi: userDojang.provinsi,
        kota: userDojang.kota,
        kecamatan: userDojang.kecamatan,
        kelurahan: userDojang.kelurahan,
        alamat: userDojang.alamat,
      });
    }
    
    // Reset file input - TAMBAHKAN INI
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target?.files?.[0];
  if (file) {
    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file harus JPG, PNG, JPEG, atau WebP");
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success(`Logo ${file.name} berhasil dipilih`);
  }
};

// Remove logo
// Remove logo - UPDATE FUNCTION INI
const removeLogo = () => {
  setLogoFile(null);
  setLogoPreview(userDojang?.logo_url || null);
  
  // Reset input file untuk desktop dan mobile
  const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
  const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
  
  if (fileInputDesktop) {
    fileInputDesktop.value = '';
  }
  if (fileInputMobile) {
    fileInputMobile.value = '';
  }
  
  toast.success("Logo berhasil dihapus");
};
  // 🔹 Update dojang
  // Update dojang
const handleUpdate = async () => {
  if (!userDojang || !formData) {
    toast.error("Data tidak lengkap");
    return;
  }

  try {
    setLoading(true);
    const updateFormData = new FormData();
    
    updateFormData.append('nama_dojang', formData.name.trim());
    updateFormData.append('email', formData.email.trim());
    updateFormData.append('no_telp', formData.phone.trim());
    updateFormData.append('negara', formData.negara.trim());
    updateFormData.append('provinsi', formData.provinsi.trim());
    updateFormData.append('kota', formData.kota.trim());
    updateFormData.append('kecamatan', formData.kecamatan.trim());
    updateFormData.append('kelurahan', formData.kelurahan.trim());
    updateFormData.append('alamat', formData.alamat.trim());
    
    // Only append logo if a new file was selected - TAMBAHKAN INI
    if (logoFile) {
      updateFormData.append('logo', logoFile);
    }

    // Debug log FormData contents - TAMBAHKAN INI
    console.log("📤 DEBUG: Sending FormData contents:");
    for (let [key, value] of updateFormData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    const response = await apiClient.put<{data: DojangData}>(
      `/dojang/${userDojang.id_dojang}`, 
      updateFormData
    );

    const updatedData = response.data.data;
    setUserDojang(updatedData);
    
    // Update logo preview with new URL if logo was updated - TAMBAHKAN INI
    if (updatedData.logo_url) {
      setLogoPreview(updatedData.logo_url);
    }
    
    setLogoFile(null); // Reset file state - TAMBAHKAN INI
    setIsEditing(false);
    toast.success("Data dojang berhasil diperbarui");

  } catch (err: any) {
    console.error("❌ Error updating dojang:", err);
    
    // Improved error handling - TAMBAHKAN INI
    if (err && typeof err === 'object' && 'response' in err) {
      const error = err as any;
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages.join(", ") || "Ada field yang tidak valid.");
      } else if (error.message?.includes('File size')) {
        toast.error("File logo terlalu besar. Maksimal 5MB.");
      } else if (error.message?.includes('Invalid file')) {
        toast.error("Format logo tidak didukung. Gunakan JPG, PNG, JPEG, atau WebP.");
      } else {
        toast.error(error.response?.data?.message || "Update dojang gagal");
      }
    } else {
      toast.error("Update dojang gagal");
    }
  } finally {
    setLoading(false);
  }
};

  if (!formData) {
    return (
      <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red mb-4"></div>
            <p className="text-red font-plex text-lg">Memuat data dojang...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
                aria-label="Open menu"
              >
                <Menu size={24} className="text-red" />
              </button>
            </div>

            {/* Title and Stats */}
            <div className="space-y-4 lg:space-y-6 flex-1 w-full">
              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA DOJANG
                </h1>
                <p className="font-plex text-black/60 text-base lg:text-lg mt-2">
                  Kelola informasi dojang dan lokasi pelatihan
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 xl:p-8 shadow-xl border border-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4 mb-4 lg:mb-6">
              <div className="flex gap-3 lg:gap-4 items-center">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Building className="text-red" size={18} />
                </div>
                <h2 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
                  INFORMASI DOJANG
                </h2>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 lg:gap-3">
                {user?.role === 'ADMIN' ? (
                  <></> // kosongkan tombol untuk admin
                ) : (
                  !isEditing ? (
                    <GeneralButton
                      label="Ubah Data Atlit"
                      className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                      onClick={() => setIsEditing(true)}
                    />
                  ) : (
                    <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
                      <GeneralButton
                        label="Batal"
                        className="text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                        onClick={handleCancel}
                        disabled={isLoading}
                      />
                      <GeneralButton
                        label={isLoading ? "Menyimpan..." : "Simpan"}
                        className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleUpdate}
                        disabled={isLoading}
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red"></div>
                <p className="font-plex text-black/60 mt-2">
                  {isEditing ? "Menyimpan data..." : "Memuat data..."}
                </p>
              </div>
            )}

{/* Desktop Form */}
{userDojang && !loading && (
  <div className="hidden lg:block space-y-6">
    {/* Logo Section - Desktop - TAMBAHKAN INI SEBAGAI SECTION PERTAMA */}
    <div className="bg-white/80 rounded-xl p-6 shadow-md border border-white/50">
      <h3 className="font-bebas text-lg lg:text-xl text-black/80 mb-4 flex items-center gap-2">
        <Upload size={20} className="text-red" />
        LOGO DOJANG
      </h3>
      
      {logoPreview ? (
        <div className="relative group inline-block">
          <div className="flex items-center justify-center w-32 h-32 lg:w-40 lg:h-40 border-2 border-red/25 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden hover:border-red/40 transition-all duration-300">
            <img 
              src={logoPreview} 
              alt="Logo Dojang" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={removeLogo}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red text-white rounded-full flex items-center justify-center hover:bg-red/80 transition-all duration-300 shadow-lg group-hover:scale-110"
              disabled={loading}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="relative group inline-block">
          <input
            id="logo-upload"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleLogoChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={loading || !isEditing}
          />
          <div className="flex flex-col items-center justify-center w-32 h-32 lg:w-40 lg:h-40 border-2 border-dashed border-red/25 rounded-xl bg-white/80 backdrop-blur-sm hover:border-red/40 hover:bg-red/5 transition-all duration-300 cursor-pointer group-hover:scale-[1.02]">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-red/10 rounded-full flex items-center justify-center group-hover:bg-red/20 transition-colors duration-300">
                <Upload className="w-5 h-5 text-red/70 group-hover:text-red transition-colors duration-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-plex font-medium text-black/70 group-hover:text-red transition-colors duration-300">
                  Upload Logo
                </p>
                <p className="text-xs font-plex text-black/50 mt-1">
                  Max 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Nama Dojang
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      value={formData.name}
                      placeholder="Masukkan nama dojang"
                      icon={<Building className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Email Dojang
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      value={formData.email}
                      placeholder="Masukkan email dojang"
                      icon={<Mail className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Nomor Telepon
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      value={formData.phone}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Negara
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, negara: e.target.value })}
                      disabled={!isEditing}
                      value={formData.negara}
                      placeholder="Masukkan negara"
                      icon={<Flag className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Provinsi
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, provinsi: e.target.value })}
                      disabled={!isEditing}
                      value={formData.provinsi}
                      placeholder="Masukkan provinsi"
                      icon={<Map className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Kabupaten/Kota
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kota: e.target.value })}
                      disabled={!isEditing}
                      value={formData.kota}
                      placeholder="Masukkan kabupaten/kota"
                      icon={<Building className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Kecamatan
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kecamatan: e.target.value })}
                      disabled={!isEditing}
                      value={formData.kecamatan}
                      placeholder="Masukkan kecamatan"
                      icon={<Map className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Kelurahan
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kelurahan: e.target.value })}
                      disabled={!isEditing}
                      value={formData.kelurahan}
                      placeholder="Masukkan kelurahan"
                      icon={<Map className="text-red/60" size={20} />}
                    />
                  </div>

                  <div className="xl:col-span-1 space-y-2">
                    <label className="block font-plex font-medium text-black/70 text-sm">
                      Alamat Lengkap
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, alamat: e.target.value })}
                      disabled={!isEditing}
                      value={formData.alamat}
                      placeholder="Masukkan alamat lengkap"
                      icon={<MapPin className="text-red/60" size={20} />}
                    />
                  </div>
                </div>
              </div>
            )}

{/* Mobile Form */}
{userDojang && !loading && (
  <div className="lg:hidden space-y-4">
    {/* Logo Section - Mobile - TAMBAHKAN INI SEBAGAI SECTION PERTAMA */}
    <div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
      <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
        <Upload size={18} className="text-red" />
        LOGO DOJANG
      </h3>
      
      {logoPreview ? (
        <div className="relative group inline-block">
          <div className="flex items-center justify-center w-24 h-24 border-2 border-red/25 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden hover:border-red/40 transition-all duration-300">
            <img 
              src={logoPreview} 
              alt="Logo Dojang" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={removeLogo}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red text-white rounded-full flex items-center justify-center hover:bg-red/80 transition-all duration-300 shadow-lg"
              disabled={loading}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div className="relative group inline-block">
          <input
            id="logo-upload-mobile"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleLogoChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={loading || !isEditing}
          />
          <div className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-red/25 rounded-xl bg-white/80 backdrop-blur-sm hover:border-red/40 hover:bg-red/5 transition-all duration-300 cursor-pointer">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-6 h-6 bg-red/10 rounded-full flex items-center justify-center">
                <Upload className="w-3 h-3 text-red/70" />
              </div>
              <p className="text-xs font-plex font-medium text-black/70">
                Logo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Basic Info Card - EXISTING CODE TETAP SAMA */}
    <div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
      <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
        <Building size={18} className="text-red" />
        INFORMASI DASAR
      </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Nama Dojang</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        value={formData.name}
                        placeholder="Masukkan nama dojang"
                        icon={<Building className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Email Dojang</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        value={formData.email}
                        placeholder="Masukkan email dojang"
                        icon={<Mail className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Nomor Telepon</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        value={formData.phone}
                        placeholder="Masukkan nomor telepon"
                        icon={<Phone className="text-red/60" size={18} />}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
                  <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
                    <MapPin size={18} className="text-red" />
                    LOKASI DOJANG
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Negara</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, negara: e.target.value })}
                          disabled={!isEditing}
                          value={formData.negara}
                          placeholder="Negara"
                          icon={<Flag className="text-red/60" size={16} />}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Provinsi</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, provinsi: e.target.value })}
                          disabled={!isEditing}
                          value={formData.provinsi}
                          placeholder="Provinsi"
                          icon={<Map className="text-red/60" size={16} />}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Kota</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kota: e.target.value })}
                          disabled={!isEditing}
                          value={formData.kota}
                          placeholder="Kota"
                          icon={<Building className="text-red/60" size={16} />}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Kecamatan</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kecamatan: e.target.value })}
                          disabled={!isEditing}
                          value={formData.kecamatan}
                          placeholder="Kecamatan"
                          icon={<Map className="text-red/60" size={16} />}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Kelurahan</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kelurahan: e.target.value })}
                        disabled={!isEditing}
                        value={formData.kelurahan}
                        placeholder="Masukkan kelurahan"
                        icon={<Map className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Alamat Lengkap</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, alamat: e.target.value })}
                        disabled={!isEditing}
                        value={formData.alamat}
                        placeholder="Masukkan alamat lengkap"
                        icon={<MapPin className="text-red/60" size={18} />}
                      />
                    </div>
                  </div>
                </div>

                {/* Save reminder for mobile */}
                {isEditing && (
                  <div className="p-4 bg-yellow/10 border border-yellow/30 rounded-xl">
                    <p className="text-sm font-plex text-yellow flex items-center gap-2">
                      <Award size={16} />
                      Jangan lupa untuk menyimpan perubahan setelah selesai mengedit
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!userDojang && !loading && (
              <div className="text-center py-8 lg:py-12">
                <Building className="mx-auto text-gray-400 mb-4" size={40} />
                <p className="font-plex text-gray-500">Data dojang tidak ditemukan</p>
                <p className="font-plex text-sm text-gray-400 mt-2">Silakan refresh halaman atau hubungi admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dojang;