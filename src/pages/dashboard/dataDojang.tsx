import { useState, useEffect } from "react";
import type { ChangeEvent } from "react"; // Change to type-only import
import { Phone, Mail, MapPin, Map, Building, Flag, Menu, Award, Eye, Download, Upload, X} from 'lucide-react';
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

const FilePreview = ({ 
  file, 
  existingPath, 
  onRemove, 
  disabled,
  label 
}: { 
  file: File | null;
  existingPath?: string;
  onRemove: () => void;
  disabled: boolean;
  label: string;
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

  const hasFile = file || existingPath;
  
  const getDisplayFileName = () => {
    if (file) return file.name;
    if (existingPath) {
      const fileName = existingPath.split('/').pop() || label;
      return fileName.length > 50 ? `${label} (File tersimpan)` : fileName;
    }
    return label;
  };

  const handleDownload = async () => {
    if (!existingPath) {
      toast.error('Tidak ada file untuk didownload');
      return;
    }
    
    try {
      const baseUrl = 'https://cjvmanagementevent.com';
      const downloadUrl = `${baseUrl}${existingPath}`;
      console.log(`📥 Downloading logo from: ${downloadUrl}`);
      
      const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        toast.error('Logo tidak ditemukan di server');
        return;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getDisplayFileName();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download ${label} berhasil!`);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      toast.error('Gagal mendownload file');
    }
  };

  const getPreviewUrl = () => {
    if (file && previewUrl) return previewUrl;
    
    if (existingPath) {
      const baseUrl = 'https://cjvmanagementevent.com';
      const staticUrl = `${baseUrl}${existingPath}`;
      console.log("🌐 Logo Preview URL:", staticUrl);
      return staticUrl;
    }
    
    return null;
  };

  const isImageFile = () => {
    if (file) return file.type.startsWith('image/');
    if (existingPath) {
      const ext = existingPath.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
    }
    return false;
  };

  if (!hasFile) return null;

  const displayUrl = getPreviewUrl();
  const fileName = getDisplayFileName();

  return (
    <div className="mt-2 p-3 bg-white/70 rounded-xl border border-red/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-black/70">
          {file ? `File baru: ${fileName}` : fileName}
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
        {displayUrl && !previewError && isImageFile() && (
          <div className="relative w-20 h-20 flex-shrink-0">
            <img 
              src={displayUrl} 
              alt={`Preview ${label}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                console.log(`❌ Preview failed for: ${displayUrl}`);
                setPreviewError(true);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* File icon untuk non-image atau jika preview error */}
        {(!displayUrl || previewError || !isImageFile()) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 w-20 h-20 border rounded-lg justify-center bg-gray-50">
            <Upload size={24} className="text-gray-400" />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1 flex-1">
          {/* View/Preview Button */}
          {displayUrl && (
            <button
              onClick={() => {
                console.log(`🔍 Opening logo preview: ${displayUrl}`);
                window.open(displayUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
              type="button"
            >
              <Eye size={12} />
              Lihat Logo
            </button>
          )}
          
          {/* Download button */}
          {existingPath && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
              type="button"
            >
              <Download size={12} />
              Download
            </button>
          )}
          
          {/* Status indicator */}
          <div className="text-xs text-gray-500">
            {file ? '📎 Logo baru' : existingPath ? '💾 Logo tersimpan' : 'Tidak ada logo'}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    console.log('🔄 Fetching dojang data...');
    
    const response = await apiClient.get("/dojang/my-dojang");
    console.log('📋 Raw API Response:', response);
    
    // PERBAIKAN: Response langsung adalah data dojang, bukan nested
    const dojangData = response.data || response;
    console.log('📊 Dojang data:', dojangData);
    
    // PERBAIKAN: Validate dojang data
    if (!dojangData || !dojangData.id_dojang || !dojangData.nama_dojang) {
      console.log('⚠️ Invalid dojang data:', dojangData);
      toast.error("Data dojang tidak valid atau belum ada");
      setUserDojang(null);
      setFormData(null);
      return;
    }
    
    console.log('✅ Valid dojang data:', dojangData.nama_dojang);
    
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
    
    // Set logo preview dari existing data
if (dojangData.logo) {
  setLogoPreview(`/uploads/dojang/logos/${dojangData.logo}`);
} else if (dojangData.logo_url) {
  setLogoPreview(dojangData.logo_url);
}
    
  } catch (err: any) {
    console.error('❌ Error fetching dojang:', err);
    
    // Handle error responses
    if (err.response?.status === 404) {
      toast.error("Pelatih belum memiliki dojang");
    } else if (err.response?.status === 401) {
      toast.error("Sesi login telah berakhir");
    } else {
      toast.error(err.response?.data?.message || "Gagal mengambil data dojang");
    }
    
    setUserDojang(null);
    setFormData(null);
  } finally {
    setLoading(false);
  }
};

  fetchDojang();
}, [user, navigate]);

  const handleCancel = () => {
  setIsEditing(false);
  setLogoFile(null);
  setLogoPreview(userDojang?.logo_url || null);
  
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
  
  // Reset file inputs
  const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
  const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
  if (fileInputDesktop) fileInputDesktop.value = '';
  if (fileInputMobile) fileInputMobile.value = '';
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
    
    toast.success(`Logo ${file.name} berhasil dipilih`);
  }
};

const removeLogo = () => {
  setLogoFile(null);
  setLogoPreview(userDojang?.logo_url || null);
  
  const fileInputDesktop = document.getElementById('logo-upload') as HTMLInputElement;
  const fileInputMobile = document.getElementById('logo-upload-mobile') as HTMLInputElement;
  
  if (fileInputDesktop) fileInputDesktop.value = '';
  if (fileInputMobile) fileInputMobile.value = '';
  
  toast.success("Logo berhasil dihapus");
};

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
    
    if (logoFile) {
      updateFormData.append('logo', logoFile);
      console.log('📤 Uploading logo:', logoFile.name);
    }

    console.log('📤 Updating dojang ID:', userDojang.id_dojang);
    
    // ✅ PERBAIKAN: Gunakan putFormData instead of put
    const response = await apiClient.putFormData(
      `/dojang/${userDojang.id_dojang}`, 
      updateFormData
    ) as any;

    console.log('📋 Full Response:', response);
    
    // ✅ PERBAIKAN: Handle response format dari backend
    // Backend mengembalikan: { success: true, data: {...} }
    let updatedData;
    if (response.success && response.data) {
      updatedData = response.data;
      console.log('📊 Using success/data structure');
    } else if (response.data) {
      updatedData = response.data;
      console.log('📊 Using data structure');
    } else {
      updatedData = response;
      console.log('📊 Using direct response');
    }
    
    console.log('📊 Final processed data:', updatedData);
    
    if (!updatedData || !updatedData.nama_dojang) {
      console.error('❌ Invalid response data structure');
      throw new Error("Response data tidak valid");
    }
    
    console.log('✅ Setting new state with:', updatedData.nama_dojang);
    
    // Update state
    setUserDojang(updatedData);
    setFormData({
      name: updatedData.nama_dojang || "",
      email: updatedData.email || "",
      phone: updatedData.no_telp || "",
      negara: updatedData.negara || "",
      provinsi: updatedData.provinsi || "",
      kota: updatedData.kota || "",
      kecamatan: updatedData.kecamatan || "",
      kelurahan: updatedData.kelurahan || "",
      alamat: updatedData.alamat || "",
    });

if (updatedData.logo) {
  setLogoPreview(`/uploads/dojang/logos/${updatedData.logo}`);
  console.log('📷 Updated logo URL:', `/uploads/dojang/logos/${updatedData.logo}`);
} else if (updatedData.logo_url) {
  setLogoPreview(updatedData.logo_url);
  console.log('📷 Updated logo URL:', updatedData.logo_url);
}

    
    setLogoFile(null);
    setIsEditing(false);
    toast.success("Data dojang berhasil diperbarui");

  } catch (err: any) {
    console.error("❌ Error updating dojang:", err);
    console.error("❌ Error response:", err.response);
    toast.error(err.response?.data?.message || err.message || "Update dojang gagal");
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
                      label="Ubah Data Dojang"
                      className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                      onClick={() => setIsEditing(true)}
                    />
                  ) : (
                    <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
                      <GeneralButton
                        label="Batal"
                        className="text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                        onClick={handleCancel}
                        disabled={loading}
                      />
                      <GeneralButton
                        label={loading ? "Menyimpan..." : "Simpan"}
                        className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleUpdate}
                        disabled={loading}
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
    {/* Logo Section - Desktop */}
