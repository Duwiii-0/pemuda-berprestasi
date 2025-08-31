// src/pages/admin/ValidasiPeserta.tsx
import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, Loader } from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";
import { useAuth } from "../../context/authContext";
import { Search } from "lucide-react";

const ValidasiPeserta: React.FC = () => {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const {
    kompetisiList,
    fetchKompetisiList,
    loadingKompetisi,
    pesertaList, // KONSISTEN: gunakan pesertaList
    fetchAtletByKompetisi,
    loadingAtlet,
    updatePesertaStatus,
  } = useKompetisi();

  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedKompetisiId, setSelectedKompetisiId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "DOJANG" | "POOMSAE">("ALL");

  useEffect(() => {
    console.log("[ValidasiPeserta] Fetching kompetisi list...");
    fetchKompetisiList();
  }, []);

  useEffect(() => {
    console.log("[ValidasiPeserta] Kompetisi list updated:", kompetisiList);
  }, [kompetisiList]);

  useEffect(() => {
    if (selectedKompetisiId) {
      console.log(
        `[ValidasiPeserta] Kompetisi dipilih ID: ${selectedKompetisiId}, fetching peserta...`
      );
      fetchAtletByKompetisi(selectedKompetisiId);
    }
  }, [selectedKompetisiId]);

  // FIX: Ganti atletList dengan pesertaList
  useEffect(() => {
    console.log("[ValidasiPeserta] Peserta list state updated:", pesertaList);
    
    // Debug struktur data lengkap
    if (pesertaList.length > 0) {
      console.log("=== DEBUGGING STRUKTUR DATA ===");
      console.log("Sample data item 0:", pesertaList[0]);
      console.log("Available keys:", Object.keys(pesertaList[0]));
      
      // Cek apakah ada nested objects
      Object.keys(pesertaList[0]).forEach(key => {
        if (typeof (pesertaList[0] as any) [key] === 'object' && (pesertaList[0] as any) [key] !== null) {
          console.log(`Nested object in ${key}:`, (pesertaList[0] as any)[key]);
        }
      });
      
      // Cek item yang is_team: false (individual)
      const individualPeserta = pesertaList.find(item => !item.is_team);
      if (individualPeserta) {
        console.log("Individual peserta sample:", individualPeserta);
      }
      
      // Cek item yang is_team: true (tim)
      const teamPeserta = pesertaList.find(item => item.is_team);
      if (teamPeserta) {
        console.log("Team peserta sample:", teamPeserta);
      }
      console.log("=== END DEBUGGING ===");
    }
  }, [pesertaList]); // FIX: pesertaList bukan atletList

  const handleApproval = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "APPROVED");
    console.log(`[ValidasiPeserta] Peserta ID ${id} sudah disetujui.`);
  } catch (err) {
    console.error("Gagal menyetujui peserta:", err);
  } finally {
    setProcessing(null);
  }
};

