import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Map, Building, Flag, Menu, Award, Users, Calendar } from 'lucide-react';
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

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
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
    className={`font-plex font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 ${className}`}
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
        <h3 className="font-plex font-medium text-black/60 text-sm">{title}</h3>
        <p className="font-bebas text-2xl text-black/80">{value}</p>
      </div>
    </div>
  </div>
);

const Dojang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [userDojang, setUserDojang] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

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
        const { data } = await apiClient.get("/dojang/my-dojang");

        setUserDojang(data);
        setFormData({
          name: data.nama_dojang || "",
          email: data.email || "",
          phone: data.no_telp || "",
          negara: data.negara || "",
          provinsi: data.provinsi || "",
          kota: data.kota || "",
          kecamatan: data.kecamatan || "",
          kelurahan: data.kelurahan || "",
          alamat: data.alamat || "",
        });
      } catch (err: any) {
        console.error(err);
        toast.error("Gagal mengambil data dojang");
      }
    };

    fetchDojang();
  }, [user, navigate]);

  const handleCancel = () => {
    setIsEditing(false);
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
  };

  // 🔹 Update dojang
  const handleUpdate = async () => {
    try {
      const updateData = {
        nama_dojang: formData.name,
        email: formData.email,
        no_telp: formData.phone,
        negara: formData.negara,
        provinsi: formData.provinsi,
        kota: formData.kota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        alamat: formData.alamat,
      };
      
      const { data } = await apiClient.put(`/dojang/${userDojang.id_dojang}`, updateData);

      setUserDojang(data); // pake hasil dari server, bukan formData
      setIsEditing(false);
      toast.success("Data dojang berhasil diperbarui");
    

    } catch (err: any) {
      console.error(err);
      toast.error("update dojang gagal");
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center">
        <p className="text-red font-plex text-lg">Memuat data dojang...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="w-full min-h-screen flex flex-col">
          
          {/* Header Section - Fixed positioning for desktop */}
          <div className="sticky top-0 z-30 bg-gradient-to-br from-white via-red/5 to-yellow/10 border-b border-white/20 backdrop-blur-sm">
            <div className="px-4 lg:px-8 py-6 lg:py-8">
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

                {/* Title */}
                <div className="flex-1">
                  <h1 className="font-bebas text-4xl lg:text-5xl xl:text-6xl text-black/80 tracking-wider">
                    DATA DOJANG
                  </h1>
                  <p className="font-plex text-black/60 text-base lg:text-lg mt-2">
                    Kelola informasi dojang dan lokasi pelatihan
                  </p>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:flex gap-3">
                  {!isEditing ? (
                    <GeneralButton
                      label="Ubah Data Dojang"
                      className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
                      onClick={() => setIsEditing(true)}
                    />
                  ) : (
                    <>
                      <GeneralButton
                        label="Batal"
                        className="cursor-pointer text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50"
                        onClick={handleCancel}
                      />
                      <GeneralButton
                        label="Simpan"
                        className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
                        onClick={handleUpdate}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            {/* Form Section */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-xl border border-white/50 max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-3 mb-8">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-red/10 rounded-xl">
                    <Building className="text-red" size={20} />
                  </div>
                  <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                    INFORMASI DOJANG
                  </h2>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex gap-3 lg:hidden">
                  {!isEditing ? (
                    <GeneralButton
                      label="Ubah Data Dojang"
                      className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
                      onClick={() => setIsEditing(true)}
                    />
                  ) : (
                    <>
                      <GeneralButton
                        label="Batal"
                        className="cursor-pointer text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50"
                        onClick={handleCancel}
                      />
                      <GeneralButton
                        label="Simpan"
                        className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2"
                        onClick={handleUpdate}
                      />
                    </>
                  )}
                </div>
              </div>

              {userDojang && (
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
                      onChange={(e: React.ChangeChange<HTMLInputElement>) => setFormData({ ...formData, kelurahan: e.target.value })}
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
              )}

              {/* Save reminder for mobile */}
              {isEditing && (
                <div className="mt-6 p-4 bg-yellow/10 border border-yellow/30 rounded-xl lg:hidden">
                  <p className="text-sm font-plex text-yellow">
                    💡 Jangan lupa untuk menyimpan perubahan setelah selesai mengedit
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
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