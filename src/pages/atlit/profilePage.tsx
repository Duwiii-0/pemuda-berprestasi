// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Map, Scale, Ruler, ArrowLeft } from "lucide-react";
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



function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  // Jika format ISO, ambil yyyy-mm-dd
  return dateStr.slice(0, 10);
}

// Convert date from yyyy-mm-dd to mm/dd/yyyy format
function toMMDDYYYY(dateStr: string): string {
  // yyyy-mm-dd -> mm/dd/yyyy
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return "";
  return `${month}/${day}/${year}`;
}

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [originalData, setOriginalData] = useState<Atlet | null>(null); // 🆕 simpan data asli dari DB
  const [formData, setFormData] = useState<Atlet | null>();
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth(); // misal user punya { role: 'ADMIN' | 'ATLET' }

  const { fetchAtletById, updateAtlet } = useAtletContext();

  // Fetch data atlet sekali saat masuk halaman
  useEffect(() => {
    if (id) {
      const atletId = Number(id);
      fetchAtletById(atletId).then((data) => {
        if (data) {
          setFormData(data);
          setOriginalData(data); // simpan versi asli
        }
      });
    }
  }, [id, fetchAtletById]);

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData); // 🆕 balikin ke data awal dari DB
    }
    setIsEditing(false);
  };

  const handleUpdate = async () => {
  if (formData) {
    try {
      const calculatedAge = calculateAge(formData.tanggal_lahir);

      // Hanya ambil field yang valid untuk update
      const payload = {
        id_atlet: Number(id),
        nama_atlet: formData.nama_atlet,
        nik: formData.nik,
        tanggal_lahir: formData.tanggal_lahir,
        jenis_kelamin: formData.jenis_kelamin,
        tinggi_badan: formData.tinggi_badan,
        berat_badan: formData.berat_badan,
        no_telp: formData.no_telp,
        alamat: formData.alamat,
        umur: calculatedAge, // kalau schema Joi terima
      };

      const saved = await updateAtlet(payload);

      if (saved) {
        setFormData(saved);
        setOriginalData(saved);
        setIsEditing(false);
        toast.success("Data atlet berhasil diperbarui ✅")
      }
    } catch (err) {
      console.error("Gagal update atlet:", err);
      toast.error("Semua field harus diisi dengan benar"); 
    }
  }
};


  const handleInputChange = (field: keyof Atlet, value: any) => {
    if (!formData) return;
    let updatedData = { ...formData, [field]: value };

    if (field === "tanggal_lahir" && typeof value === "string") {
      updatedData.tanggal_lahir = value;
      updatedData.umur = calculateAge(updatedData.tanggal_lahir);
    }

    setFormData(updatedData);
  };

  if (!formData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
          <p className="text-red font-plex text-lg">Data Atlit tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-8 pt-8 pb-12 px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 flex-1">
            <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
              PROFIL ATLET
            </h1>
            <p className="font-plex text-black/60 text-lg">
              Detail informasi {formData.nama_atlet}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-gray-200">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 border-b border-white/30">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas text-3xl shadow-lg">
              {formData.nama_atlet?.charAt(0)}
            </div>
            <div>
              <h2 className="font-bebas text-3xl text-black/80 tracking-wide">
                {formData.nama_atlet}
              </h2>
              <div className="flex gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${
                  formData.jenis_kelamin === "LAKI_LAKI"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-pink-100 text-pink-600"
                }`}>
                {formData.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-plex font-medium bg-yellow/20 text-yellow/80">
                  Sabuk {formData.belt || 'Tidak Ada'}
                </span>
                {/* Display calculated age */}
                <span className="px-3 py-1 rounded-full text-xs font-plex font-medium bg-green-100 text-green-600">
                  {calculateAge(formData.tanggal_lahir)} tahun
                </span>
              </div>
            </div>
            {/* Action Buttons */}
<div className="flex gap-3 ml-auto">
  {user?.role === 'ADMIN' ? (
    <></> // kosongkan tombol untuk admin
  ) : (
    !isEditing ? (
      <GeneralButton
        label="Ubah Data Atlit"
        className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
        onClick={() => setIsEditing(true)}
      />
    ) : (
      <div className="flex gap-3">
        <GeneralButton
          label="Batal"
          className="text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50"
          onClick={handleCancel}
        />
        <GeneralButton
          label="Simpan"
          className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
          onClick={handleUpdate}
        />
      </div>
    )
  )}
</div>

          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nama */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Nama Lengkap</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('nama_atlet', e.target.value)}
                disabled={!isEditing}
                value={formData?.nama_atlet}
                placeholder="Nama"
                icon={<User className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">No. Telepon</label>
                <div className="relative">
                <TextInput
                  className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                  onChange={(e) => handleInputChange('no_telp', e.target.value)}
                  disabled={!isEditing}
                  value={formData.no_telp || ''} //blm ada ni field di db
                  placeholder="No HP"
                  icon={<Phone className="text-red" size={20} />}
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block font-plex font-medium text-black/70">Alamat</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                disabled={!isEditing}
                value={formData.alamat || ''} // blm ada jg
                placeholder="Alamat"
                icon={<MapPinned className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Provinsi */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Provinsi</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('provinsi', e.target.value)}
                disabled={!isEditing}
                value={formData.provinsi}
                placeholder="Provinsi"
                icon={<Map className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Gender</label>
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
                    "z-10 border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-12 px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300",
                  valueContainer: () => "px-2",
                  placeholder: () => "text-red/50 font-plex",
                  menu: () => "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-10",
                  menuList: () => "z-10 max-h-40 overflow-y-auto bg-white",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-4 py-3 cursor-pointer font-plex transition-all duration-200",
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
              <label className="block font-plex font-medium text-black/70">Sabuk</label>
              <div className="relative">
              <Select
                unstyled
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 10 })
                }}
                isDisabled={!isEditing}
                value={beltOptions.find(opt => opt.value === formData.belt) || null} // ni jugaaa
                onChange={(selected) =>
                  handleInputChange('belt', selected?.value || '')
                }
                options={beltOptions}
                classNames={{
                  control: () =>
                    "z-50 border-2  border-red/20 hover:border-red/40 bg-white/50 rounded-xl h-12 px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300",
                  valueContainer: () => "px-2",
                  placeholder: () => "text-red/50 font-plex",
                  menu: () => "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-20",
                  menuList: () => "z-20 max-h-10 overflow-y-auto",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-4 py-3 cursor-pointer font-plex transition-all duration-200",
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
              <label className="block font-plex font-medium text-black/70">Tanggal Lahir</label>
              <div className="relative">
              <TextInput
                type="date"
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                disabled={!isEditing}
                value={toInputDateFormat(formData.tanggal_lahir) || ''}
                placeholder="Tanggal Lahir"
                icon={<CalendarFold className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
              {/* Display calculated age */}
              {formData.tanggal_lahir && (
                <p className="text-green-600 text-sm font-plex">
                  Umur: {calculateAge(formData.tanggal_lahir)} tahun
                </p>
              )}
            </div>

            {/* Berat Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Berat Badan (kg)</label>
              <div className="relative">
              <TextInput
                type="number"
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('berat_badan', Number(e.target.value))}
                disabled={!isEditing}
                value={formData.berat_badan?.toString() || ''}
                placeholder="Berat Badan"
                icon={<Scale className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Tinggi Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Tinggi Badan (cm)</label>
              <div className="relative">
              <TextInput
                type="number"
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('tinggi_badan', Number(e.target.value))}
                disabled={!isEditing}
                value={formData.tinggi_badan?.toString() || ''}
                placeholder="Tinggi Badan"
                icon={<Ruler className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* NIK */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">NIK</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => handleInputChange('nik', e.target.value)}
                disabled={!isEditing}
                value={formData.nik || ''} // nik jg blm 
                placeholder="NIK"
                icon={<IdCard className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red/10 rounded-xl">
              <IdCard className="text-red" size={20} />
            </div>
            <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
              DOKUMEN PENDUKUNG
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Akte Kelahiran</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Pas Foto 3x4</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">Sertifikasi Belt</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70">KTP (Wajib untuk 17+)</label>
              <div className="relative">
              <FileInput 
                accept="image/*" 
                disabled={!isEditing}
                className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;