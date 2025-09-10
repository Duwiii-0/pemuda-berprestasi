// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Scale, Ruler, X, Eye, Download } from "lucide-react";
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
  akte_kelahiran_path?: string;
  pas_foto_path?: string;
  sertifikat_belt_path?: string;
  ktp_path?: string;
  kota?: string;
}

const provinsiKotaData: Record<string, string[]> = {
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

const handleProvinsiChange = (selectedOption: { value: string; label: string } | null) => {
  const newProvinsi = selectedOption?.value || "";
  handleInputChange('provinsi', newProvinsi);
  // Reset kota ketika provinsi berubah
  if (formData && newProvinsi !== formData.provinsi) {
    handleInputChange('kota', '');
  }
};

// Component untuk preview file
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
        return () => {
          URL.revokeObjectURL(url);
        };
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
      
      {displayUrl && !previewError ? (
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

    // Create FormData untuk mengirim file dan data - SAMA SEPERTI TAMBAHATLIT
    const formDataToSend = new FormData();
    
    // Append regular fields - SESUAIKAN DENGAN BACKEND REQUIREMENTS
    formDataToSend.append('nama_atlet', formData.nama_atlet);
    formDataToSend.append('jenis_kelamin', formData.jenis_kelamin);
    formDataToSend.append('tanggal_lahir', formData.tanggal_lahir);
    
    // Optional fields - hanya append jika ada value
    if (formData.nik?.trim()) formDataToSend.append('nik', formData.nik.trim());
    if (formData.no_telp?.trim()) formDataToSend.append('no_telp', formData.no_telp.trim());
    if (formData.alamat?.trim()) formDataToSend.append('alamat', formData.alamat.trim());
    if (formData.provinsi?.trim()) formDataToSend.append('provinsi', formData.provinsi.trim());
    if (formData.kota?.trim()) formDataToSend.append('kota', formData.kota.trim()); // TAMBAHKAN KOTA
    if (formData.belt?.trim()) formDataToSend.append('belt', formData.belt.trim());
    
    // Numeric fields dengan validation
    if (formData.tinggi_badan) {
      const height = parseFloat(String(formData.tinggi_badan));
      if (!isNaN(height) && height > 0) {
        formDataToSend.append('tinggi_badan', String(height));
      }
    }
    
    if (formData.berat_badan) {
      const weight = parseFloat(String(formData.berat_badan));
      if (!isNaN(weight) && weight > 0) {
        formDataToSend.append('berat_badan', String(weight));
      }
    }

    // Append files jika ada (hanya file baru)
    if (formData.akte_kelahiran) {
      formDataToSend.append('akte_kelahiran', formData.akte_kelahiran);
    }
    if (formData.pas_foto) {
      formDataToSend.append('pas_foto', formData.pas_foto);
    }
    if (formData.sertifikat_belt) {
      formDataToSend.append('sertifikat_belt', formData.sertifikat_belt);
    }
    if (formData.ktp) {
      formDataToSend.append('ktp', formData.ktp);
    }

    // Debug: Log FormData contents
    console.log('🚀 Profile: Calling UPDATE API with FormData');
    console.log('📤 FormData contents:');
    for (const [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // GUNAKAN DIRECT FETCH API SEPERTI TAMBAHATLIT
    const saved = await updateAtletWithFiles(formDataToSend);

    if (saved) {
      const updatedData = {
        ...saved,
        // Reset file fields setelah berhasil
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
    console.error("❌ Gagal update atlet:", err);
    
    // Better error handling seperti TambahAtlit
    if (err.message.includes('File size')) {
      toast.error("File terlalu besar. Maksimal 5MB per file.");
    } else if (err.message.includes('Invalid file')) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
    } else if (err.message.includes('wajib diisi')) {
      toast.error("Ada field wajib yang belum diisi: " + err.message);
    } else {
      toast.error(err.message || "Gagal memperbarui data atlet");
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Enhanced function to handle file uploads with better error handling
  const updateAtletWithFiles = async (formData: FormData): Promise<AtletWithFiles | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    console.log(`🌐 Calling PUT ${import.meta.env.VITE_API_URL}/atlet/${id}`);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/atlet/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // JANGAN set Content-Type header untuk FormData
      },
      body: formData,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    // Parse response text first
    const responseText = await response.text();
    console.log('📄 Response text:', responseText);

    if (!response.ok) {
      let errorMessage = 'Failed to update atlet';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Parse successful response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('✅ API Response:', parsedResponse);
      console.log('👤 Updated Atlet Data:', parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse response JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

  } catch (error: any) {
    console.error('❌ Error updating atlet:', error);
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

  // Handler untuk file upload
  const handleFileChange = (field: keyof AtletWithFiles, file: File | null) => {
    if (!formData) return;
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

           {/* Provinsi - GANTI DARI TextInput KE Select */}
<div className="space-y-2">
  <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Provinsi</label>
  <div className="relative">
    <Select
      unstyled
      menuPortalTarget={document.body}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 10 })
      }}
      isDisabled={!isEditing}
      value={Object.keys(provinsiKotaData).map(provinsi => ({
        value: provinsi,
        label: provinsi
      })).find(opt => opt.value === formData?.provinsi) || null}
      onChange={handleProvinsiChange}
      options={Object.keys(provinsiKotaData).map(provinsi => ({
        value: provinsi,
        label: provinsi
      }))}
      placeholder="Pilih provinsi"
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

{/* TAMBAHKAN FIELD KOTA SETELAH PROVINSI */}
{/* Kota */}
<div className="space-y-2">
  <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Kota</label>
  <div className="relative">
    <Select
      unstyled
      menuPortalTarget={document.body}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 10 })
      }}
      isDisabled={!isEditing || !formData?.provinsi}
      value={
        formData?.provinsi && formData?.kota 
          ? provinsiKotaData[formData.provinsi]?.map((kota: string) => ({
              value: kota, 
              label: kota
            })).find((opt: { value: string; label: string }) => opt.value === formData.kota) || null 
          : null
      }
      onChange={(selected: { value: string; label: string } | null) => 
        handleInputChange('kota', selected?.value || '')
      }
      options={
        formData?.provinsi 
          ? provinsiKotaData[formData.provinsi]?.map((kota: string) => ({
              value: kota, 
              label: kota
            })) || [] 
          : []
      }
      placeholder={formData?.provinsi ? "Pilih kota" : "Pilih provinsi dulu"}
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
  onChange={(e) => handleFileChange('akte_kelahiran', e.target.files?.[0] || null)}
  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
/>
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
  file={formData.akte_kelahiran || null}
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
  onChange={(e) => handleFileChange('pas_foto', e.target.files?.[0] || null)}
  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
/>
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
  file={formData.pas_foto || null}
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
  onChange={(e) => handleFileChange('sertifikat_belt', e.target.files?.[0] || null)}
  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
/>
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
  file={formData.sertifikat_belt || null}
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
  accept="image/*" 
  disabled={!isEditing}
  onChange={(e) => handleFileChange('ktp', e.target.files?.[0] || null)}
  className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
/>
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              <FilePreview
  file={formData.ktp || null}
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
              <h4 className="font-plex font-semibold text-blue-800 mb-2">Tips Upload Dokumen:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Format yang didukung: JPG, PNG, PDF</li>
                <li>• Ukuran maksimal per file: 5MB</li>
                <li>• Pastikan dokumen terlihat jelas dan tidak buram</li>
                <li>• File baru akan menggantikan file yang sudah ada</li>
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
                hasFiles: {
                  akte_kelahiran: !!formData.akte_kelahiran,
                  pas_foto: !!formData.pas_foto,
                  sertifikat_belt: !!formData.sertifikat_belt,
                  ktp: !!formData.ktp,
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