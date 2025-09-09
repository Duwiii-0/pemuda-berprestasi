import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Map, Building, Flag, Menu, Award, Users, Calendar, Edit3, Save, X } from 'lucide-react';
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
    className={`font-plex font-medium px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 ${className}`}
  >
    {label}
  </button>
);

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white lg:w-6 lg:h-6" />
        </div>
        <div>
          <h3 className="font-plex font-medium text-black/60 text-xs lg:text-sm">{title}</h3>
          <p className="font-bebas text-xl lg:text-2xl text-black/80">{value}</p>
        </div>
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
  const [loading, setLoading] = useState(false);

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
        setLoading(true);
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
      } finally {
        setLoading(false);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const establishedYear = userDojang?.tanggal_didirikan ? new Date(userDojang.tanggal_didirikan).getFullYear() : null;
  const yearsActive = establishedYear ? new Date().getFullYear() - establishedYear : 0;

  if (!formData) {
    return (
      <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red mb-4"></div>
            <p className="text-red font-plex text-lg">Memuat data dojang...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
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
            <div className="space-y-4 lg:space-y-6 flex-1 w-full">
              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA DOJANG
                </h1>
                <p className="font-plex text-black/60 text-base lg:text-lg mt-2">
                  Kelola informasi dojang dan lokasi pelatihan
                </p>
              </div>
              
              {/* Quick Stats */}
              {userDojang && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <StatsCard 
                    icon={Building}
                    title="Status Dojang"
                    value="Aktif"
                    color="bg-gradient-to-br from-red to-red/80"
                  />
                  <StatsCard 
                    icon={MapPin}
                    title="Lokasi"
                    value={userDojang.kota || "Tidak diketahui"}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                  />
                  <StatsCard 
                    icon={Calendar}
                    title="Tahun Aktif"
                    value={yearsActive > 0 ? `${yearsActive} Tahun` : "Baru"}
                    color="bg-gradient-to-br from-yellow to-yellow/80"
                  />
                  <StatsCard 
                    icon={Award}
                    title="Provinsi"
                    value={userDojang.provinsi || "Tidak diketahui"}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 xl:p-8 shadow-xl border border-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4 mb-4 lg:mb-6">
              <div className="flex gap-3 lg:gap-4 items-center">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Building className="text-red" size={18} />
                </div>
                <h2 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
                  INFORMASI DOJANG
                </h2>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 lg:gap-3">
                {!isEditing ? (
                  <GeneralButton
                    label="Ubah Data Dojang"
                    className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 text-sm lg:text-base"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  />
                ) : (
                  <>
                    <GeneralButton
                      label="Batal"
                      className="cursor-pointer text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50 text-sm lg:text-base"
                      onClick={handleCancel}
                      disabled={loading}
                    />
                    <GeneralButton
                      label="Simpan"
                      className="cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 text-sm lg:text-base"
                      onClick={handleUpdate}
                      disabled={loading}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red"></div>
                <p className="font-plex text-black/60 mt-2">
                  {isEditing ? "Menyimpan data..." : "Memuat data..."}
                </p>
              </div>
            )}

            {/* Desktop Form */}
            {userDojang && !loading && (
              <div className="hidden lg:block">
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kelurahan: e.target.value })}
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
              </div>
            )}

            {/* Mobile Form */}
            {userDojang && !loading && (
              <div className="lg:hidden space-y-4">
                {/* Basic Info Card */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
                  <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
                    <Building size={18} className="text-red" />
                    INFORMASI DASAR
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Nama Dojang</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        value={formData.name}
                        placeholder="Masukkan nama dojang"
                        icon={<Building className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Email Dojang</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        value={formData.email}
                        placeholder="Masukkan email dojang"
                        icon={<Mail className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Nomor Telepon</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        value={formData.phone}
                        placeholder="Masukkan nomor telepon"
                        icon={<Phone className="text-red/60" size={18} />}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50">
                  <h3 className="font-bebas text-lg text-black/80 mb-3 flex items-center gap-2">
                    <MapPin size={18} className="text-red" />
                    LOKASI DOJANG
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Negara</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, negara: e.target.value })}
                          disabled={!isEditing}
                          value={formData.negara}
                          placeholder="Negara"
                          icon={<Flag className="text-red/60" size={16} />}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Provinsi</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, provinsi: e.target.value })}
                          disabled={!isEditing}
                          value={formData.provinsi}
                          placeholder="Provinsi"
                          icon={<Map className="text-red/60" size={16} />}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Kota</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kota: e.target.value })}
                          disabled={!isEditing}
                          value={formData.kota}
                          placeholder="Kota"
                          icon={<Building className="text-red/60" size={16} />}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-plex font-medium text-black/70 text-xs">Kecamatan</label>
                        <TextInput
                          className="w-full"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kecamatan: e.target.value })}
                          disabled={!isEditing}
                          value={formData.kecamatan}
                          placeholder="Kecamatan"
                          icon={<Map className="text-red/60" size={16} />}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Kelurahan</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kelurahan: e.target.value })}
                        disabled={!isEditing}
                        value={formData.kelurahan}
                        placeholder="Masukkan kelurahan"
                        icon={<Map className="text-red/60" size={18} />}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-plex font-medium text-black/70 text-xs">Alamat Lengkap</label>
                      <TextInput
                        className="w-full"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, alamat: e.target.value })}
                        disabled={!isEditing}
                        value={formData.alamat}
                        placeholder="Masukkan alamat lengkap"
                        icon={<MapPin className="text-red/60" size={18} />}
                      />
                    </div>
                  </div>
                </div>

                {/* Save reminder for mobile */}
                {isEditing && (
                  <div className="p-4 bg-yellow/10 border border-yellow/30 rounded-xl">
                    <p className="text-sm font-plex text-yellow flex items-center gap-2">
                      <Award size={16} />
                      Jangan lupa untuk menyimpan perubahan setelah selesai mengedit
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!userDojang && !loading && (
              <div className="text-center py-8 lg:py-12">
                <Building className="mx-auto text-gray-400 mb-4" size={40} />
                <p className="font-plex text-gray-500">Data dojang tidak ditemukan</p>
                <p className="font-plex text-sm text-gray-400 mt-2">Silakan refresh halaman atau hubungi admin</p>
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
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dojang;