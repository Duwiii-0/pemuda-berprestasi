import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Users, Award, TrendingUp, Search, Filter, Eye, Edit, UserPlus } from 'lucide-react';

// Types
interface NavbarProps {
  mobile?: boolean;
  onClose?: () => void;
}

interface AtlitData {
  id: number;
  name: string;
  provinsi: string;
  gender: "Laki-Laki" | "Perempuan";
  umur: number;
  belt?: string;
  phone?: string;
  alamat?: string;
  nik?: string;
  bb?: number;
  tb?: number;
}

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
  trend?: string;
}

// Mock data - replace with your actual data
const dummyAtlits: AtlitData[] = [
  { id: 1, name: "Rizky Purnama", provinsi: "Jawa Barat", gender: "Laki-Laki", umur: 20, belt: "hitam" },
  { id: 2, name: "Aulia", provinsi: "DKI Jakarta", gender: "Perempuan", umur: 19, belt: "putih" },
  { id: 3, name: "Andi", provinsi: "DKI Jakarta", gender: "Laki-Laki", umur: 20, belt: "hitam" },
  { id: 4, name: "Siti", provinsi: "Jawa Barat", gender: "Perempuan", umur: 21, belt: "putih" },
  { id: 5, name: "Budi Santoso", provinsi: "Jawa Tengah", gender: "Laki-Laki", umur: 22, belt: "hitam" },
  { id: 6, name: "Maya Sari", provinsi: "Jawa Timur", gender: "Perempuan", umur: 18, belt: "putih" },
];

// Mock components - replace with your actual imports
const NavbarDashboard: React.FC<NavbarProps> = ({ mobile, onClose }) => (
  <div className={mobile ? "fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50" : "hidden lg:block w-64 h-screen bg-white shadow-lg fixed left-0 top-0"}>
    {mobile && (
      <button onClick={onClose} className="absolute top-4 right-4 p-2">
        <Menu size={24} />
      </button>
    )}
    <div className="p-6">
      <div className="font-bebas text-2xl text-center mb-8 text-red">LOGO</div>
      <div className="font-bebas text-xl mb-8">DASHBOARD</div>
      
      <nav className="space-y-2">
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Data Dojang</a>
        <a href="#" className="block p-3 rounded-lg bg-red text-white font-inter">Data Atlit</a>
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Riwayat Pertandingan</a>
        <a href="#" className="block p-3 rounded-lg hover:bg-red/10 text-red border border-red/20 font-inter">Ganti Password</a>
      </nav>
      
      <div className="absolute bottom-6 left-6 right-6">
        <button className="w-full p-3 rounded-lg border border-red/20 text-red hover:bg-red/5 font-inter">
          Logout
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">© 2025 apani</p>
      </div>
    </div>
  </div>
);

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color, trend }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-inter font-medium text-black/60 text-sm">{title}</h3>
          <p className="font-bebas text-2xl text-black/80">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-right">
          <span className="text-xs font-inter text-green-600">{trend}</span>
        </div>
      )}
    </div>
  </div>
);

const DataAtlit = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "Laki-Laki" | "Perempuan">("all");

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Filter logic
  const filteredAtlits = dummyAtlits.filter(atlit => {
    const matchesSearch = atlit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atlit.provinsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || atlit.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Stats calculations
  const totalAtlits = dummyAtlits.length;
  const lakiLakiCount = dummyAtlits.filter(a => a.gender === "Laki-Laki").length;
  const perempuanCount = dummyAtlits.filter(a => a.gender === "Perempuan").length;
  const avgAge = Math.round(dummyAtlits.reduce((sum, a) => sum + a.umur, 0) / totalAtlits);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
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
                  DATA ATLIT
                </h1>
                <p className="font-inter text-black/60 text-lg mt-2">
                  Kelola data dan informasi atlet terdaftar
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard 
                  icon={Users}
                  title="Total Atlet"
                  value={totalAtlits.toString()}
                  color="bg-gradient-to-br from-red to-red/80"
                  trend="+12% bulan ini"
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
                  value={`${avgAge} thn`}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="p-3 rounded-xl bg-red text-white hover:bg-red/90 transition-all duration-300 shadow-lg">
                <UserPlus size={20} />
              </button>
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
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-inter"
                  />
                </div>
              </div>
              
              {/* Gender Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setGenderFilter("all")}
                  className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    genderFilter === "all"
                      ? "bg-red text-white"
                      : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setGenderFilter("Laki-Laki")}
                  className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    genderFilter === "Laki-Laki"
                      ? "bg-blue-500 text-white"
                      : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  onClick={() => setGenderFilter("Perempuan")}
                  className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    genderFilter === "Perempuan"
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
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red/10 rounded-xl">
                <Users className="text-red" size={20} />
              </div>
              <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                DAFTAR ATLET ({filteredAtlits.length})
              </h2>
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
                        key={atlit.id}
                        className={`transition-all duration-200 hover:bg-white/50 cursor-pointer ${
                          index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                        }`}
                        onClick={() => navigate(`/dashboard/atlit/${atlit.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas">
                              {atlit.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-inter font-semibold text-black/80">{atlit.name}</p>
                              <p className="font-inter text-sm text-black/60">ID: {atlit.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-inter text-black/70">{atlit.provinsi}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                              atlit.gender === "Laki-Laki"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-pink-100 text-pink-600"
                            }`}
                          >
                            {atlit.gender}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-inter font-medium text-black/70">{atlit.umur} thn</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlit.id}`);
                              }}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlit.id}`);
                              }}
                              className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all duration-200"
                            >
                              <Edit size={16} />
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
                <p className="font-inter text-gray-500">Tidak ada atlet yang ditemukan</p>
                <p className="font-inter text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
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