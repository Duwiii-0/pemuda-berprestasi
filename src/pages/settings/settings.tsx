import { ArrowLeft, Mail, KeyRound, IdCard, Phone, CalendarFold, Map, MapPinned, User, Settings as SettingsIcon, Shield, Edit3, Save, X } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GeneralButton } from '../dashboard/dataDojang';
import { TextInput } from '../dashboard/dataDojang';
import { useAuth } from "../../context/authContext";
import Select from "react-select";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email,
    password: user?.password,
    name: user?.name,
    phone: user?.phone,
    nik: user?.nik,
    tglLahir: user?.tglLahir,
    kota: user?.kota,
    Alamat: user?.alamat,
    Provinsi: user?.provinsi,
    gender: user?.gender,
  });

  const genderOptions = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user?.email,
      password: user?.password,
      name: user?.name,
      phone: user?.phone,
      nik: user?.nik,
      tglLahir: user?.tglLahir,
      kota: user?.kota,
      Alamat: user?.alamat,
      Provinsi: user?.provinsi,
      gender: user?.gender,
    });
  };

  const handleUpdate = () => {
    console.log("Data akan diupdate:", formData);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to='/' 
            className="inline-flex items-center gap-3 text-gray-600 hover:text-red transition-all duration-300 group mb-6"
          >
            <div className="p-2 rounded-lg bg-white shadow-sm border group-hover:border-red/30 transition-all duration-300">
              <ArrowLeft size={20} className="group-hover:text-red transition-colors duration-300" />
            </div>
            <span className='text-lg font-inter'>Kembali ke Beranda</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red rounded-lg">
              <SettingsIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bebas text-4xl text-gray-800 tracking-wider">PENGATURAN PROFIL</h1>
              <p className="font-inter text-gray-600">Kelola informasi akun dan data pribadi Anda</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Profile Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white/40 rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className='h-24 w-24 rounded-xl overflow-hidden border-2 border-red/20 shadow-sm bg-gray-50 mx-auto'>
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white">
                        <User strokeWidth={1.5} size={32}/>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="font-inter font-semibold text-lg text-gray-800 mb-1">{user.name}</h3>
                <p className="font-inter text-sm text-gray-500 mb-6">Pengguna Terdaftar</p>
                
                {/* Account Actions */}
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate("/resetpassword")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red text-white rounded-lg font-inter text-sm hover:bg-red/90 transition-colors duration-300"
                  >
                    <Shield size={16} />
                    Ganti Password
                  </button>
                  <button className="w-full px-4 py-2.5 border border-red text-red hover:bg-red/5 rounded-lg font-inter text-sm transition-colors duration-300">
                    Hapus Akun
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white/40 rounded-2xl shadow-lg border border-gray-100">
              
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red/10 rounded-lg">
                    <User className="text-red" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bebas text-3xl text-gray-800 tracking-wide">INFORMASI PERSONAL</h2>
                    <p className="font-inter text-sm text-gray-500">Data pribadi Anda</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                   {!isEditing ? (
                     <GeneralButton
                       label="Ubah Data Diri"
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

              {/* Form Fields */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Username */}
                  <div className="md:col-span-2">
                    <div className="space-y-2">
                      <label className="block font-inter font-medium text-black/70 text-sm">
                        Nomor Telepon
                      </label>
                      <TextInput
                        className="w-full"
                        disabled
                        value={formData.email}
                        placeholder="Masukkan nomor telepon"
                        icon={<Phone className="text-red/60" size={20} />}
                      />
                    </div>
                  </div>

                  {/* NIK */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      NIK
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nik: e.target.value })}
                      disabled={!isEditing}
                      value={formData.nik}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>                  
                  
                  {/* Nama */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      Nama Lengkap
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      value={formData.name}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      Nomor Telpon
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

                  {/* Tanggal Lahir */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      Tanggal Lahir
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tglLahir: e.target.value })}
                      disabled={!isEditing}
                      value={formData.tglLahir}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>

                  {/* Gender */}
                  <div >
                    <label className="block font-inter font-medium text-black/70 text-sm">Jenis Kelamin</label>
                    <div className='relative'>
                    <Select
                    
                      unstyled
                      isDisabled={!isEditing}
                      value={genderOptions.find(opt => opt.value === formData.gender) || null}
                      onChange={(selected) =>
                        setFormData({ ...formData, gender: selected?.value as "Laki-Laki" | "Perempuan" })
                      }
                      options={genderOptions}
                      placeholder="Pilih jenis kelamin"
                      classNames={{
                        control: () =>
                          `flex items-center border-2 border-red/20 hover:border-red/40 focus-within:border-red rounded-xl px-4 py-3 gap-3 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                            isEditing 
                              ? 'border-2 border-red bg-white' 
                              : 'border border-gray-200 bg-gray-50'
                          }`,
                        valueContainer: () => "px-1",
                        placeholder: () => "text-gray-400 font-inter text-sm",
                        menu: () => "border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden",
                        menuList: () => "max-h-32 overflow-y-auto",
                        option: ({ isFocused, isSelected }) =>
                          [
                            "px-3 py-2 cursor-pointer font-inter text-sm",
                            isFocused ? "bg-red/10 text-black" : "text-black",
                            isSelected ? "bg-red text-white" : ""
                          ].join(" "),
                      }}
                    />
                    {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                    </div>
                  </div>

                  {/* Kota */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      Kota
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kota: e.target.value })}
                      disabled={!isEditing}
                      value={formData.kota}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>

                  {/* Provinsi */}
                  <div className="space-y-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">
                      Provinsi
                    </label>
                    <TextInput
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, Provinsi: e.target.value })}
                      disabled={!isEditing}
                      value={formData.Provinsi}
                      placeholder="Masukkan nomor telepon"
                      icon={<Phone className="text-red/60" size={20} />}
                    />
                  </div>
                  {/* Alamat */}
                  <div className="md:col-span-2">
                    <label className="block font-inter font-medium text-black/70 text-sm">Alamat Lengkap</label>
                    <div className="relative">
                      <div className="absolute left-3 top-4">
                        <MapPinned className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <textarea
                        value={formData.Alamat || ''}
                        onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full className="flex items-center border-2 border-red/20 hover:border-red/40 focus-within:border-red rounded-xl px-4 py-3 gap-3 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg" ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan alamat lengkap"
                      />
                    {!isEditing && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;