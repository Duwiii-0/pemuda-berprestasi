// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Map, Scale, Ruler, X, Eye, Download, AlertCircle, CheckCircle } from "lucide-react";
import TextInput from "../../components/textInput";
import FileInput from "../../components/fileInput";
import Select from "react-select";
import { GeneralButton } from "../dashboard/dataDojang";
import { useAtletContext } from "../../context/AtlitContext";
import type { Atlet } from "../../context/AtlitContext";
import  { beltOptions } from "../../context/AtlitContext";
import  { genderOptions } from "../../context/AtlitContext";
import { calculateAge } from "../../context/AtlitContext";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";

// Extend Atlet type untuk include file fields
interface AtletWithFiles extends Atlet {
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;
  // Untuk menampilkan existing files dari server
  akte_kelahiran_path?: string;
  pas_foto_path?: string;
  sertifikat_belt_path?: string;
  ktp_path?: string;
}

// 1. Token Handling yang Lebih Robust
const getAuthToken = (): string => {
  // Coba dari multiple sources
  const token = localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                sessionStorage.getItem('token');
  
  if (!token) {
    console.error('No token found in storage');
    throw new Error('Token tidak ditemukan. Silakan login kembali.');
  }
  
  return token;
};

// 2. File Validation Helper
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Validasi ukuran file (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File terlalu besar! Maksimal 5MB per file.' };
  }
  
  // Validasi tipe file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Format file tidak didukung! Gunakan JPG, PNG, atau PDF.' };
  }

  // Validasi file tidak kosong
  if (file.size === 0) {
    return { isValid: false, error: 'File kosong atau rusak.' };
  }
  
  return { isValid: true };
};

