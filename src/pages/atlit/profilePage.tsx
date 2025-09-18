// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Scale, Ruler } from "lucide-react";
import TextInput from "../../components/textInput";
import Select from "react-select";
import { GeneralButton } from "../dashboard/dataDojang";
import { useAtletContext } from "../../context/AtlitContext";
import type { Atlet } from "../../context/AtlitContext";
import  { beltOptions } from "../../context/AtlitContext";
import  { genderOptions } from "../../context/AtlitContext";
import { calculateAge } from "../../context/AtlitContext";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { AtletDocumentUploader } from "../../components/atletUploads";

// Extend Atlet type untuk include file fields
interface AtletWithFiles extends Omit<Atlet, 'akte_kelahiran' | 'pas_foto' | 'sertifikat_belt' | 'ktp'> {
  // File objects untuk upload (temporary)
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;
  
  // Path fields untuk existing files (dari database)
  akte_kelahiran_path?: string;
  pas_foto_path?: string;
  sertifikat_belt_path?: string;
  ktp_path?: string;
  
  // Tambahan field kota
  kota?: string;
}

const provinsiKotaData: Record<string, string[]> = {
  "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam"],
  "Sumatera Utara": ["Medan", "Binjai", "Gunungsitoli", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
  "Riau": ["Pekanbaru", "Dumai"],
  "Kepulauan Riau": ["Tanjung Pinang", "Batam"],
  "Jambi": ["Jambi", "Sungai Penuh"],
  "Sumatera Selatan": ["Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih", "Muara Enim", 'Lahat'],
  "Bangka Belitung": ["Pangkal Pinang"],
  "Bengkulu": ["Bengkulu"],
  "Lampung": ["Lampung Barat", "Tanggamus", "Lampung Selatan", "Lampung Timur", "Lampung Tengah", "Lampung Utara", "Way Kanan", "Pesawaran", "Pringsewu", 'Mesuji', 'Tulang Bawang Barat', 'Pesisir Barat', 'Bandar Lampung', 'Metro'  ],
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

const { fetchAtletById, updateAtlet } = useAtletContext();

useEffect(() => {
  if (id) {
    const atletId = Number(id);
    fetchAtletById(atletId).then((data) => {
      if (data) {
        console.log("📋 RAW ATLET DATA:", data);
        
        const dataWithFiles: AtletWithFiles = {
          ...data,
          // PERBAIKAN: Map existing file paths dengan benar
          akte_kelahiran_path: data.akte_kelahiran || undefined,
          pas_foto_path: data.pas_foto || undefined,             
          sertifikat_belt_path: data.sertifikat_belt || undefined,
          ktp_path: data.ktp || undefined,
          // Initialize File objects as null
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
  
    console.log(`🔍 Current formData.nama_atlet before FormData:`, formData.nama_atlet);


  setIsSubmitting(true);
  
  try {
    const formDataSend = new FormData();
    
    // Required fields
    formDataSend.append("nama_atlet", formData.nama_atlet);
    formDataSend.append("jenis_kelamin", formData.jenis_kelamin);
    formDataSend.append("tanggal_lahir", formData.tanggal_lahir);
    
    // Optional fields
    if (formData.nik?.trim()) formDataSend.append('nik', formData.nik.trim());
    if (formData.no_telp?.trim()) formDataSend.append('no_telp', formData.no_telp.trim());
    if (formData.alamat?.trim()) formDataSend.append('alamat', formData.alamat.trim());
    if (formData.provinsi?.trim()) formDataSend.append('provinsi', formData.provinsi.trim());
    if (formData.kota?.trim()) formDataSend.append('kota', formData.kota.trim());
    if (formData.belt?.trim()) formDataSend.append('belt', formData.belt.trim());
    
    // Numeric fields
    if (formData.tinggi_badan) {
      const height = parseFloat(String(formData.tinggi_badan));
      if (!isNaN(height) && height > 0) {
        formDataSend.append('tinggi_badan', String(height));
      }
    }
    
    if (formData.berat_badan) {
      const weight = parseFloat(String(formData.berat_badan));
      if (!isNaN(weight) && weight > 0) {
        formDataSend.append('berat_badan', String(weight));
      }
    }

    // Files
    if (formData.akte_kelahiran) formDataSend.append('akte_kelahiran', formData.akte_kelahiran);
    if (formData.pas_foto) formDataSend.append('pas_foto', formData.pas_foto);
    if (formData.sertifikat_belt) formDataSend.append('sertifikat_belt', formData.sertifikat_belt);
    if (formData.ktp) formDataSend.append('ktp', formData.ktp);

    console.log("📋 All FormData contents:");
    for (let [key, value] of formDataSend.entries()) {
      console.log(`  ${key}: ${value}`);
    }


    // FIX: Use updateAtlet and assign to result variable
    const result = await updateAtlet(Number(id), formDataSend);
    
    if (result) {
      // Use the response data directly instead of fetching again
      const updatedAtlet = result; // This is the fresh data from the server
        
      const updatedData: AtletWithFiles = {
        ...updatedAtlet,
        akte_kelahiran_path: updatedAtlet.akte_kelahiran || undefined,
        pas_foto_path: updatedAtlet.pas_foto || undefined,
        sertifikat_belt_path: updatedAtlet.sertifikat_belt || undefined,
        ktp_path: updatedAtlet.ktp || undefined,
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

const handleInputChange = (field: keyof AtletWithFiles, value: any) => {
  if (!formData) return;
  let updatedData = { ...formData, [field]: value };

  if (field === "tanggal_lahir" && typeof value === "string") {
    updatedData.tanggal_lahir = value;
    updatedData.umur = calculateAge(updatedData.tanggal_lahir);
  }

  setFormData(updatedData);
};

const handleProvinsiChange = (selectedOption: { value: string; label: string } | null) => {
  const newProvinsi = selectedOption?.value || "";
  handleInputChange('provinsi', newProvinsi);
  // Reset kota ketika provinsi berubah
  if (formData && newProvinsi !== formData.provinsi) {
    handleInputChange('kota', '');
  }
};

  // Handler untuk file upload
  const handleFileChange = (field: keyof AtletWithFiles, file: File | null) => {
  if (!formData) return;
  setFormData({ ...formData, [field]: file });
};


  // Handler untuk menghapus file
const handleFileRemove = (field: keyof AtletWithFiles) => {
  if (!formData) return;
  
  // Type assertion untuk memastikan field_path exists
  const pathField = `${String(field)}_path` as keyof AtletWithFiles;
  
  setFormData({ 
    ...formData, 
    [field]: null,
    [pathField]: undefined
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
             {(user?.role === 'ADMIN' || user?.role === 'ADMIN_KOMPETISI') ? (
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
      onChange={(selected) =>
        setFormData({
          ...formData,
          provinsi: selected?.value || "",
        })
      }
      options={provinsiOptions}
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

        <AtletDocumentUploader
          formData={formData}
          isEditing={isEditing}
          onFileChange={handleFileChange}
          onFileRemove={handleFileRemove}
        />

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