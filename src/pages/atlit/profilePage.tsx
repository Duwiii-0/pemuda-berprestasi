// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Phone, User, CalendarFold, IdCard, MapPinned, Map, Scale, Ruler, ArrowLeft, Save, X } from "lucide-react";
import TextInput from "../../components/textInput";
import FileInput from "../../components/fileInput";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import type { DummyAtlit } from "../../dummy/dummyAtlit";
import Select from "react-select";
import { GeneralButton } from "../dashboard/dataDojang";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const atlit = dummyAtlits.find((a) => a.id === Number(id)) || null;

  const [formData, setFormData] = useState<DummyAtlit | null>(atlit);
  const [isEditing, setIsEditing] = useState(false);

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(atlit);
  };

  const handleUpdate = () => {
    console.log("Data dojang diupdate:", formData);
    setIsEditing(false);
  };

  const genderOptions = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];

  const beltOptions = [
    { value: "hitam", label: "Hitam" },
    { value: "putih", label: "Putih" },
  ];

  if (!formData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
          <p className="text-red font-inter text-lg">Data Atlit tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-8 pt-8 pb-12 px-8">
        <button 
          onClick={() => {navigate('/dashboard/atlit')}}
          className="text-red hover:text-red/80 font-inter mb-4 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Kembali ke Data Atlit
        </button>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 flex-1">
            <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
              PROFIL ATLET
            </h1>
            <p className="font-inter text-black/60 text-lg">
              Detail informasi {formData.name}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-gray-200">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 border-b border-white/30">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas text-3xl shadow-lg">
              {formData.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bebas text-3xl text-black/80 tracking-wide">
                {formData.name}
              </h2>
              <p className="font-inter text-black/60">ID: {formData.id}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                  formData.gender === "Laki-Laki"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-pink-100 text-pink-600"
                }`}>
                  {formData.gender}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-inter font-medium bg-yellow/20 text-yellow/80">
                  Sabuk {formData.belt || 'Tidak Ada'}
                </span>
              </div>
            </div>
            {/* Action Buttons */}
                <div className="flex gap-3 ml-auto">
                   {!isEditing ? (
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
                   )}
                </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nama */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Nama Lengkap</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                value={formData.name}
                placeholder="Nama"
                icon={<User className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">No. Telepon</label>
                <div className="relative">
                <TextInput
                  className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  value={formData.phone || ''}
                  placeholder="No HP"
                  icon={<Phone className="text-red" size={20} />}
                />
                {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block font-inter font-medium text-black/70">Alamat</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                disabled={!isEditing}
                value={formData.alamat || ''}
                placeholder="Alamat"
                icon={<MapPinned className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Provinsi */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Provinsi</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
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
              <label className="block font-inter font-medium text-black/70">Gender</label>
              <div className="relative">
              <Select
                unstyled
                isDisabled={!isEditing}
                value={genderOptions.find(opt => opt.value === formData.gender) || null}
                onChange={(selected) =>
                  setFormData({ ...formData, gender: selected?.value as "Laki-Laki" | "Perempuan" })
                }
                options={genderOptions}
                classNames={{
                  control: () =>
                    "border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-12 px-4 font-inter focus:border-red transition-all duration-300",
                  valueContainer: () => "px-2",
                  placeholder: () => "text-red/50 font-inter",
                  menu: () => "border-2 border-red/20 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl mt-2",
                  menuList: () => "max-h-40 overflow-y-auto",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-4 py-3 cursor-pointer font-inter transition-all duration-200",
                      isFocused ? "bg-red/10 text-black" : "text-black",
                      isSelected ? "bg-red text-white" : "text-black"
                    ].join(" "),
                }}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Sabuk */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Sabuk</label>
              <div className="relative">
              <Select
                unstyled
                isDisabled={!isEditing}
                value={beltOptions.find(opt => opt.value === formData.belt) || null}
                onChange={(selected) =>
                  setFormData({ ...formData, belt: selected?.value || '' })
                }
                options={beltOptions}
                classNames={{
                  control: () =>
                    "border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-12 px-4 font-inter focus:border-red transition-all duration-300",
                  valueContainer: () => "px-2",
                  placeholder: () => "text-red/50 font-inter",
                  menu: () => "border-2 border-red/20 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl mt-2",
                  menuList: () => "max-h-40 overflow-y-auto",
                  option: ({ isFocused, isSelected }) =>
                    [
                      "px-4 py-3 cursor-pointer font-inter transition-all duration-200",
                      isFocused ? "bg-red/10 text-black" : "text-black",
                      isSelected ? "bg-red text-white" : "text-black"
                    ].join(" "),
                }}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Umur */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Umur</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, umur: Number(e.target.value) })}
                disabled={!isEditing}
                value={formData.umur.toString()}
                placeholder="Umur"
                icon={<CalendarFold className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Berat Badan */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Berat Badan (kg)</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, bb: Number(e.target.value) })}
                disabled={!isEditing}
                value={formData.bb?.toString() || ''}
                placeholder="Berat Badan"
                icon={<Scale className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* Tinggi Badan */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">Tinggi Badan (cm)</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, tb: Number(e.target.value) })}
                disabled={!isEditing}
                value={formData.tb?.toString() || ''}
                placeholder="Tinggi Badan"
                icon={<Ruler className="text-red" size={20} />}
              />
              {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
              </div>
            </div>

            {/* NIK */}
            <div className="space-y-2">
              <label className="block font-inter font-medium text-black/70">NIK</label>
              <div className="relative">
              <TextInput
                className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                disabled={!isEditing}
                value={formData.nik || ''}
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
              <label className="block font-inter font-medium text-black/70">Akte Kelahiran</label>
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
              <label className="block font-inter font-medium text-black/70">Pas Foto 3x4</label>
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
              <label className="block font-inter font-medium text-black/70">Sertifikasi Belt</label>
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
              <label className="block font-inter font-medium text-black/70">KTP (Wajib untuk 17+)</label>
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