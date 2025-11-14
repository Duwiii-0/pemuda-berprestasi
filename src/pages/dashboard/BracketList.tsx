import React, { useEffect, useState } from "react";
import { GitBranch, Trophy, Eye, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

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

  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        setLoading(true);
        
        const kompetisiId = user?.pelatih?.dojang?.id_kompetisi;
        
        if (!kompetisiId) {
          console.error('No kompetisi found for user');
          return;
        }

        // Fetch list kelas dengan bracket
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kompetisi/${kompetisiId}/brackets/list`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch brackets');

        const result = await response.json();
        setKelasKejuaraan(result.data || []);
      } catch (error) {
        console.error('Error fetching brackets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrackets();
  }, [token, user]);

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
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat bracket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
              }}
            >
              <GitBranch size={32} className="sm:w-8 sm:h-8" style={{ color: "white" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1"
                style={{ color: "#050505" }}
              >
                BRACKET TOURNAMENT
              </h1>
              <p
                className="text-sm sm:text-base"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                Lihat bracket tournament untuk setiap kelas kejuaraan
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT - Kelas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelasKejuaraan
            .filter(kelas => kelas.bracket_status !== 'not_created')
            .map((kelas) => (
              <div
                key={kelas.id_kelas_kejuaraan}
                className="rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                style={{
                  backgroundColor: "#F5FBEF",
                  border: "1px solid rgba(153, 13, 53, 0.1)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Header */}
                <div
                  className="p-5 border-b"
                  style={{
                    background: "linear-gradient(135deg, rgba(153, 13, 53, 0.08) 0%, rgba(153, 13, 53, 0.04) 100%)",
                    borderColor: "rgba(153, 13, 53, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
                      style={{ backgroundColor: "#990D35", color: "white" }}
                    >
                      {kelas.cabang}
                    </span>
                    {getStatusBadge(kelas.bracket_status)}
                  </div>

                  <h3 className="font-bold text-base leading-tight mb-2" style={{ color: "#050505" }}>
                    {kelas.kategori_event.nama_kategori.toUpperCase()} - {kelas.kelompok.nama_kelompok}
                  </h3>

                  <p className="text-sm" style={{ color: "#050505", opacity: 0.7 }}>
                    {kelas.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri"}
                    {kelas.kelas_berat && ` - ${kelas.kelas_berat.nama_kelas}`}
                    {kelas.poomsae && ` - ${kelas.poomsae.nama_kelas}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="p-5">
                  <button
                    onClick={() => navigate(`/dashboard/bracket-viewer/${kelas.id_kelas_kejuaraan}`)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
                      color: "white",
                    }}
                  >
                    <Eye size={18} />
                    <span>Lihat Bracket</span>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Empty State */}
        {kelasKejuaraan.filter(k => k.bracket_status !== 'not_created').length === 0 && (
          <div className="text-center py-16">
            <Trophy size={64} style={{ color: '#990D35', opacity: 0.4 }} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#050505' }}>
              Belum Ada Bracket
            </h3>
            <p className="text-base" style={{ color: '#050505', opacity: 0.6 }}>
              Bracket belum dibuat oleh admin kompetisi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BracketList;