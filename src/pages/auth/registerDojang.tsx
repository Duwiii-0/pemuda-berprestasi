import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import Select from "react-select";
import TextInput from "../../components/textInput";
import { Home, Phone, Mail, Upload, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "../../config/api";
import Logo from '../../assets/logo/logo.png';

// Types
interface OptionType {
  value: string;
  label: string;
}

// Data provinsi dan kota
const provinsiKotaData: { [key: string]: string[] } = {
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

const provinsiOptions: OptionType[] = Object.keys(provinsiKotaData).map(provinsi => ({
  value: provinsi,
  label: provinsi
}));

// File Preview Component
interface FilePreviewProps {
  file: File | null;
  onRemove: () => void;
  disabled: boolean;
  label: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  onRemove, 
  disabled,
  label 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewError(false);
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating preview URL:', error);
        setPreviewError(true);
      }
    } else {
      setPreviewUrl(null);
      setPreviewError(false);
    }
  }, [file]);

  const isImageFile = (): boolean => {
    if (file) return file.type.startsWith('image/');
    return false;
  };

  if (!file) return null;

  return (
    <div className="mt-2 p-3 bg-white/70 rounded-xl border border-red/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-black/70">
          File dipilih: {file.name}
        </span>
        {!disabled && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red/10 rounded-full transition-colors"
            type="button"
          >
            <X size={16} className="text-red" />
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        {/* Preview Image */}
        {previewUrl && !previewError && isImageFile() && (
          <div className="relative w-20 h-20 flex-shrink-0">
            <img 
              src={previewUrl} 
              alt={`Preview ${label}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              onError={() => {
                setPreviewError(true);
              }}
            />
          </div>
        )}
        
        {/* File icon untuk non-image atau jika preview error */}
        {(!previewUrl || previewError || !isImageFile()) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 w-20 h-20 border rounded-lg justify-center bg-gray-50">
            <Upload size={24} className="text-gray-400" />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1 flex-1">
          {/* View/Preview Button */}
          {previewUrl && (
            <button
              onClick={() => {
                window.open(previewUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
              type="button"
            >
              <Eye size={12} />
              Preview Logo
            </button>
          )}
          
          {/* Status indicator */}
          <div className="text-xs text-gray-500">
            Logo siap diupload
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterDojang = () => {
  const [namaDojang, setNamaDojang] = useState("");
  const [email, setEmail] = useState("");
  const [no_telp, setno_telp] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [negara, setNegara] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get city options based on selected province
  const kotaOptions: OptionType[] = provinsi ? provinsiKotaData[provinsi]?.map((kota: string) => ({
    value: kota,
    label: kota
  })) || [] : [];

  const handleProvinsiChange = (selectedOption: OptionType | null) => {
    setProvinsi(selectedOption?.value || "");
    setKabupaten(""); 
  };

  const handleKotaChange = (selectedOption: OptionType | null) => {
    setKabupaten(selectedOption?.value || "");
  };

  const getSelectValue = (options: OptionType[], value: string): OptionType | null => {
    return options.find((option: OptionType) => option.value === value) || null;
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target?.files?.[0];
  if (!file) return;

  console.log('📸 Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Validasi ukuran file (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Ukuran file maksimal 5MB");
    e.target.value = ''; // Reset input
    return;
  }

  // Validasi tipe file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    toast.error("Format file harus JPG, PNG, JPEG, atau WebP");
    e.target.value = ''; // Reset input
    return;
  }

  // Validasi nama file
  if (file.name.length > 255) {
    toast.error("Nama file terlalu panjang");
    e.target.value = ''; // Reset input
    return;
  }

  setLogoFile(file);
  toast.success(`Logo ${file.name} berhasil dipilih`);
};

  const removeLogo = () => {
    setLogoFile(null);
    
    const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
    const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
    
    if (fileInputDesktop) fileInputDesktop.value = '';
    if (fileInputMobile) fileInputMobile.value = '';
    
    toast.success("Logo berhasil dihapus");
  };

  const resetForm = () => {
  setNamaDojang("");
  setEmail("");
  setno_telp("");
  setKabupaten("");
  setProvinsi("");
  setNegara("");
  setLogoFile(null);
  
  // Reset file inputs
  const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
  const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
  if (fileInputDesktop) fileInputDesktop.value = '';
  if (fileInputMobile) fileInputMobile.value = '';
};

const handleRegister = async () => {
  setIsLoading(true);
  try {
    console.log('📝 Data yang akan dikirim:', {
      nama_dojang: namaDojang.trim(),
      email: email.trim(),
      no_telp: no_telp.trim(),
      negara: negara.trim(),
      provinsi: provinsi.trim(),
      kota: kabupaten.trim(),
      logo: logoFile?.name || 'tidak ada'
    });

    if (!namaDojang.trim()) {
      toast.error("Nama dojang tidak boleh kosong");
      return;
    }

    const formData = new FormData();
    formData.append('nama_dojang', namaDojang.trim());
    formData.append('email', email.trim() || '');
    formData.append('no_telp', no_telp.trim() || '');
    formData.append('negara', negara.trim() || 'Indonesia');
    formData.append('provinsi', provinsi.trim() || '');
    formData.append('kota', kabupaten.trim() || '');
    
    if (logoFile) {
      formData.append('logo', logoFile);
      console.log('📎 Uploading logo:', logoFile.name, 'Size:', logoFile.size);
    }

    console.log('📤 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, value.name, `(${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    console.log('🚀 Sending request to /dojang...');
    
    // ✅ PERBAIKAN: Panggil API dengan benar
    const response = await apiClient.postFormData("/dojang", formData);
    
    console.log('✅ Registration response:', response);
    toast.success("Registrasi dojang berhasil! Silahkan login.");
    resetForm();

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // ✅ PERBAIKAN: Error handling yang sesuai dengan API client baru
    // API client baru throw object dengan struktur { status, data }
    if (error && typeof error === 'object') {
      const status = error.status;
      const errorData = error.data;
      
      console.log('📡 Error status:', status);
      console.log('📡 Error data:', errorData);
      
      // Handle berdasarkan status code
      if (status === 400) {
        // Bad Request - biasanya validation error
        if (errorData && typeof errorData === 'object') {
          if (errorData.message) {
            toast.error(errorData.message);
          } else if (errorData.errors) {
            // Laravel validation errors
            const firstError = Object.values(errorData.errors)[0];
            const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            toast.error(errorMessage || "Data tidak valid");
          } else {
            toast.error("Data tidak valid. Periksa kembali input Anda.");
          }
        } else {
          toast.error("Data tidak valid. Periksa kembali input Anda.");
        }
      } else if (status === 422) {
        // Unprocessable Entity - validation error
        if (errorData && errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMessage || "Data tidak sesuai format yang diperlukan.");
        } else {
          toast.error("Data tidak sesuai format yang diperlukan.");
        }
      } else if (status === 413) {
        toast.error("File terlalu besar. Maksimal 5MB.");
      } else if (status === 500) {
        toast.error("Terjadi kesalahan server. Coba lagi nanti.");
      } else if (status >= 400) {
        // Generic client/server error
        const message = (errorData && errorData.message) || `Error ${status}`;
        toast.error(message);
      } else {
        toast.error("Terjadi kesalahan tidak terduga.");
      }
    } else if (error instanceof Error) {
      // Network errors atau error lainnya
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        toast.error("Koneksi bermasalah. Periksa internet Anda.");
      } else {
        toast.error(error.message || "Registrasi gagal. Coba lagi.");
      }
    } else {
      toast.error("Terjadi kesalahan tidak terduga.");
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validasi yang lebih ketat
  const trimmedNama = namaDojang.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = no_telp.trim();

  if (!trimmedNama) {
    toast.error("Nama dojang harus diisi");
    return;
  }

  if (trimmedNama.length < 3) {
    toast.error("Nama dojang minimal 3 karakter");
    return;
  }

  if (trimmedNama.length > 100) {
    toast.error("Nama dojang maksimal 100 karakter");
    return;
  }

  // Validasi email jika diisi
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    toast.error("Format email tidak valid");
    return;
  }

  // Validasi phone jika diisi
  if (trimmedPhone && !/^[\d\s\-\+\(\)]{8,20}$/.test(trimmedPhone)) {
    toast.error("Format nomor HP tidak valid (8-20 digit)");
    return;
  }

  // Validasi file logo jika ada
  if (logoFile) {
    if (logoFile.size > 5 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 5MB");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(logoFile.type)) {
      toast.error("Format logo harus JPG, PNG, JPEG, atau WebP");
      return;
    }
  }

  console.log('🚀 Form submitted with valid data');
  handleRegister();
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red/15 via-white to-red/10 py-8">
      {/* Register Container */}
      <div className="w-full max-w-lg mx-4 sm:max-w-xl sm:mx-6 2xl:max-w-2xl">
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
            
            {/* Logo Upload Section - Desktop */}
            <div className="hidden sm:block space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Logo Dojang <span className="text-xs text-black/50">(opsional)</span>
              </label>
              <div className="relative group">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full p-3 md:p-4 border-2 border-red/25 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20 text-sm md:text-base"
                  disabled={isLoading}
                />
                <Upload className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors pointer-events-none" size={16} />
              </div>
              <FilePreview
                file={logoFile}
                onRemove={removeLogo}
                disabled={isLoading}
                label="Logo Dojang"
              />
            </div>

            {/* Logo Upload Section - Mobile */}
            <div className="sm:hidden space-y-1.5">
              <label className="text-xs font-plex font-medium text-black/80 block">
                Logo Dojang <span className="text-xs text-black/50">(opsional)</span>
              </label>
              <div className="relative group">
                <input
                  id="logo-upload-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full p-2.5 text-sm border-2 border-red/25 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20"
                  disabled={isLoading}
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red/60 group-hover:text-red transition-colors pointer-events-none" size={14} />
              </div>
              <FilePreview
                file={logoFile}
                onRemove={removeLogo}
                disabled={isLoading}
                label="Logo Dojang"
              />
            </div>

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
                Email <span className="text-xs text-black/50"></span>
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
                No HP <span className="text-xs text-black/50"></span>
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
              {/* Provinsi */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Provinsi <span className="text-xs text-black/50"></span>
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
                      } rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs md:text-sm",
                    singleValue: () => "text-black/80 font-plex text-xs md:text-sm",
                    menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                    menuList: () => "max-h-32 overflow-y-auto",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                        isFocused ? "bg-red/10 text-red" : "text-black/80",
                        isSelected ? "bg-red text-white" : ""
                      ].join(" "),
                  }}
                />
              </div>

              {/* Kota */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                  Kota <span className="text-xs text-black/50"></span>
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
                      } rounded-xl px-3 md:px-4 py-2 md:py-3 gap-2 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-red/10`,
                    valueContainer: () => "px-1",
                    placeholder: () => "text-gray-400 font-plex text-xs md:text-sm",
                    singleValue: () => "text-black/80 font-plex text-xs md:text-sm",
                    menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                    menuList: () => "max-h-32 overflow-y-auto",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                        isFocused ? "bg-red/10 text-red" : "text-black/80",
                        isSelected ? "bg-red text-white" : ""
                      ].join(" "),
                  }}
                />
              </div>
            </div>

            {/* Negara */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-plex font-medium text-black/80 block">
                Negara <span className="text-xs text-black/50"></span>
              </label>
              <div className="relative group">
                <TextInput
                  value={negara}
                  onChange={(e) => setNegara(e.target.value)}
                  className="h-11 md:h-12 border-2 border-red/25 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm text-sm md:text-base font-plex pl-4 pr-4 transition-all duration-300 group-hover:border-red/40 focus:bg-white focus:shadow-md focus:shadow-red/10"
                  placeholder="Indonesia"
                  disabled={isLoading}
                />
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