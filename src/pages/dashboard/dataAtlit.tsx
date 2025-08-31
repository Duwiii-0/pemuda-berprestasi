import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Users, Award, TrendingUp, Search, Eye, UserPlus } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard"
import { useAuth } from "../../context/authContext";
import { apiClient, setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
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
  </div>
);

const DataAtlit = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [atlits, setAtlits] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "LAKI_LAKI" | "PEREMPUAN">("all");

    useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);
  
  // Fetch data atlit 
  useEffect(() => {
  const fetchAtlits = async () => {
    try {
      // asumsi kamu sudah punya user login dengan id_dojang
      const id_dojang = user?.pelatih?.id_dojang; 
      if (!id_dojang) return;

      const res = await apiClient.get(`/atlet/dojang/${id_dojang}`);

      if (res.success) {
        const profileData = res.data;
        const data = {
          name: profileData.nama_atlet,
          tb: profileData.tinggi_badan,
          bb: profileData.berat_badan,
          tglLahir: profileData.tanggal_lahir ,
          jeniskelamin: profileData.jenis_kelamin,
        };
        setAtlits([data]);
      }
      setAtlits(res.data); // sesuai dengan AtletController.sendSuccess
    } catch (err) {
      console.error("Gagal ambil data atlet:");
    }
  };

  fetchAtlits();
}, [user]);


  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Filter
const filteredAtlits = (atlits).filter(atlit => {
  const matchesSearch = atlit.nama_atlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       atlit.dojang?.provinsi?.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesGender = genderFilter === "all" || atlit.jenis_kelamin === genderFilter;
  return matchesSearch && matchesGender;
});

// Stats
const totalAtlits = atlits.length;
const lakiLakiCount = atlits.filter(a => a.jenis_kelamin === "LAKI_LAKI").length;
const perempuanCount = atlits.filter(a => a.jenis_kelamin === "PEREMPUAN").length;
const avgAge = Math.round(atlits.reduce((sum, a) => sum + a.age, 0) / (atlits.length || 1));


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 lg:px-8">
          
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
                  DATA ATLIT
                </h1>
                <p className="font-plex text-black/60 text-lg mt-2">
                  Kelola data dan informasi atlet terdaftar
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                  icon={Users}
                  title="Total Atlet"
                  value={totalAtlits.toString()}
                  color="bg-gradient-to-br from-red to-red/80"
                />
                <StatsCard 
                  icon={Award}
                  title="Laki-laki"
                  value={lakiLakiCount.toString()}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard 
                  icon={Award}
                  title="Perempuan"
                  value={perempuanCount.toString()}
                  color="bg-gradient-to-br from-pink-500 to-pink-600"
                />
                <StatsCard 
                  icon={TrendingUp}
                  title="Rata-rata Umur"
                  value={`${avgAge} Tahun`}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
              </div>
            </div>
            
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red/60" size={20} />
                  <input
                    type="text"
                    placeholder="Cari nama atlet atau provinsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
                  />
                </div>
              </div>
              
              {/* Gender Filter */}
              <div className="flex flex-col lg:flex-row gap-2">
                <button
                  onClick={() => setGenderFilter("all")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    genderFilter === "all"
                      ? "bg-red text-white"
                      : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setGenderFilter("LAKI_LAKI")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    genderFilter === "LAKI_LAKI"
                      ? "bg-blue-500 text-white"
                      : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  onClick={() => setGenderFilter("PEREMPUAN")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    genderFilter === "PEREMPUAN"
                      ? "bg-pink-500 text-white"
                      : "bg-white/50 text-pink-500 border border-pink-500/20 hover:bg-pink-500/5"
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-xl border border-white/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-3 mb-6">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Users className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DAFTAR ATLET ({filteredAtlits.length})
                </h2>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/dashboard/TambahAtlit')}
                  className="font-plex font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex justify-center items-center cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg gap-2"
                >
                  <UserPlus size={20} />
                  Tambah Atlit
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-white/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                      <th className="px-6 py-4 text-left font-bebas text-lg tracking-wide">NAMA</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">PROVINSI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">GENDER</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">UMUR</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {filteredAtlits.map((atlit, index) => (
                      <tr
                        key={atlit.id_atlet}
                        className={`transition-all duration-200 hover:bg-white/50 cursor-pointer ${
                          index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                        }`}
                        onClick={() => navigate(`/dashboard/atlit/${atlit.id_atlet}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas">
                              {atlit.nama_atlet.charAt(0)}
                            </div>
                            <div>
                              <p className="font-plex font-semibold text-black/80">{atlit.nama_atlet}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-plex text-black/70">{atlit.dojang?.provinsi || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${
                              atlit.jenis_kelamin === "LAKI_LAKI"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-pink-100 text-pink-600"
                            }`}
                          >
                            {atlit.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-plex font-medium text-black/70">{atlit.age} Tahun</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlit.id_atlet}`);
                              }}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty state */}
            {filteredAtlits.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="font-plex text-gray-500">Tidak ada atlet yang ditemukan</p>
                <p className="font-plex text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
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

export default DataAtlit;