const handleRejection = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "REJECTED");
    console.log(`[ValidasiPeserta] Peserta ID ${id} sudah ditolak.`);
  } catch (err) {
    console.error("Gagal menolak peserta:", err);
  } finally {
    setProcessing(null);
  }
};


  const getGenderBadge = (gender: string) =>
    gender === "LAKI_LAKI" ? (
      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
        Putra
      </span>
    ) : (
      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs">
        Putri
      </span>
    );

  if (!selectedKompetisiId) {
    console.log(
      "[ValidasiPeserta] Tidak ada kompetisi dipilih, menampilkan list."
    );
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Pilih Kompetisi untuk Validasi Peserta
        </h1>

        {loadingKompetisi ? (
          <p>Loading data kompetisi...</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left font-semibold">
                    Nama Event
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    Tanggal Mulai
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">Status</th>
                  <th className="py-4 px-6 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kompetisiList.map((k) => (
                  <tr
                    key={k.id_kompetisi}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium">{k.nama_event}</td>
                    <td className="py-4 px-6">
                      {new Date(k.tanggal_mulai).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-4 px-6">{k.status}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          console.log(
                            `[ValidasiPeserta] Tombol pilih kompetisi ditekan: ${k.id_kompetisi}`
                          );
                          setSelectedKompetisiId(k.id_kompetisi);
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Pilih
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // FIX: Ganti atletList dengan pesertaList
  console.log(
    "[ValidasiPeserta] Menampilkan peserta kompetisi ID:",
    selectedKompetisiId,
    pesertaList
  );

  // FIX: Update filtering logic untuk pesertaList
  const displayedPesertas = pesertaList.filter((peserta) => {
  const namaPeserta = peserta.is_team
    ? peserta.anggota_tim?.map((a) => a.atlet.nama_atlet).join(" ") || ""
    : peserta.atlet?.nama_atlet || "";

  const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = filterStatus === "ALL" || peserta.status === filterStatus;

  // kategori dari kelas_kejuaraan.cabang ("POOMSAE" | "KYORUGI")
  const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
  const matchesCategory =
    filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

  return matchesSearch && matchesStatus && matchesCategory;
});


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Validasi Peserta Kompetisi</h1>

      <button
        onClick={() => setSelectedKompetisiId(null)}
        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
      >
        ← Kembali ke Daftar Kompetisi
      </button>

       {/* FILTER + SEARCH */}
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      {/* Search */}
      <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Semua Status" : s}
              </option>
            ))}
          </select>
          
          {/* Filter Kategori */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {["ALL", "POOMSAE", "KYORUGI"].map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Semua Kategori" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingAtlet ? (
        <p>Loading data peserta...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Nama</th>
                <th className="py-4 px-6 text-left font-semibold">Kategori</th>
                <th className="py-4 px-6 text-left font-semibold">
                  Kelas Berat
                </th>
                <th className="py-4 px-6 text-left font-semibold">
                  Kelas Poomsae
                </th>
                <th className="py-4 px-6 text-left font-semibold">
                  Kelompok Usia
                </th>
                <th className="py-4 px-6 text-left font-semibold">
                  Jenis Kelamin
                </th>
                <th className="py-4 px-6 text-left font-semibold">
                  Nama Dojang
                </th>
                <th className="py-4 px-6 text-center font-semibold">Status</th>
                <th className="py-4 px-6 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
<tbody>
  {displayedPesertas.map((peserta: any) => {
    const isTeam = peserta.is_team;
    const cabang = peserta.kelas_kejuaraan?.cabang || "-";
    const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";

    const kelasBerat =
      cabang === "KYORUGI"
        ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas ||
          (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-")
        : "-";

    const kelasPoomsae =
      cabang === "POOMSAE"
        ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || peserta.atlet?.belt || "-"
        : "-";

    const namaPeserta = isTeam
      ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
      : peserta.atlet?.nama_atlet || "-";

    const dojang =
      isTeam && peserta.anggota_tim?.length
        ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
        : peserta.atlet?.dojang?.nama_dojang || "-";

    return (
      <tr
        key={peserta.id_peserta_kompetisi}
        className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <td className="py-4 px-6 font-medium">{namaPeserta}</td>
        <td className="py-4 px-6">{`${cabang} - ${level}`}</td>
        <td className="py-4 px-6">{kelasBerat}</td>
        <td className="py-4 px-6 text-center">{kelasPoomsae}</td>
        <td className="py-4 px-6 text-center">
          {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok ||
            (peserta.atlet?.umur ? `${peserta.atlet.umur} tahun` : "-")}
        </td>
        <td className="text-center">
          {!isTeam 
          ? (peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-")
          : "-"}
        </td>
        <td className="py-4 px-6">{dojang}</td>
        <td className="py-4 px-6">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              peserta.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : peserta.status === "APPROVED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {peserta.status}
          </span>
        </td>
        <td className="py-4 px-6 flex gap-1">
          <button
            onClick={() => handleApproval(peserta.id_peserta_kompetisi)}
            disabled={processing === peserta.id_peserta_kompetisi}
            className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-xs"
          >
            {processing === peserta.id_peserta_kompetisi ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            Setujui
          </button>
          <button
            onClick={() => handleRejection(peserta.id_peserta_kompetisi)}
            disabled={processing === peserta.id_peserta_kompetisi}
            className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-xs"
          >
            {processing === peserta.id_peserta_kompetisi ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Tolak
          </button>
        </td>
      </tr>
    );
  })}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
};

export default ValidasiPeserta;