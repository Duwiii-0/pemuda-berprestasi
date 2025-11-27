import React, { useEffect, useState } from "react";
import { GitBranch, Trophy, Eye, Loader, Menu, Award, Filter } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import NavbarDashboard from "../../components/navbar/navbarDashboard";

// ✅ TAMBAHKAN TYPE DEFINITIONS
interface Dojang {
  id_dojang: number;
  nama_dojang: string;
  id_kompetisi?: number;
}

interface Pelatih {
  id_pelatih: number;
  nama_pelatih: string;
  id_dojang: number;
  no_telp: string;
  kota: string;
  provinsi: string;
  alamat: string;
  tanggal_lahir: string;
  nik: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN" | null;
  dojang?: Dojang; // ✅ Optional dojang relation
  id_kompetisi?: number; // ✅ Optional direct kompetisi ID
}

interface User {
  id_akun: number;
  username: string;
  role: string;
  pelatih?: Pelatih;
}

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

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

interface KelasKejuaraan {
  id_kelas_kejuaraan: string;
  cabang: "KYORUGI" | "POOMSAE";
  kategori_event: { nama_kategori: string };
  kelompok: { nama_kelompok: string };
  kelas_berat?: { nama_kelas: string };
  poomsae?: { nama_kelas: string };
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  peserta_count: number;
  bracket_status: "not_created" | "created" | "in_progress" | "completed";
}

