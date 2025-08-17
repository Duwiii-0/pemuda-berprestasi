import { ArrowLeft, Mail, KeyRound, IdCard, Phone, CalendarFold, Map, MapPinned, User, Settings as SettingsIcon, Shield, Edit3, Save, X } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import TextInput from '../../components/textInput';
import GeneralButton from '../../components/generalButton'; 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red/10 rounded-lg">
                    <User className="text-red" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bebas text-xl text-gray-800 tracking-wide">INFORMASI PERSONAL</h2>
                    <p className="font-inter text-sm text-gray-500">Data pribadi Anda</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-lg font-inter text-sm hover:bg-red/90 transition-colors duration-300"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg font-inter text-sm transition-colors duration-300"
                      >
                        <X size={16} />
                        Batal
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-lg font-inter text-sm hover:bg-red/90 transition-colors duration-300"
                      >
                        <Save size={16} />
                        Simpan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Username */}
                  <div className="md:col-span-2">
                    <label className="block font-inter text-sm text-gray-700 mb-2">Username</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Mail className="text-gray-400" size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.email}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg font-inter text-sm focus:outline-none"
                        placeholder="Email"
                      />
                    </div>
                  </div>

                  {/* NIK */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">NIK</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <IdCard className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.nik || ''}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan NIK"
                      />
                    </div>
                  </div>

                  {/* Nama */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <User className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Nomor Telepon</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Phone className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan nomor telepon"
                      />
                    </div>
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Tanggal Lahir</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <CalendarFold className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.tglLahir || ''}
                        onChange={(e) => setFormData({ ...formData, tglLahir: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Jenis Kelamin</label>
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
                          `border rounded-lg py-3 px-3 font-inter text-sm focus:outline-none transition-colors ${
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
                  </div>

                  {/* Kota */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Kota</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Map className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.kota || ''}
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan kota"
                      />
                    </div>
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="block font-inter text-sm text-gray-700 mb-2">Provinsi</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Map className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.Provinsi || ''}
                        onChange={(e) => setFormData({ ...formData, Provinsi: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan provinsi"
                      />
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="md:col-span-2">
                    <label className="block font-inter text-sm text-gray-700 mb-2">Alamat Lengkap</label>
                    <div className="relative">
                      <div className="absolute left-3 top-4">
                        <MapPinned className={isEditing ? "text-red" : "text-gray-400"} size={18} />
                      </div>
                      <textarea
                        value={formData.Alamat || ''}
                        onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg font-inter text-sm focus:outline-none resize-none transition-colors ${
                          isEditing 
                            ? 'border-2 border-red bg-white focus:border-red/80' 
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Masukkan alamat lengkap"
                      />
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