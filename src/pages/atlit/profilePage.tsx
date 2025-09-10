// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Map, Scale, Ruler } from "lucide-react";
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

function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const [originalData, setOriginalData] = useState<AtletWithFiles | null>(null);
  const [formData, setFormData] = useState<AtletWithFiles | null>();
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const { fetchAtletById, updateAtlet } = useAtletContext();

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
      setFormData(originalData);
    }
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (formData) {
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

        // Append files if they exist
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

        // Call updateAtlet with FormData instead of regular object
        const saved = await updateAtletWithFiles(formDataToSend);

        if (saved) {
          setFormData(saved);
          setOriginalData(saved);
          setIsEditing(false);
          toast.success("Data atlet berhasil diperbarui ✅");
        }
      } catch (err) {
        console.error("Gagal update atlet:", err);
        toast.error("Gagal memperbarui data atlet"); 
      }
    }
  };

  // New function to handle file uploads
  const updateAtletWithFiles = async (formData: FormData): Promise<AtletWithFiles | null> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/atlet/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Don't set Content-Type header, let browser set it for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update atlet');
      }

      return await response.json();
    } catch (error) {
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

  // Handler untuk file upload
  const handleFileChange = (field: keyof AtletWithFiles, file: File | null) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: file });
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
                    />
                    <GeneralButton
                      label="Simpan"
                      className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                      onClick={handleUpdate}
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

        {/* Document Upload Section */}
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
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Akte Kelahiran</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                onChange={(file) => handleFileChange('akte_kelahiran', file)}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              {formData.akte_kelahiran && (
                <p className="text-green-600 text-xs">File dipilih: {formData.akte_kelahiran.name}</p>
              )}
            </div>
            
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
              {formData.pas_foto && (
                <p className="text-green-600 text-xs">File dipilih: {formData.pas_foto.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">Sertifikasi Belt</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                onChange={(file) => handleFileChange('sertifikat_belt', file)}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              {formData.sertifikat_belt && (
                <p className="text-green-600 text-xs">File dipilih: {formData.sertifikat_belt.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">KTP (Wajib untuk 17+)</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                onChange={(file) => handleFileChange('ktp', file)}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300 text-sm lg:text-base"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              {formData.ktp && (
                <p className="text-green-600 text-xs">File dipilih: {formData.ktp.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;