const BracketList: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [kelasKejuaraan, setKelasKejuaraan] = useState<KelasKejuaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ TAMBAH FILTER STATE
  const [filters, setFilters] = useState({
    cabang: "ALL" as "ALL" | "KYORUGI" | "POOMSAE",
    kategori: "ALL" as "ALL" | "Prestasi" | "Pemula",
    kelompok: "ALL" as string,
    status: "ALL" as "ALL" | "created" | "in_progress" | "completed",
  });
  const [showFilters, setShowFilters] = useState(false);


  // ✅ FUNGSI UNTUK GET UNIQUE VALUES
  const getUniqueKelompok = () => {
    const kelompoks = kelasKejuaraan
      .map(k => k.kelompok.nama_kelompok)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return kelompoks;
  };

  // ✅ FUNGSI FILTER
  const getFilteredBrackets = (brackets: KelasKejuaraan[]) => {
    return brackets.filter(kelas => {
      // Filter Cabang
      if (filters.cabang !== "ALL" && kelas.cabang !== filters.cabang) {
        return false;
      }

      // Filter Kategori
      if (filters.kategori !== "ALL") {
        const isPemula = kelas.kategori_event.nama_kategori.toLowerCase().includes('pemula');
        if (filters.kategori === "Pemula" && !isPemula) return false;
        if (filters.kategori === "Prestasi" && isPemula) return false;
      }

      // Filter Kelompok
      if (filters.kelompok !== "ALL" && kelas.kelompok.nama_kelompok !== filters.kelompok) {
        return false;
      }

      // Filter Status
      if (filters.status !== "ALL" && kelas.bracket_status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  // ✅ RESET FILTERS
  const resetFilters = () => {
    setFilters({
      cabang: "ALL",
      kategori: "ALL",
      kelompok: "ALL",
      status: "ALL",
    });
  };

  // ✅ CHECK IF ANY FILTER ACTIVE
  const hasActiveFilters = () => {
    return filters.cabang !== "ALL" || 
           filters.kategori !== "ALL" || 
           filters.kelompok !== "ALL" || 
           filters.status !== "ALL";
  };

useEffect(() => {
  const fetchBrackets = async () => {
    try {
      setLoading(true);
      
      const getKompetisiId = async (): Promise<number | null> => {
        const currentUser = user as User | null;
        
        if (!currentUser?.pelatih) {
          console.warn('⚠️ No pelatih data in user');
          return null;
        }

        if (currentUser.pelatih.dojang?.id_kompetisi) {
          return currentUser.pelatih.dojang.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_kompetisi) {
          return currentUser.pelatih.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_dojang) {
          try {
            const dojangResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/dojang/${currentUser.pelatih.id_dojang}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (dojangResponse.ok) {
              const dojangResult = await dojangResponse.json();
              const kompetisiId = dojangResult.success 
                ? dojangResult.data?.id_kompetisi 
                : dojangResult.id_kompetisi;
                
              if (kompetisiId) return kompetisiId;
            }
          } catch (err) {
            console.error('❌ Error fetching dojang:', err);
          }
        }
        
        try {
          const kompetisiResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/kompetisi`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (kompetisiResponse.ok) {
            const kompetisiList = await kompetisiResponse.json();
            const activeKompetisi = kompetisiList.data?.find(
              (k: any) => k.status === 'SEDANG_DIMULAI' || k.status === 'AKAN_DIMULAI'
            );
            
            if (activeKompetisi) return activeKompetisi.id_kompetisi;
          }
        } catch (err) {
          console.error('❌ Error fetching kompetisi list:', err);
        }
        
        return null;
      };

      const kompetisiId = await getKompetisiId();
      
      if (!kompetisiId) {
        console.error('❌ No kompetisi found for user');
        setKelasKejuaraan([]);
        return;
      }

      console.log('🔍 Fetching medal tally data for kompetisi:', kompetisiId);

      // ✅ GUNAKAN ENDPOINT YANG SAMA DENGAN MEDAL TALLY
      const timestamp = `?_t=${Date.now()}`;
      const url = `${import.meta.env.VITE_API_URL}/public/kompetisi/${kompetisiId}/medal-tally${timestamp}`;
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medal tally: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Medal tally response:', result);
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from medal tally');
      }

      // ✅ HELPER FUNCTION: Count unique participants dari matches
      const countUniqueParticipants = (matches: any[]): number => {
        const participants = new Set<number>();
        matches.forEach(match => {
          if (match.participant1?.id) participants.add(match.participant1.id);
          if (match.participant2?.id) participants.add(match.participant2.id);
        });
        return participants.size;
      };

      // ✅ TRANSFORM DATA: Filter kelas yang memiliki bracket
      const kelasWithBracket = result.data.kelas
        .filter((kelas: any) => {
          // Harus ada bracket dan matches
          if (!kelas.bracket || !kelas.bracket.matches || kelas.bracket.matches.length === 0) {
            return false;
          }
          
          const participantCount = countUniqueParticipants(kelas.bracket.matches);
          const isPemula = kelas.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
          const isPoomsae = kelas.cabang === 'POOMSAE';
          
          // Validasi minimum peserta
          if (isPoomsae && !isPemula) {
            return participantCount >= 3; // Poomsae Prestasi minimal 3
          }
          
          return participantCount >= 4; // Lainnya minimal 4
        })
        .map((kelas: any) => {
          const participantCount = countUniqueParticipants(kelas.bracket.matches);
          
          // Tentukan status bracket berdasarkan matches
          let bracketStatus: 'created' | 'in_progress' | 'completed' = 'created';
          
          const hasMatchesWithScores = kelas.bracket.matches.some((m: any) => 
            (m.scoreA > 0 || m.scoreB > 0)
          );
          
          const totalMatches = kelas.bracket.matches.length;
          const completedMatches = kelas.bracket.matches.filter((m: any) => 
            (m.scoreA > 0 || m.scoreB > 0)
          ).length;
          
          if (completedMatches === totalMatches && totalMatches > 0) {
            bracketStatus = 'completed';
          } else if (hasMatchesWithScores) {
            bracketStatus = 'in_progress';
          }

          return {
            id_kelas_kejuaraan: kelas.id_kelas_kejuaraan,
            cabang: kelas.cabang,
            kategori_event: kelas.kategori_event,
            kelompok: kelas.kelompok,
            kelas_berat: kelas.kelas_berat,
            poomsae: kelas.poomsae,
            jenis_kelamin: kelas.jenis_kelamin || 
              kelas.kelas_berat?.jenis_kelamin || 
              'LAKI_LAKI',
            peserta_count: participantCount,
            bracket_status: bracketStatus
          };
        });
      
      console.log('✅ Transformed brackets with medal tally data:', kelasWithBracket);
      console.log('✅ Total brackets found:', kelasWithBracket.length);
      
      setKelasKejuaraan(kelasWithBracket);
      
    } catch (error) {
      console.error('❌ Error fetching brackets:', error);
      setKelasKejuaraan([]);
    } finally {
      setLoading(false);
    }
  };

  if (token && user) {
    fetchBrackets();
  }
}, [token, user]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getStatusBadge = (status: KelasKejuaraan["bracket_status"]) => {
    const statusConfig = {
      not_created: {
        bg: "rgba(156, 163, 175, 0.2)",
        text: "#6b7280",
        label: "Belum Dibuat",
      },
      created: {
        bg: "rgba(245, 183, 0, 0.2)",
        text: "#F5B700",
        label: "Sudah Dibuat",
      },
      in_progress: {
        bg: "rgba(34, 197, 94, 0.2)",
        text: "#22c55e",
        label: "Berlangsung",
      },
      completed: {
        bg: "rgba(34, 197, 94, 0.2)",
        text: "#059669",
        label: "Selesai",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium font-plex"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    );
  };

  const availableBrackets = kelasKejuaraan.filter(k => k.bracket_status !== 'not_created');
  const filteredBrackets = getFilteredBrackets(availableBrackets);
  const totalBrackets = availableBrackets.length;
  const inProgressCount = availableBrackets.filter(k => k.bracket_status === 'in_progress').length;
  const completedCount = availableBrackets.filter(k => k.bracket_status === 'completed').length;

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
                  BRACKET TOURNAMENT
                </h1>
                <p className="font-plex text-black/60 text-base lg:text-lg mt-2">
                  Lihat bracket tournament untuk setiap kelas kejuaraan
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <StatsCard 
                  icon={GitBranch}
                  title="Total Bracket"
                  value={totalBrackets.toString()}
                  color="bg-gradient-to-br from-red to-red/80"
                />
                <StatsCard 
                  icon={Trophy}
                  title="Berlangsung"
                  value={inProgressCount.toString()}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
                <StatsCard 
                  icon={Award}
                  title="Selesai"
                  value={completedCount.toString()}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader className="animate-spin text-red" size={32} />
                <p className="font-plex text-black/60">Memuat bracket...</p>
              </div>
            </div>
          )}

          {/* Content - Kelas Cards */}
          {!loading && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 xl:p-8 shadow-xl border border-white/50">
              {/* Header with Filter Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-3 lg:gap-4 items-center">
                  <div className="p-2 bg-red/10 rounded-xl">
                    <GitBranch className="text-red" size={18} />
                  </div>
                  <div>
                    <h2 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
                      DAFTAR BRACKET
                    </h2>
                    <p className="font-plex text-sm text-black/60">
                      Menampilkan {filteredBrackets.length} dari {availableBrackets.length} bracket
                    </p>
                  </div>
                </div>

                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-plex font-medium transition-all shadow-md hover:shadow-lg ${
                    hasActiveFilters()
                      ? 'bg-red text-white'
                      : 'bg-white text-red border border-red/20'
                  }`}
                >
                  <Filter size={18} />
                  <span>Filter</span>
                  {hasActiveFilters() && (
                    <span className="bg-white text-red rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {Object.values(filters).filter(v => v !== "ALL").length}
                    </span>
                  )}
                </button>
              </div>

              {/* ✅ FILTER PANEL */}
              {showFilters && (
                <div className="bg-white/80 rounded-xl p-4 lg:p-6 mb-6 shadow-lg border border-white/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filter Cabang */}
                    <div>
                      <label className="font-plex font-medium text-sm text-black/70 mb-2 block">
                        Cabang
                      </label>
                      <select
                        value={filters.cabang}
                        onChange={(e) => setFilters({ ...filters, cabang: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-lg border border-red/20 font-plex focus:outline-none focus:ring-2 focus:ring-red/30 bg-white"
                      >
                        <option value="ALL">Semua Cabang</option>
                        <option value="KYORUGI">Kyorugi</option>
                        <option value="POOMSAE">Poomsae</option>
                      </select>
                    </div>

                    {/* Filter Kategori */}
                    <div>
                      <label className="font-plex font-medium text-sm text-black/70 mb-2 block">
                        Kategori
                      </label>
                      <select
                        value={filters.kategori}
                        onChange={(e) => setFilters({ ...filters, kategori: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-lg border border-red/20 font-plex focus:outline-none focus:ring-2 focus:ring-red/30 bg-white"
                      >
                        <option value="ALL">Semua Kategori</option>
                        <option value="Prestasi">Prestasi</option>
                        <option value="Pemula">Pemula</option>
                      </select>
                    </div>

                    {/* Filter Kelompok */}
                    <div>
                      <label className="font-plex font-medium text-sm text-black/70 mb-2 block">
                        Kelompok Umur
                      </label>
                      <select
                        value={filters.kelompok}
                        onChange={(e) => setFilters({ ...filters, kelompok: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-red/20 font-plex focus:outline-none focus:ring-2 focus:ring-red/30 bg-white"
                      >
                        <option value="ALL">Semua Kelompok</option>
                        {getUniqueKelompok().map(kelompok => (
                          <option key={kelompok} value={kelompok}>
                            {kelompok}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Status */}
                    <div>
                      <label className="font-plex font-medium text-sm text-black/70 mb-2 block">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-lg border border-red/20 font-plex focus:outline-none focus:ring-2 focus:ring-red/30 bg-white"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="created">Sudah Dibuat</option>
                        <option value="in_progress">Berlangsung</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </div>
                  </div>

                  {/* Reset Button */}
                  {hasActiveFilters() && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-lg font-plex font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bracket Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredBrackets.map((kelas) => (
                  <div
                    key={kelas.id_kelas_kejuaraan}
                    className="bg-white/80 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-white/50"
                    onClick={() => navigate(`/dashboard/bracket-viewer/${kelas.id_kelas_kejuaraan}`)}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-white/30 bg-gradient-to-r from-red/5 to-red/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold font-plex shadow-sm bg-red text-white">
                          {kelas.cabang}
                        </span>
                        {getStatusBadge(kelas.bracket_status)}
                      </div>

                      <h3 className="font-plex font-bold text-base leading-tight mb-2 text-black/80">
                        {kelas.kategori_event.nama_kategori.toUpperCase()} - {kelas.kelompok.nama_kelompok}
                      </h3>

                      <p className="font-plex text-sm text-black/60">
                        {kelas.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri"}
                        {kelas.kelas_berat && ` - ${kelas.kelas_berat.nama_kelas}`}
                        {kelas.poomsae && ` - ${kelas.poomsae.nama_kelas}`}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="p-4">
                      <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-plex font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 text-white">
                        <Eye size={18} />
                        <span>Lihat Bracket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State - No Results */}
              {filteredBrackets.length === 0 && availableBrackets.length > 0 && (
                <div className="text-center py-12">
                  <Filter size={64} className="text-red/40 mx-auto mb-4" />
                  <h3 className="font-bebas text-2xl text-black/80 mb-2">
                    TIDAK ADA HASIL
                  </h3>
                  <p className="font-plex text-base text-black/60 mb-4">
                    Tidak ada bracket yang sesuai dengan filter yang dipilih
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 rounded-xl font-plex font-medium bg-red text-white hover:bg-red/90 transition-all shadow-md"
                  >
                    Reset Filter
                  </button>
                </div>
              )}

              {/* Empty State - No Brackets */}
              {availableBrackets.length === 0 && (
                <div className="text-center py-12">
                  <Trophy size={64} className="text-red/40 mx-auto mb-4" />
                  <h3 className="font-bebas text-2xl text-black/80 mb-2">
                    BELUM ADA BRACKET
                  </h3>
                  <p className="font-plex text-base text-black/60">
                    Bracket belum dibuat oleh admin kompetisi
                  </p>
                </div>
              )}
            </div>
          )}
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

export default BracketList;