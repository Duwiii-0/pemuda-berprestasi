import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Calendar, Users, MapPin, Search } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import { useKompetisi } from "../../context/KompetisiContext";
import type { Kompetisi } from "../../context/KompetisiContext";

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
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

const DataKompetisi = () => {
  const navigate = useNavigate();
  const { kompetisiList, loadingKompetisi, errorKompetisi, fetchKompetisiList, fetchAtletByKompetisi, atletList } = useKompetisi();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI">("all");
  const [selectedKompetisi, setSelectedKompetisi] = useState<Kompetisi | null>(null);
  const [showPeserta, setShowPeserta] = useState(false);

  useEffect(() => {
    fetchKompetisiList();
  }, []);

  const handleKompetisiClick = async (kompetisi: Kompetisi) => {
    setSelectedKompetisi(kompetisi);
    setShowPeserta(true);
    await fetchAtletByKompetisi(kompetisi.id_penyelenggara);
  };

  const formatTanggal = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
      switch (status) {
        case "PENDAFTARAN": return "bg-green-100 text-green-600";
        case "SEDANG_DIMULAI": return "bg-yellow-100 text-yellow-600";
        case "SELESAI": return "bg-gray-100 text-gray-600";
        default: return "bg-gray-100 text-gray-600";
      }
  };

  const filteredKompetisi = kompetisiList.filter(k => {
    const matchesSearch = k.nama_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (k.lokasi?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loadingKompetisi) return <p>Loading...</p>;
  if (errorKompetisi) return <p>{errorKompetisi}</p>;

  // Halaman detail peserta
  if (showPeserta && selectedKompetisi) {
    const peserta = atletList.map(atlet => ({
      id: atlet.id_atlet,
      nama: atlet.nama_atlet,
      gender: atlet.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-Laki' : 'Perempuan'
    }));

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-64 min-h-screen p-8">
          <button onClick={() => setShowPeserta(false)} className="text-red mb-4">← Kembali</button>
          <h1 className="font-bebas text-4xl">{selectedKompetisi.nama_event}</h1>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border border-white/30 rounded-xl overflow-hidden">
              <thead className="bg-red text-white">
                <tr>
                  <th className="px-6 py-3">Nama Atlet</th>
                  <th className="px-6 py-3 text-center">Gender</th>
                </tr>
              </thead>
              <tbody>
                {peserta.map(p => (
                  <tr key={p.id} className="hover:bg-yellow/5 cursor-pointer">
                    <td className="px-6 py-4" onClick={() => navigate(`/dashboard/atlit/${p.id}`)}>{p.nama}</td>
                    <td className="px-6 py-4 text-center">{p.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {peserta.length === 0 && <p className="mt-4 text-center text-gray-500">Belum ada atlet yang mendaftar</p>}
          </div>
        </div>
      </div>
    );
  }

  // Halaman utama daftar kompetisi dengan search + filter
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />
      <div className="lg:ml-64 min-h-screen p-8">
              <div>
                <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA KOmpetisi
                </h1>
                <p className="font-plex text-black/60 text-lg mt-2">
                  Lihat info kompetisi dan peserta yang terdaftar
                </p>
              </div>


        {/* Search & Status Filter */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 my-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red/60" size={20} />
                <input
                  type="text"
                  placeholder="Cari nama kompetisi atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {["all", "PENDAFTARAN", "SEDANG_DIMULAI", "SELESAI"].map((status) => {
                // tentukan apakah tombol ini aktif
                const isActive = statusFilter === status;
              
                // tentukan warna dan border sesuai status
                let buttonClass = "";
                switch (status) {
                  case "PENDAFTARAN":
                    buttonClass = isActive
                      ? "bg-green-100 text-green-600 border border-green-200"
                      : "text-green-600 border border-green-600 hover:bg-green-50";
                    break;
                  case "SEDANG_DIMULAI":
                    buttonClass = isActive
                      ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                      : "text-yellow-600 border border-yellow-600 hover:bg-yellow-50";
                    break;
                  case "SELESAI":
                    buttonClass = isActive
                      ? "bg-gray-100 text-gray-600 border border-gray-200"
                      : "text-gray-600 border border-gray-600 hover:bg-gray-50";
                    break;
                  default: // all
                    buttonClass = isActive
                      ? "bg-red text-white border border-red-200"
                      : "text-red border border-red-600 hover:bg-red-50";
                    break;
                }
              
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${buttonClass}`}
                  >
                    {status === "all"
                      ? "Semua"
                      : status === "PENDAFTARAN"
                      ? "Pendaftaran"
                      : status === "SEDANG_DIMULAI"
                      ? "Sedang Dimulai"
                      : "Selesai"}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Tabel Kompetisi */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="overflow-x-auto rounded-2xl border border-white/50">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red to-red/80 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bebas text-lg">Nama Kompetisi</th>
                  <th className="px-6 py-4 text-center font-bebas text-lg">Tanggal Mulai</th>
                  <th className="px-6 py-4 text-center font-bebas text-lg">Lokasi</th>
                  <th className="px-6 py-4 text-center font-bebas text-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {filteredKompetisi.map((k) => (
                  <tr
                    key={k.id_penyelenggara}
                    className="transition-all duration-200 hover:bg-white/50 cursor-pointer"
                    onClick={() => handleKompetisiClick(k)}
                  >
                    <td className="px-6 py-4">{k.nama_event}</td>
                    <td className="px-6 py-4 text-center">{formatTanggal(k.tanggal_mulai)}</td>
                    <td className="px-6 py-4 text-center">{k.lokasi || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(k.status)}`}>
                        {k.status === "PENDAFTARAN"
                          ? "Pendaftaran"
                          : k.status === "SEDANG_DIMULAI"
                          ? "Sedang Dimulai"
                          : "Selesai"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredKompetisi.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="font-plex text-gray-500">Tidak ada kompetisi yang ditemukan</p>
                <p className="font-plex text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataKompetisi;
