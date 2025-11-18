// src/pages/adminkomp/Penimbangan.tsx
import React, { useEffect, useState } from "react";
import {
  XCircle,
  Loader,
  Search,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  Scale,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { apiClient } from "../../config/api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useDojang } from "../../context/dojangContext";
import { kelasBeratOptionsMap } from "../../dummy/beratOptions";

const Penimbangan: React.FC = () => {
  const { user } = useAuth();
  const {
    pesertaList,
    fetchAtletByKompetisi,
    updatePesertaStatus,
    loadingAtlet,
  } = useKompetisi();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<string>("ALL");
  const [filterKelasUsia, setFilterKelasUsia] = useState<"ALL" | "Super pracadet" | "Pracadet" | "Cadet" | "Junior" | "Senior">("ALL");
  const [filterLevel, setFilterLevel] = useState<"pemula" | "prestasi" | null>(null);
  const [filterDojang, setFilterDojang] = useState<string>("ALL");
  const { dojangOptions, refreshDojang } = useDojang();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Modal State
  const [showPenimbanganModal, setShowPenimbanganModal] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<any | null>(null);
  const [penimbanganData, setPenimbanganData] = useState<{
    penimbangan1: string | number;
    penimbangan2: string | number;
  }>({ penimbangan1: "", penimbangan2: "" });
  const [savingPenimbangan, setSavingPenimbangan] = useState(false);

  const kompetisiId =
    user?.role === "ADMIN_KOMPETISI"
      ? user?.admin_kompetisi?.id_kompetisi
      : null;

  useEffect(() => {
    refreshDojang();
    if (kompetisiId) {
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId]);

  const handleRowClick = (peserta: any) => {
    if (peserta.is_team) {
        toast.error("Penimbangan hanya untuk peserta individu.");
        return;
    }
    setSelectedPeserta(peserta);
    setPenimbanganData({
        penimbangan1: peserta.atlet?.penimbangan1 || "",
        penimbangan2: peserta.atlet?.penimbangan2 || "",
    });
    setShowPenimbanganModal(true);
  };
  
  const handleRejection = async (id: number) => {
    if (!kompetisiId) return;
    setProcessing(id);
    try {
      await updatePesertaStatus(kompetisiId, id, "REJECTED");
      toast.success("Status peserta berhasil diubah menjadi Ditolak.");
      fetchAtletByKompetisi(kompetisiId);
    } catch (error) {
      toast.error("Gagal menolak peserta.");
    } finally {
      setProcessing(null);
    }
  };

  const handleSubmitPenimbangan = async () => {
    if (!selectedPeserta || !kompetisiId) return;

    setSavingPenimbangan(true);
    try {
        const payload = {
            penimbangan1: penimbanganData.penimbangan1 ? parseFloat(String(penimbanganData.penimbangan1)) : null,
            penimbangan2: penimbanganData.penimbangan2 ? parseFloat(String(penimbanganData.penimbangan2)) : null,
        };

        await apiClient.put(
            `/kompetisi/${kompetisiId}/peserta/${selectedPeserta.id_peserta_kompetisi}/penimbangan`,
            payload
        );
        
        toast.success("Data penimbangan berhasil disimpan.");
        setShowPenimbanganModal(false);
        setSelectedPeserta(null);
        fetchAtletByKompetisi(kompetisiId); // Refresh data
    } catch (error: any) {
        console.error("Error saving weigh-in data:", error);
        toast.error(error.response?.data?.message || "Gagal menyimpan data.");
    } finally {
        setSavingPenimbangan(false);
    }
  };

  const displayedPesertas = pesertaList.filter((peserta: any) => {
    const isApproved = peserta.status === "APPROVED";
    const namaPeserta = peserta.is_team
      ? "" // Tim tidak ditampilkan
      : peserta.atlet?.nama_atlet || "";

    if (peserta.is_team) return false;

    const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory = filterCategory === "ALL" || kategori === filterCategory.toUpperCase();
    const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas?.toUpperCase() || "";
    const matchesKelasBerat = filterKelasBerat === "ALL" || kelasBerat === filterKelasBerat.toUpperCase();
    const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok?.toUpperCase() || "";
    const matchesKelasUsia = filterKelasUsia === "ALL" || kelasUsia === filterKelasUsia.toUpperCase();
    const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toUpperCase() || "";
    const matchesLevel = !filterLevel || level === filterLevel.toUpperCase();
    const pesertaDojang = peserta.atlet?.dojang?.id_dojang?.toString() || "";
    const matchesDojang = filterDojang === "ALL" || pesertaDojang === filterDojang;

    return (
      isApproved &&
      matchesSearch &&
      matchesCategory &&
      matchesKelasBerat &&
      matchesKelasUsia &&
      matchesLevel &&
      matchesDojang
    );
  });

  const totalPages = Math.ceil(displayedPesertas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPesertas = displayedPesertas.slice(startIndex, endIndex);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterCategory,
    filterKelasBerat,
    filterKelasUsia,
    filterLevel,
    filterDojang,
    itemsPerPage,
  ]);

  if (user?.role !== "ADMIN_KOMPETISI") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FBEF" }}>
        <div className="rounded-xl shadow-sm border p-6 max-w-md w-full" style={{ backgroundColor: "rgba(153, 13, 53, 0.05)", borderColor: "rgba(153, 13, 53, 0.2)" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#990D35" }} />
            <p className="text-sm sm:text-base" style={{ color: "#990D35" }}>
              Akses ditolak. Hanya Admin Kompetisi yang dapat mengakses halaman ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingAtlet) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FBEF" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: "#990D35" }} size={32} />
          <p style={{ color: "#050505", opacity: 0.6 }}>Memuat data peserta...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <Scale size={28} className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0" style={{ color: "#990D35" }} />
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bebas leading-tight" style={{ color: "#050505" }}>
                    Manajemen Penimbangan
                  </h1>
                  <p className="text-sm sm:text-base mt-1" style={{ color: "#050505", opacity: 0.6 }}>
                    Input hasil penimbangan berat badan peserta. Hanya peserta individu berstatus APPROVED yang ditampilkan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl shadow-sm border p-4 sm:p-6 mb-6" style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}>
            <div className="space-y-4">
                <div className="w-full">
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#050505", opacity: 0.4 }} size={18}/>
                    <input type="text" placeholder="Cari peserta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                        style={{ borderColor: "#990D35", backgroundColor: "#F5FBEF", color: "#050505" }}/>
                    </div>
                </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden space-y-4">
            {currentPesertas.map((peserta: any) => (
                <div key={peserta.id_peserta_kompetisi} onClick={() => handleRowClick(peserta)}
                    className="rounded-xl shadow-sm border p-4 cursor-pointer hover:bg-yellow-50"
                    style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-semibold text-base" style={{ color: "#050505" }}>{peserta.atlet.nama_atlet}</h3>
                            <p className="text-sm mt-1" style={{ color: "#050505", opacity: 0.6 }}>{peserta.atlet.dojang.nama_dojang}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRejection(peserta.id_peserta_kompetisi); }} disabled={processing === peserta.id_peserta_kompetisi}
                                className="p-2 text-white rounded-lg" style={{ backgroundColor: "#990D35" }}>
                            <XCircle size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span style={{ color: "#050505", opacity: 0.5 }}>Timbang #1:</span>
                            <p className="font-medium">{peserta.atlet.penimbangan1 ? `${peserta.atlet.penimbangan1} kg` : '-'}</p>
                        </div>
                        <div>
                            <span style={{ color: "#050505", opacity: 0.5 }}>Timbang #2:</span>
                            <p className="font-medium">{peserta.atlet.penimbangan2 ? `${peserta.atlet.penimbangan2} kg` : '-'}</p>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
              <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: "#F5B700" }}>
                      <tr>
                        {["Nama Peserta", "Kelas", "Dojang", "Penimbangan #1", "Penimbangan #2", "Aksi"].map((header) => (
                          <th key={header} className="py-3 px-4 font-semibold text-sm text-left" style={{ color: "#050505" }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "rgba(153, 13, 53, 0.1)" }}>
                      {currentPesertas.map((peserta: any) => (
                          <tr key={peserta.id_peserta_kompetisi} onClick={() => handleRowClick(peserta)} className="transition-colors hover:bg-yellow-50 cursor-pointer">
                            <td className="py-3 px-4 font-medium text-sm" style={{ color: "#050505" }}>
                                {peserta.atlet?.nama_atlet || 'Nama tidak tersedia'}
                            </td>
                            <td className="py-3 px-4 text-sm" style={{ color: "#050505", opacity: 0.7 }}>
                                {peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || peserta.kelas_kejuaraan?.poomsae?.nama_kelas || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm" style={{ color: "#050505", opacity: 0.7 }}>
                                {peserta.atlet?.dojang?.nama_dojang || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm" style={{ color: "#050505", opacity: 0.7 }}>
                                {peserta.atlet?.penimbangan1 ? `${peserta.atlet.penimbangan1} kg` : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm" style={{ color: "#050505", opacity: 0.7 }}>
                                {peserta.atlet?.penimbangan2 ? `${peserta.atlet.penimbangan2} kg` : '-'}
                            </td>
                            <td className="py-3 px-4">
                                <button onClick={(e) => { e.stopPropagation(); handleRejection(peserta.id_peserta_kompetisi); }} disabled={processing === peserta.id_peserta_kompetisi}
                                  className="inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all text-sm font-medium"
                                  style={{ backgroundColor: "#990D35" }} title="Tolak Peserta">
                                  {processing === peserta.id_peserta_kompetisi ? (
                                    <Loader size={16} className="animate-spin" />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                  <span className="hidden xl:inline">Tolak</span>
                                </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </div>
      </div>
      
      {showPenimbanganModal && selectedPeserta && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center gap-3" style={{borderColor: "rgba(153, 13, 53, 0.1)"}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)" }}>
                    <Scale size={24} style={{ color: "white" }} />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Input Penimbangan</h3>
                    <p className="text-sm text-gray-500">Peserta: {selectedPeserta.atlet.nama_atlet}</p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Penimbangan #1 (kg)</label>
                    <input type="number" value={penimbanganData.penimbangan1} onChange={(e) => setPenimbanganData({...penimbanganData, penimbangan1: e.target.value})}
                    className="w-full pl-4 pr-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: "rgba(153, 13, 53, 0.2)", backgroundColor: "white", color: "#050505" }} placeholder="Masukkan berat" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">Penimbangan #2 (kg)</label>
                    <input type="number" value={penimbanganData.penimbangan2} onChange={(e) => setPenimbanganData({...penimbanganData, penimbangan2: e.target.value})}
                    className="w-full pl-4 pr-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: "rgba(153, 13, 53, 0.2)", backgroundColor: "white", color: "#050505" }} placeholder="Masukkan berat (opsional)" />
                </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3" style={{borderTop: "1px solid rgba(153, 13, 53, 0.1)"}}>
                <button onClick={() => setShowPenimbanganModal(false)} className="px-5 py-2.5 rounded-xl border-2 font-bold text-sm shadow-sm hover:shadow-md"
                 style={{ borderColor: "#990D35", color: "#990D35", backgroundColor: "white" }}>Batal</button>
                <button onClick={handleSubmitPenimbangan} disabled={savingPenimbangan}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)" }}>
                    {savingPenimbangan ? <Loader size={18} className="animate-spin"/> : <Save size={18} />}
                    Simpan
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Penimbangan;