// Component untuk preview file dengan error handling yang diperbaiki
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
  const [isLoading, setIsLoading] = useState(false);

  // 3. Preview Error Handling yang Diperbaiki
  useEffect(() => {
    if (file && file instanceof File) {
      setIsLoading(true);
      try {
        // Validasi file sebelum membuat URL
        if (file.size > 0 && file.type) {
          const validation = validateFile(file);
          if (!validation.isValid) {
            setPreviewError(true);
            setIsLoading(false);
            return;
          }

          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setPreviewError(false);
          
          return () => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {
              console.warn('Failed to revoke URL:', e);
            }
          };
        } else {
          setPreviewError(true);
        }
      } catch (error) {
        console.error('Error creating preview URL:', error);
        setPreviewError(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPreviewUrl(null);
      setPreviewError(false);
      setIsLoading(false);
    }
  }, [file]);

  const hasFile = file || existingPath;
  const displayUrl = file ? previewUrl : existingPath;
  const fileName = file?.name || existingPath?.split('/').pop() || label;

  if (!hasFile) return null;

  return (
    <div className="mt-2 p-3 bg-white/70 rounded-xl border border-red/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-black/70">
          {file ? `File baru: ${fileName}` : `File tersimpan: ${label}`}
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
      
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-red rounded-full" />
          <span>Memproses file...</span>
        </div>
      ) : displayUrl && !previewError ? (
        <div className="flex gap-2">
          <div className="relative w-20 h-20">
            <img 
              src={displayUrl} 
              alt={`Preview ${label}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              onError={() => setPreviewError(true)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => window.open(displayUrl, '_blank')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
              type="button"
            >
              <Eye size={12} />
              Lihat
            </button>
            {existingPath && (
              <a
                href={existingPath}
                download={fileName}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
              >
                <Download size={12} />
                Download
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IdCard size={16} />
          <span>{fileName}</span>
          {previewError && (
            <span className="text-red-500 text-xs ml-2">
              <AlertCircle size={12} className="inline mr-1" />
              Error preview
            </span>
          )}
        </div>
      )}
    </div>
  );
};

function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const [originalData, setOriginalData] = useState<AtletWithFiles | null>(null);
  const [formData, setFormData] = useState<AtletWithFiles | null>();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const { fetchAtletById } = useAtletContext();

  useEffect(() => {
    if (id) {
      const atletId = Number(id);
      fetchAtletById(atletId).then((data) => {
        if (data) {
          const dataWithFiles: AtletWithFiles = {
            ...data,
            akte_kelahiran: null,
            pas_foto: null,
            sertifikat_belt: null,
            ktp: null,
          };
          setFormData(dataWithFiles);
          setOriginalData(dataWithFiles);
        }
      });
    }
  }, [id, fetchAtletById]);

  const handleCancel = () => {
    if (originalData) {
      setFormData({
        ...originalData,
        akte_kelahiran: null,
        pas_foto: null,
        sertifikat_belt: null,
        ktp: null,
      });
    }
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!formData || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const calculatedAge = calculateAge(formData.tanggal_lahir);

      // Create FormData untuk mengirim file dan data
      const formDataToSend = new FormData();
      
      // Append regular fields
      formDataToSend.append('id_atlet', String(id));
      formDataToSend.append('nama_atlet', formData.nama_atlet);
      formDataToSend.append('nik', formData.nik || '');
      formDataToSend.append('tanggal_lahir', formData.tanggal_lahir);
      formDataToSend.append('jenis_kelamin', formData.jenis_kelamin);
      formDataToSend.append('tinggi_badan', String(formData.tinggi_badan));
      formDataToSend.append('berat_badan', String(formData.berat_badan));
      formDataToSend.append('no_telp', formData.no_telp || '');
      formDataToSend.append('alamat', formData.alamat || '');
      formDataToSend.append('provinsi', formData.provinsi || '');
      formDataToSend.append('belt', formData.belt || '');
      formDataToSend.append('umur', String(calculatedAge));

      // Validate and append files if they exist (only new files)
      if (formData.akte_kelahiran) {
        const validation = validateFile(formData.akte_kelahiran);
        if (!validation.isValid) {
          throw new Error(`Akte Kelahiran: ${validation.error}`);
        }
        formDataToSend.append('akte_kelahiran', formData.akte_kelahiran);
      }
      if (formData.pas_foto) {
        const validation = validateFile(formData.pas_foto);
        if (!validation.isValid) {
          throw new Error(`Pas Foto: ${validation.error}`);
        }
        formDataToSend.append('pas_foto', formData.pas_foto);
      }
      if (formData.sertifikat_belt) {
        const validation = validateFile(formData.sertifikat_belt);
        if (!validation.isValid) {
          throw new Error(`Sertifikat Belt: ${validation.error}`);
        }
        formDataToSend.append('sertifikat_belt', formData.sertifikat_belt);
      }
      if (formData.ktp) {
        const validation = validateFile(formData.ktp);
        if (!validation.isValid) {
          throw new Error(`KTP: ${validation.error}`);
        }
        formDataToSend.append('ktp', formData.ktp);
      }

      // Debug: Log FormData contents
      console.log('Sending FormData:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const saved = await updateAtletWithFiles(formDataToSend);

      if (saved) {
        const updatedData = {
          ...saved,
          akte_kelahiran: null,
          pas_foto: null,
          sertifikat_belt: null,
          ktp: null,
        };
        setFormData(updatedData);
        setOriginalData(updatedData);
        setIsEditing(false);
        toast.success("Data atlet berhasil diperbarui ✅");
      }
    } catch (err: any) {
      console.error("Gagal update atlet:", err);
      toast.error(err.message || "Gagal memperbarui data atlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Enhanced Error Messages
  const updateAtletWithFiles = async (formData: FormData): Promise<AtletWithFiles | null> => {
    try {
      const token = getAuthToken(); // Gunakan helper function

      const response = await fetch(`${import.meta.env.VITE_API_URL}/atlet/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header, let browser set it for FormData
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to update atlet';
        
        // Enhanced error messages berdasarkan status code
        if (response.status === 401) {
          errorMessage = 'Sesi login telah berakhir. Silakan login kembali.';
          // Redirect to login or clear token
          localStorage.removeItem('token');
        } else if (response.status === 413) {
          errorMessage = 'File terlalu besar. Maksimal 5MB per file.';
        } else if (response.status === 422) {
          errorMessage = 'Format file tidak valid. Gunakan JPG, PNG, atau PDF.';
        } else if (response.status === 400) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || 'Data tidak valid. Periksa kembali input Anda.';
          } catch {
            errorMessage = 'Data tidak valid. Periksa kembali input Anda.';
          }
        } else if (response.status >= 500) {
          errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti.';
        } else {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error updating atlet:', error);
      throw error;
    }
  };

  const handleInputChange = (field: keyof AtletWithFiles, value: any) => {
    if (!formData) return;
    let updatedData = { ...formData, [field]: value };

    if (field === "tanggal_lahir" && typeof value === "string") {
      updatedData.tanggal_lahir = value;
      updatedData.umur = calculateAge(updatedData.tanggal_lahir);
    }

    setFormData(updatedData);
  };

  // 2. Handler untuk file upload dengan validasi yang ketat
  const handleFileChange = (field: keyof AtletWithFiles, file: File | null) => {
    if (!formData) return;
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
    }
    
    setFormData({ ...formData, [field]: file });
  };

  // Handler untuk menghapus file
  const handleFileRemove = (field: keyof AtletWithFiles) => {
    if (!formData) return;
    setFormData({ 
      ...formData, 
      [field]: null,
      [`${field}_path`]: undefined // Also clear existing path if removing
    });
  };

  if (!formData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center p-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border border-white/50">
          <p className="text-red font-plex text-base lg:text-lg">Data Atlit tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div className="space-y-2 flex-1">
            <h1 className="font-bebas text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
              PROFIL ATLET
            </h1>
            <p className="font-plex text-black/60 text-base lg:text-lg">
              Detail informasi {formData.nama_atlet}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 mb-6 lg:mb-8 pb-6 lg:pb-0 border-b border-white/30">
            {/* Avatar and Info */}
            <div className="flex items-center gap-4 lg:gap-6 flex-1">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                {formData.nama_atlet?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide truncate">
                  {formData.nama_atlet}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium ${
                    formData.jenis_kelamin === "LAKI_LAKI"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-pink-100 text-pink-600"
                  }`}>
                  {formData.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                  </span>
                  <span className="px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium bg-yellow/20 text-yellow/80">
                    Sabuk {formData.belt || 'Tidak Ada'}
                  </span>
                  <span className="px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium bg-green-100 text-green-600">
                    {calculateAge(formData.tanggal_lahir)} tahun
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
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
                      disabled={isSubmitting}
                    />
                    <GeneralButton
                      label={isSubmitting ? "Menyimpan..." : "Simpan"}
                      className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Form Grid - sama seperti sebelumnya */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Nama */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Nama Lengkap</label>
              <div className="relative">
              <TextInput
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('nama_atlet', e.target.value)}
                disabled={!isEditing}
                value={formData?.nama_atlet}
                placeholder="Nama"
                icon={<User className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">No. Telepon</label>
                <div className="relative">
                <TextInput
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) => handleInputChange('no_telp', e.target.value)}
                  disabled={!isEditing}
                  value={formData.no_telp || ''}
                  placeholder="No HP"
                  icon={<Phone className="text-red" size={18} />}
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Alamat</label>
              <div className="relative">
              <TextInput
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                disabled={!isEditing}
                value={formData.alamat || ''}
                placeholder="Alamat"
                icon={<MapPinned className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Provinsi */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Provinsi</label>
              <div className="relative">
              <TextInput
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('provinsi', e.target.value)}
                disabled={!isEditing}
                value={formData.provinsi}
                placeholder="Provinsi"
                icon={<Map className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Gender</label>
              <div className="relative">
              <Select
                unstyled
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 10 })
                }}
                isDisabled={!isEditing}
                value={genderOptions.find(opt => opt.value === formData?.jenis_kelamin)}
                onChange={(selected) =>
                  handleInputChange('jenis_kelamin', selected?.value as "LAKI_LAKI" | "PEREMPUAN")
                }
                options={genderOptions}
                classNames={{
                  control: () =>
                    "z-10 border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                  valueContainer: () => "px-1 lg:px-2",
                  placeholder: () => "text-red/50 font-plex text-sm lg:text-base",
                  menu: () => "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-10",
                  menuList: () => "z-10 max-h-40 overflow-y-auto bg-white",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                      isFocused ? "bg-red/10 text-black" : "text-black",
                      isSelected ? "bg-red text-black" : "text-black"
                    ].join(" "),
                }}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />}
              </div>
            </div>

            {/* Sabuk */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Sabuk</label>
              <div className="relative">
              <Select
                unstyled
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 10 })
                }}
                isDisabled={!isEditing}
                value={beltOptions.find(opt => opt.value === formData.belt) || null}
                onChange={(selected) =>
                  handleInputChange('belt', selected?.value || '')
                }
                options={beltOptions}
                classNames={{
                  control: () =>
                    "z-50 border-2 border-red/20 hover:border-red/40 bg-white/50 rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                  valueContainer: () => "px-1 lg:px-2",
                  placeholder: () => "text-red/50 font-plex text-sm lg:text-base",
                  menu: () => "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-20",
                  menuList: () => "z-20 max-h-40 overflow-y-auto",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                      isFocused ? "bg-red/10 text-black" : "text-black",
                      isSelected ? "bg-red text-black" : ""
                    ].join(" "),
                }}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />}
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Tanggal Lahir</label>
              <div className="relative">
              <TextInput
                type="date"
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                disabled={!isEditing}
                value={toInputDateFormat(formData.tanggal_lahir) || ''}
                placeholder="Tanggal Lahir"
                icon={<CalendarFold className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              {formData.tanggal_lahir && (
                <p className="text-green-600 text-xs lg:text-sm font-plex">
                  Umur: {calculateAge(formData.tanggal_lahir)} tahun
                </p>
              )}
            </div>

            {/* Berat Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Berat Badan (kg)</label>
              <div className="relative">
              <TextInput
                type="number"
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('berat_badan', Number(e.target.value))}
                disabled={!isEditing}
                value={formData.berat_badan?.toString() || ''}
                placeholder="Berat Badan"
                icon={<Scale className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Tinggi Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Tinggi Badan (cm)</label>
              <div className="relative">
              <TextInput
                type="number"
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('tinggi_badan', Number(e.target.value))}
                disabled={!isEditing}
                value={formData.tinggi_badan?.toString() || ''}
                placeholder="Tinggi Badan"
                icon={<Ruler className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* NIK */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">NIK</label>
              <div className="relative">
              <TextInput
                className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                onChange={(e) => handleInputChange('nik', e.target.value)}
                disabled={!isEditing}
                value={formData.nik || ''}
                placeholder="NIK"
                icon={<IdCard className="text-red" size={18} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Visual Status Indicator untuk Upload */}
        {isEditing && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <CheckCircle className="text-blue-600" size={18} />
              </div>
              <h4 className="font-bebas text-xl text-black/80 tracking-wide">STATUS UPLOAD</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className={`p-3 rounded-xl border ${
                formData.akte_kelahiran 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  {formData.akte_kelahiran ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium">
                    Akte Kelahiran: {formData.akte_kelahiran ? '✓ Siap upload' : 'Belum dipilih'}
                  </span>
                </div>
                {formData.akte_kelahiran && (
                  <p className="text-xs mt-1 opacity-75">
                    {formData.akte_kelahiran.name} ({(formData.akte_kelahiran.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className={`p-3 rounded-xl border ${
                formData.pas_foto 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  {formData.pas_foto ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium">
                    Pas Foto: {formData.pas_foto ? '✓ Siap upload' : 'Belum dipilih'}
                  </span>
                </div>
                {formData.pas_foto && (
                  <p className="text-xs mt-1 opacity-75">
                    {formData.pas_foto.name} ({(formData.pas_foto.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className={`p-3 rounded-xl border ${
                formData.sertifikat_belt 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  {formData.sertifikat_belt ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium">
                    Sertifikat Belt: {formData.sertifikat_belt ? '✓ Siap upload' : 'Belum dipilih'}
                  </span>
                </div>
                {formData.sertifikat_belt && (
                  <p className="text-xs mt-1 opacity-75">
                    {formData.sertifikat_belt.name} ({(formData.sertifikat_belt.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className={`p-3 rounded-xl border ${
                formData.ktp 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  {formData.ktp ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium">
                    KTP: {formData.ktp ? '✓ Siap upload' : 'Belum dipilih'}
                  </span>
                </div>
                {formData.ktp && (
                  <p className="text-xs mt-1 opacity-75">
                    {formData.ktp.name} ({(formData.ktp.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <IdCard size={16} className="text-blue-600" />
                <span className="font-medium text-blue-800">
                  Total file dipilih: {[formData.akte_kelahiran, formData.pas_foto, formData.sertifikat_belt, formData.ktp].filter(Boolean).length}/4
                </span>
              </div>
              {[formData.akte_kelahiran, formData.pas_foto, formData.sertifikat_belt, formData.ktp].some(Boolean) && (
                <p className="text-xs text-blue-600 mt-1">
                  Total ukuran: {(
                    [formData.akte_kelahiran, formData.pas_foto, formData.sertifikat_belt, formData.ktp]
                      .filter(Boolean)
                      .reduce((total, file) => total + (file?.size || 0), 0) / 1024 / 1024
                  ).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        )}

        {/* Document Upload Section with Enhanced Preview */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <div className="p-2 bg-red/10 rounded-xl">
              <IdCard className="text-red" size={18} />
            </div>
            <h3 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
              DOKUMEN PENDUKUNG
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Akte Kelahiran */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Akte Kelahiran</label>
              <div className="relative">
                <FileInput 
                  accept="image/*,application/pdf" 
                  disabled={!isEditing}
                  onChange={(file) => handleFileChange('akte_kelahiran', file)}
                  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
                file={formData.akte_kelahiran}
                existingPath={formData.akte_kelahiran_path}
                onRemove={() => handleFileRemove('akte_kelahiran')}
                disabled={!isEditing}
                label="Akte Kelahiran"
              />
            </div>
            
            {/* Pas Foto */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Pas Foto 3x4</label>
              <div className="relative">
                <FileInput 
                  accept="image/*" 
                  disabled={!isEditing}
                  onChange={(file) => handleFileChange('pas_foto', file)}
                  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
                file={formData.pas_foto}
                existingPath={formData.pas_foto_path}
                onRemove={() => handleFileRemove('pas_foto')}
                disabled={!isEditing}
                label="Pas Foto"
              />
            </div>
            
            {/* Sertifikat Belt */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Sertifikasi Belt</label>
              <div className="relative">
                <FileInput 
                  accept="image/*,application/pdf" 
                  disabled={!isEditing}
                  onChange={(file) => handleFileChange('sertifikat_belt', file)}
                  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
                file={formData.sertifikat_belt}
                existingPath={formData.sertifikat_belt_path}
                onRemove={() => handleFileRemove('sertifikat_belt')}
                disabled={!isEditing}
                label="Sertifikat Belt"
              />
            </div>
            
            {/* KTP */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">KTP (Wajib untuk 17+)</label>
              <div className="relative">
                <FileInput 
                  accept="image/*,application/pdf" 
                  disabled={!isEditing}
                  onChange={(file) => handleFileChange('ktp', file)}
                  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
                file={formData.ktp}
                existingPath={formData.ktp_path}
                onRemove={() => handleFileRemove('ktp')}
                disabled={!isEditing}
                label="KTP"
              />
            </div>
          </div>

          {/* Upload Tips */}
          {isEditing && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-plex font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Tips Upload Dokumen:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Format yang didukung: JPG, PNG, PDF</li>
                <li>• Ukuran maksimal per file: 5MB</li>
                <li>• Pastikan dokumen terlihat jelas dan tidak buram</li>
                <li>• File baru akan menggantikan file yang sudah ada</li>
                <li>• Anda dapat mengupload beberapa dokumen sekaligus</li>
              </ul>
            </div>
          )}
        </div>

        {/* Debug Section (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
            <pre className="text-xs text-yellow-700 overflow-auto">
              {JSON.stringify({
                id,
                isEditing,
                isSubmitting,
                userRole: user?.role,
                hasFiles: {
                  akte_kelahiran: !!formData.akte_kelahiran,
                  pas_foto: !!formData.pas_foto,
                  sertifikat_belt: !!formData.sertifikat_belt,
                  ktp: !!formData.ktp,
                },
                fileSizes: {
                  akte_kelahiran: formData.akte_kelahiran?.size,
                  pas_foto: formData.pas_foto?.size,
                  sertifikat_belt: formData.sertifikat_belt?.size,
                  ktp: formData.ktp?.size,
                },
                existingPaths: {
                  akte_kelahiran_path: formData.akte_kelahiran_path,
                  pas_foto_path: formData.pas_foto_path,
                  sertifikat_belt_path: formData.sertifikat_belt_path,
                  ktp_path: formData.ktp_path,
                }
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;