<div className="bg-white/80 rounded-xl p-6 shadow-md border border-white/50 mb-6">
  <h3 className="font-bebas text-lg lg:text-xl text-black/80 mb-4 flex items-center gap-2">
    <Upload size={20} className="text-red" />
    LOGO DOJANG
  </h3>
  
  <div className="space-y-3">
    {/* File Input untuk Upload Logo */}
    <div className="space-y-2">
      <label className="block font-plex font-medium text-black/70 text-sm">Upload Logo Dojang</label>
      <div className="relative">
        <input
          id="logo-upload"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleLogoChange}
          className="w-full p-3 border-2 border-red/20 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20"
          disabled={loading || !isEditing}
        />
        {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
      </div>
    </div>
    
    {/* FilePreview Component */}
    <FilePreview
      file={logoFile}
      existingPath={logoPreview || userDojang?.logo_url}
      onRemove={removeLogo}
      disabled={!isEditing}
      label="Logo Dojang"
    />
  </div>
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
    {/* Logo Section - Mobile */}
<div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
  <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
    <Upload size={18} className="text-red" />
    LOGO DOJANG
  </h3>
  
  <div className="space-y-3">
    {/* File Input untuk Upload Logo */}
    <div className="space-y-2">
      <label className="block font-plex font-medium text-black/70 text-xs">Upload Logo Dojang</label>
      <div className="relative">
        <input
          id="logo-upload-mobile"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleLogoChange}
          className="w-full p-2.5 text-sm border-2 border-red/20 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20"
          disabled={loading || !isEditing}
        />
        {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
      </div>
    </div>
    
    {/* FilePreview Component untuk Mobile */}
    <FilePreview
      file={logoFile}
      existingPath={logoPreview || userDojang?.logo_url}
      onRemove={removeLogo}
      disabled={!isEditing}
      label="Logo Dojang"
    />
  </div>
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