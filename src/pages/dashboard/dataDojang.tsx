import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Map, Building, Flag, Menu, Edit3, Award, Users, Calendar } from 'lucide-react';

// Types untuk components
interface NavbarProps {
  mobile?: boolean;
  onClose?: () => void;
}

interface TextInputProps {
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface GeneralButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
}

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

// Mock components - replace with your actual imports
const Navbardashboard: React.FC<NavbarProps> = ({ mobile, onClose }) => (
  <div className={mobile ? "fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50" : "hidden lg:block w-64 h-screen bg-white shadow-lg fixed left-0 top-0"}>
    {mobile && (
      <button onClick={onClose} className="absolute top-4 right-4 p-2">
        <Menu size={24} />
      </button>
    )}
    <div className="p-6">
      <div className="font-bebas text-2xl text-center mb-8 text-red">LOGO</div>
      <div className="font-bebas text-xl mb-8">DASHBOARD</div>
      
      {/* Navigation Items */}
      <nav className="space-y-2">
        <a href="#" className="block p-3 rounded-lg bg-red text-white font-inter">Data Dojang</a>
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Data Atlit</a>
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Riwayat Pertandingan</a>
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Ganti Password</a>
      </nav>
      
      {/* Logout Button */}
      <div className="absolute bottom-6 left-6 right-6">
        <button className="w-full p-3 rounded-lg border border-red/20 text-red hover:bg-red/5 font-inter">
          Logout
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">© 2025 apani</p>
      </div>
    </div>
  </div>
);

const TextInput: React.FC<TextInputProps> = ({ placeholder, className, icon, value, disabled, onChange }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center border-2 border-red/20 hover:border-red/40 focus-within:border-red rounded-xl px-4 py-3 gap-3 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
        {icon && <span className="text-red/60 group-focus-within:text-red transition-colors">{icon}</span>}
        <input
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          type="text"
          className="w-full outline-none bg-transparent placeholder-red/30 text-black/80 font-inter"
        />
      </div>
      {disabled && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
    </div>
  );
};

const GeneralButton: React.FC<GeneralButtonProps> = ({ label, className, onClick }) => (
  <button
    onClick={onClick}
    className={`font-inter font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 ${className}`}
  >
    {label}
  </button>
);

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="font-inter font-medium text-black/60 text-sm">{title}</h3>
        <p className="font-bebas text-2xl text-black/80">{value}</p>
      </div>
    </div>
  </div>
);

const Dojang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    namaDojang: "Dojang Pemuda Berprestasi Depok",
    nomorTelepon: "021-87654321",
    emailDojang: "depok@pemudaberprestasi.id",
    negara: "Indonesia",
    provinsi: "Jawa Barat",
    kecamatan: "Pancoran Mas",
    kabupatenKota: "Kota Depok",
    kelurahan: "Depok",
    alamat: "Jl. Margonda Raya No. 123, Komplek Pemuda Center"
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUpdate = () => {
    console.log("Data dojang diupdate:", formData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar - Always visible */}
      <Navbardashboard />

      {/* Main Content - Adjusted for sidebar */}
      <div className="lg:ml-64 min-h-screen">
        <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-8 pt-8 pb-12 px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
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
            <div className="space-y-6 flex-1">
              <div>
                <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA DOJANG
                </h1>
                <p className="font-inter text-black/60 text-lg mt-2">
                  Kelola informasi dojang dan lokasi pelatihan
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard 
                  icon={Award}
                  title="Status"
                  value="Aktif"
                  color="bg-gradient-to-br from-red to-red/80"
                />
                <StatsCard 
                  icon={Users}
                  title="Atlet Terdaftar"
                  value="127"
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
                <StatsCard 
                  icon={Calendar}
                  title="Tahun Berdiri"
                  value="2018"
                  color="bg-gradient-to-br from-black/70 to-black/50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <GeneralButton
                  label="Ubah Data Dojang"
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

          {/* Form Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red/10 rounded-xl">
                <Building className="text-red" size={20} />
              </div>
              <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                INFORMASI DOJANG
              </h2>
              {isEditing && (
                <div className="ml-auto">
                  <div className="flex items-center gap-2 bg-yellow/20 text-yellow px-3 py-1 rounded-full text-sm font-inter">
                    <Edit3 size={14} />
                    Mode Edit
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
                  Nama Dojang
                </label>
                <TextInput
                  className="w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, namaDojang: e.target.value })}
                  disabled={!isEditing}
                  value={formData.namaDojang}
                  placeholder="Masukkan nama dojang"
                  icon={<Building className="text-red/60" size={20} />}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
                  Nomor Telepon
                </label>
                <TextInput
                  className="w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nomorTelepon: e.target.value })}
                  disabled={!isEditing}
                  value={formData.nomorTelepon}
                  placeholder="Masukkan nomor telepon"
                  icon={<Phone className="text-red/60" size={20} />}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
                  Email Dojang
                </label>
                <TextInput
                  className="w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, emailDojang: e.target.value })}
                  disabled={!isEditing}
                  value={formData.emailDojang}
                  placeholder="Masukkan email dojang"
                  icon={<Mail className="text-red/60" size={20} />}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
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
                <label className="block font-inter font-medium text-black/70 text-sm">
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
                <label className="block font-inter font-medium text-black/70 text-sm">
                  Kabupaten/Kota
                </label>
                <TextInput
                  className="w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                  disabled={!isEditing}
                  value={formData.kabupatenKota}
                  placeholder="Masukkan kabupaten/kota"
                  icon={<Building className="text-red/60" size={20} />}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
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
                <label className="block font-inter font-medium text-black/70 text-sm">
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

              <div className="lg:col-span-2 space-y-2">
                <label className="block font-inter font-medium text-black/70 text-sm">
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

            {/* Save reminder for mobile */}
            {isEditing && (
              <div className="mt-6 p-4 bg-yellow/10 border border-yellow/30 rounded-xl">
                <p className="text-sm font-inter text-yellow">
                  💡 Jangan lupa untuk menyimpan perubahan setelah selesai mengedit
                </p>
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
            <Navbardashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dojang;