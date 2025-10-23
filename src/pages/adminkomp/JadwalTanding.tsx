import React, { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Loader,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { useAuth } from "../../context/authContext";
import axios from "axios";

interface Lapangan {
  id_lapangan: number;
  id_kompetisi: number;
  nama_lapangan: string;
  tanggal: string;
  kelasDipilih: number[];
}

interface HariPertandingan {
  tanggal: string;
  jumlah_lapangan: number;
  lapangan: Lapangan[];
}

interface AntrianLapangan {
  bertanding: number;
  persiapan: number;
  pemanasan: number;
}

interface HariAntrian {
  tanggal: string;
  lapanganAntrian: Record<number, AntrianLapangan>;
}

const JadwalPertandingan: React.FC = () => {
  const {
    kelasKejuaraanList,
    fetchKelasKejuaraanByKompetisi,
    pesertaList,
    fetchAtletByKompetisi,
    loadingKelasKejuaraan,
    loadingAtlet,
    errorKelasKejuaraan,
    errorAtlet,
  } = useKompetisi();

  const { user } = useAuth();
  const idKompetisi = user?.admin_kompetisi?.id_kompetisi;

  const [activeTab, setActiveTab] = useState<"jadwal" | "antrian">("jadwal");
  const [hariList, setHariList] = useState<HariPertandingan[]>([]);
  const [hariAntrianList, setHariAntrianList] = useState<HariAntrian[]>([]);
  const [approvedPesertaByKelas, setApprovedPesertaByKelas] = useState<
    Record<number, any[]>
  >({});

  // Loading & Error states
  const [loadingHari, setLoadingHari] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch kelas kejuaraan dan peserta
  useEffect(() => {
    if (!idKompetisi) {
      console.warn("⚠️ ID Kompetisi belum tersedia");
      return;
    }

    const fetchData = async () => {
      try {
        await fetchKelasKejuaraanByKompetisi(idKompetisi);
        await fetchAtletByKompetisi(idKompetisi);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [idKompetisi]);

  // Fetch hari dan lapangan dari backend
  useEffect(() => {
    if (!idKompetisi) return;
    fetchHariLapangan();
  }, [idKompetisi]);

  const fetchHariLapangan = async () => {
    if (!idKompetisi) return;

    setLoadingHari(true);
    setErrorMessage("");

    try {
      const response = await axios.get(
        `/api/lapangan/kompetisi/${idKompetisi}`
      );

      if (response.data.success) {
        const hariData = response.data.data.hari_pertandingan.map(
          (hari: any) => ({
            tanggal: hari.tanggal,
            jumlah_lapangan: hari.jumlah_lapangan,
            lapangan: hari.lapangan.map((lap: any) => ({
              ...lap,
              kelasDipilih: [], // Will be loaded from jadwal_pertandingan table later
            })),
          })
        );

        setHariList(hariData);
      }
    } catch (error: any) {
      console.error("Error fetching hari lapangan:", error);
      setErrorMessage(
        error.response?.data?.message || "Gagal memuat data lapangan"
      );
    } finally {
      setLoadingHari(false);
    }
  };

  // Pisahkan peserta APPROVED berdasarkan kelas
  useEffect(() => {
    if (!pesertaList || pesertaList.length === 0) return;

    const map: Record<number, any[]> = {};
    pesertaList.forEach((peserta) => {
      if (peserta.status !== "APPROVED") return;

      const idKelas = peserta.kelas_kejuaraan?.id_kelas_kejuaraan;
      if (!idKelas) return;

      if (!map[idKelas]) map[idKelas] = [];

      const pesertaData = {
        id_peserta: peserta.id_peserta_kompetisi,
        nama_peserta: peserta.is_team
          ? `Tim ${
              peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang || "Unknown"
            }`
          : peserta.atlet?.nama_atlet || "Unknown",
        is_team: peserta.is_team,
        dojang: peserta.is_team
          ? peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang
          : peserta.atlet?.dojang?.nama_dojang,
      };

      map[idKelas].push(pesertaData);
    });

    setApprovedPesertaByKelas(map);
  }, [pesertaList]);

  // Sync antrian list dengan hari list
  useEffect(() => {
    setHariAntrianList((prev) => {
      return hariList.map((hari) => {
        const existingHari = prev.find((h) => h.tanggal === hari.tanggal);
        const lapanganAntrian: Record<number, AntrianLapangan> = {};

        hari.lapangan.forEach((lap) => {
          lapanganAntrian[lap.id_lapangan] = existingHari?.lapanganAntrian?.[
            lap.id_lapangan
          ] || {
            bertanding: 1,
            persiapan: 1,
            pemanasan: 1,
          };
        });

        return {
          tanggal: hari.tanggal,
          lapanganAntrian,
        };
      });
    });
  }, [hariList]);

  // Tambah hari baru dengan 3 lapangan (A, B, C)
  const addHari = async () => {
    if (!idKompetisi) return;

    setIsAdding(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("/api/lapangan/tambah-hari", {
        id_kompetisi: idKompetisi,
        jumlah_lapangan: 3, // Default 3 lapangan (A, B, C)
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        await fetchHariLapangan(); // Refresh data

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error: any) {
      console.error("Error tambah hari:", error);
      setErrorMessage(
        error.response?.data?.message || "Gagal menambah hari pertandingan"
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Hapus hari pertandingan
  const hapusHari = async (tanggal: string) => {
    if (!idKompetisi) return;

    if (
      !confirm(
        `Yakin ingin menghapus semua lapangan pada tanggal ${new Date(
          tanggal
        ).toLocaleDateString("id-ID")}?`
      )
    ) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.delete("/api/lapangan/hapus-hari", {
        data: {
          id_kompetisi: idKompetisi,
          tanggal: tanggal,
        },
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        await fetchHariLapangan();

        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error: any) {
      console.error("Error hapus hari:", error);
      setErrorMessage(
        error.response?.data?.message || "Gagal menghapus hari pertandingan"
      );
    }
  };

  // Toggle kelas kejuaraan di lapangan
  const toggleKelas = (
    tanggal: string,
    lapanganId: number,
    kelasId: number
  ) => {
    setHariList((prev) =>
      prev.map((hari) =>
        hari.tanggal === tanggal
          ? {
              ...hari,
              lapangan: hari.lapangan.map((lap) =>
                lap.id_lapangan === lapanganId
                  ? {
                      ...lap,
                      kelasDipilih: lap.kelasDipilih.includes(kelasId)
                        ? lap.kelasDipilih.filter((id) => id !== kelasId)
                        : [...lap.kelasDipilih, kelasId],
                    }
                  : lap
              ),
            }
          : hari
      )
    );
  };

  // Update antrian
  const updateAntrian = (
    tanggal: string,
    lapanganId: number,
    field: "bertanding" | "persiapan" | "pemanasan",
    value: number
  ) => {
    setHariAntrianList((prev) =>
      prev.map((hari) =>
        hari.tanggal === tanggal
          ? {
              ...hari,
              lapanganAntrian: {
                ...hari.lapanganAntrian,
                [lapanganId]: {
                  ...hari.lapanganAntrian[lapanganId],
                  [field]: value,
                },
              },
            }
          : hari
      )
    );
  };

  // Generate nama kelas display
  const generateNamaKelas = (kelas: any) => {
    const parts = [];

    if (kelas.cabang) parts.push(kelas.cabang);
    if (kelas.kategori_event?.nama_kategori)
      parts.push(kelas.kategori_event.nama_kategori);

    const isPoomsaePemula =
      kelas.cabang === "POOMSAE" &&
      kelas.kategori_event?.nama_kategori === "Pemula";

    if (kelas.kelompok?.nama_kelompok && !isPoomsaePemula) {
      parts.push(kelas.kelompok.nama_kelompok);
    }

    if (kelas.kelas_berat) {
      const gender =
        kelas.kelas_berat.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri";
      parts.push(gender);
    }

    if (kelas.kelas_berat?.nama_kelas) parts.push(kelas.kelas_berat.nama_kelas);
    if (kelas.poomsae?.nama_kelas) parts.push(kelas.poomsae.nama_kelas);

    return parts.length > 0 ? parts.join(" - ") : "Kelas Tidak Lengkap";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <Calendar size={32} style={{ color: "#990D35" }} />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bebas"
              style={{ color: "#050505" }}
            >
              PENJADWALAN PERTANDINGAN
            </h1>
            <p className="text-sm" style={{ color: "#050505", opacity: 0.6 }}>
              Kelola jadwal dan antrian pertandingan
            </p>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderColor: "#22c55e",
            }}
          >
            <p className="text-sm font-medium text-green-600">
              {successMessage}
            </p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {(errorMessage || errorKelasKejuaraan || errorAtlet) && (
          <div
            className="mb-6 p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              borderColor: "#dc2626",
            }}
          >
            <p className="text-sm font-medium text-red-600">
              {errorMessage || errorKelasKejuaraan || errorAtlet}
            </p>
          </div>
        )}

        {/* TABS */}
        <div
          className="mb-6 flex gap-2 border-b"
          style={{ borderColor: "rgba(153,13,53,0.2)" }}
        >
          <button
            onClick={() => setActiveTab("jadwal")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === "jadwal"
                ? "border-b-2"
                : "opacity-60 hover:opacity-100"
            }`}
            style={{
              borderColor: activeTab === "jadwal" ? "#990D35" : "transparent",
              color: "#990D35",
            }}
          >
            <Calendar size={18} />
            Setup Jadwal
          </button>
          <button
            onClick={() => setActiveTab("antrian")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === "antrian"
                ? "border-b-2"
                : "opacity-60 hover:opacity-100"
            }`}
            style={{
              borderColor: activeTab === "antrian" ? "#990D35" : "transparent",
              color: "#990D35",
            }}
          >
            <ClipboardList size={18} />
            Pengaturan Antrian
          </button>
        </div>

        {/* LOADING */}
        {(loadingKelasKejuaraan || loadingAtlet || loadingHari) && (
          <div className="flex flex-col justify-center items-center py-10">
            <Loader
              className="animate-spin mb-3"
              size={40}
              style={{ color: "#990D35" }}
            />
            <span className="text-sm font-medium" style={{ color: "#990D35" }}>
              Memuat data...
            </span>
          </div>
        )}

        {/* TAB JADWAL */}
        {activeTab === "jadwal" &&
          !loadingKelasKejuaraan &&
          !loadingAtlet &&
          !loadingHari && (
            <>
              {/* TAMBAH HARI */}
              <div className="mb-6">
                <button
                  onClick={addHari}
                  disabled={isAdding}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#990D35", color: "#F5FBEF" }}
                >
                  {isAdding ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Menambahkan...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Tambah Hari Pertandingan (3 Lapangan)
                    </>
                  )}
                </button>
              </div>

              {/* DAFTAR HARI */}
              {hariList.length === 0 ? (
                <div
                  className="text-center py-12 rounded-xl border"
                  style={{
                    borderColor: "rgba(153,13,53,0.2)",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <Calendar
                    size={48}
                    className="mx-auto mb-3"
                    style={{ color: "#990D35", opacity: 0.5 }}
                  />
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Belum ada hari pertandingan
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#050505", opacity: 0.5 }}
                  >
                    Klik tombol "Tambah Hari Pertandingan" untuk memulai
                  </p>
                </div>
              ) : (
                hariList.map((hari, idx) => (
                  <div
                    key={hari.tanggal}
                    className="rounded-xl shadow-sm border p-6 mb-6"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "#F5FBEF",
                    }}
                  >
                    {/* HEADER HARI */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2
                          className="text-xl font-semibold"
                          style={{ color: "#990D35" }}
                        >
                          Hari ke-{idx + 1}
                        </h2>
                        <p
                          className="text-sm"
                          style={{ color: "#050505", opacity: 0.6 }}
                        >
                          {new Date(hari.tanggal).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => hapusHari(hari.tanggal)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity text-red-600"
                        style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}
                        title="Hapus Hari"
                      >
                        <Trash2 size={14} />
                        Hapus Hari
                      </button>
                    </div>

                    {/* LAPANGAN */}
                    <div className="space-y-4">
                      {hari.lapangan.map((lap) => (
                        <div
                          key={lap.id_lapangan}
                          className="rounded-xl border p-4 space-y-4"
                          style={{
                            borderColor: "#990D35",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <h3
                              className="font-semibold"
                              style={{ color: "#050505" }}
                            >
                              Lapangan {lap.nama_lapangan}
                            </h3>
                          </div>

                          {/* KELAS KEJUARAAN */}
                          <div>
                            <p
                              className="text-sm font-medium mb-2"
                              style={{ color: "#990D35" }}
                            >
                              Pilih Kelas Kejuaraan:
                            </p>

                            <div
                              className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg"
                              style={{ backgroundColor: "#F5FBEF" }}
                            >
                              {kelasKejuaraanList &&
                              kelasKejuaraanList.length > 0 ? (
                                kelasKejuaraanList.map((kelas) => {
                                  const approvedPeserta =
                                    approvedPesertaByKelas[
                                      kelas.id_kelas_kejuaraan
                                    ] || [];
                                  const namaKelasDisplay =
                                    generateNamaKelas(kelas);

                                  return (
                                    <label
                                      key={kelas.id_kelas_kejuaraan}
                                      className="flex flex-col border rounded-md p-2 hover:bg-white cursor-pointer transition-colors"
                                      style={{
                                        borderColor: "rgba(153,13,53,0.3)",
                                      }}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={lap.kelasDipilih.includes(
                                              kelas.id_kelas_kejuaraan
                                            )}
                                            onChange={() =>
                                              toggleKelas(
                                                hari.tanggal,
                                                lap.id_lapangan,
                                                kelas.id_kelas_kejuaraan
                                              )
                                            }
                                            className="accent-[#990D35] cursor-pointer"
                                          />
                                          <span className="text-sm font-medium text-[#050505]">
                                            {namaKelasDisplay}
                                          </span>
                                        </div>
                                        <span
                                          className="text-xs px-2 py-1 rounded-md font-medium"
                                          style={{
                                            backgroundColor:
                                              "rgba(153,13,53,0.1)",
                                            color: "#990D35",
                                          }}
                                        >
                                          {approvedPeserta.length} peserta
                                        </span>
                                      </div>

                                      {/* DAFTAR PESERTA */}
                                      {approvedPeserta.length > 0 && (
                                        <ul className="mt-2 ml-6 list-disc text-xs text-[#050505] space-y-1">
                                          {approvedPeserta.map((p) => (
                                            <li key={p.id_peserta}>
                                              <span className="font-medium">
                                                {p.nama_peserta}
                                              </span>
                                              {p.dojang && (
                                                <span className="text-[#990D35] ml-1">
                                                  ({p.dojang})
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </label>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8">
                                  <p
                                    className="text-sm font-medium mb-1"
                                    style={{ color: "#050505", opacity: 0.6 }}
                                  >
                                    Tidak ada kelas kejuaraan tersedia
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* INFO KELAS TERPILIH */}
                          {lap.kelasDipilih.length > 0 && (
                            <div
                              className="mt-3 p-2 rounded-md"
                              style={{
                                backgroundColor: "rgba(153,13,53,0.05)",
                              }}
                            >
                              <p
                                className="text-xs font-medium mb-1"
                                style={{ color: "#990D35" }}
                              >
                                Kelas yang dipilih: {lap.kelasDipilih.length}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "#050505", opacity: 0.7 }}
                              >
                                Total peserta:{" "}
                                {lap.kelasDipilih.reduce(
                                  (total, kelasId) =>
                                    total +
                                    (approvedPesertaByKelas[kelasId]?.length ||
                                      0),
                                  0
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

        {/* TAB ANTRIAN */}
        {activeTab === "antrian" &&
          !loadingKelasKejuaraan &&
          !loadingAtlet &&
          !loadingHari && (
            <>
              {hariAntrianList.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList
                    size={48}
                    className="mx-auto mb-3"
                    style={{ color: "#990D35", opacity: 0.5 }}
                  />
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    Belum ada jadwal yang dibuat
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#050505", opacity: 0.5 }}
                  >
                    Silakan buat jadwal terlebih dahulu di tab "Setup Jadwal"
                  </p>
                </div>
              ) : (
                hariAntrianList.map((hari, idx) => {
                  const hariJadwal = hariList.find(
                    (h) => h.tanggal === hari.tanggal
                  );
                  if (!hariJadwal || hariJadwal.lapangan.length === 0)
                    return null;

                  return (
                    <div
                      key={hari.tanggal}
                      className="rounded-xl shadow-sm border p-6 mb-6"
                      style={{
                        borderColor: "#990D35",
                        backgroundColor: "#F5FBEF",
                      }}
                    >
                      <div className="mb-4">
                        <h2
                          className="text-xl font-semibold"
                          style={{ color: "#990D35" }}
                        >
                          Hari ke-{idx + 1}
                        </h2>
                        <p
                          className="text-sm"
                          style={{ color: "#050505", opacity: 0.6 }}
                        >
                          {new Date(hari.tanggal).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {hariJadwal.lapangan.map((lap) => (
                          <div
                            key={lap.id_lapangan}
                            className="rounded-xl border p-4"
                            style={{
                              borderColor: "#990D35",
                              backgroundColor: "#FFFFFF",
                            }}
                          >
                            <h3
                              className="font-semibold mb-4"
                              style={{ color: "#050505" }}
                            >
                              Lapangan {lap.nama_lapangan}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Bertanding */}
                              <div>
                                <label
                                  className="block text-sm font-medium mb-2"
                                  style={{ color: "#16a34a" }}
                                >
                                  🟢 Bertanding
                                </label>
                                <select
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.bertanding || 1
                                  }
                                  onChange={(e) =>
                                    updateAntrian(
                                      hari.tanggal,
                                      lap.id_lapangan,
                                      "bertanding",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#16a34a",
                                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                                  }}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                    (num) => (
                                      <option key={num} value={num}>
                                        {num} peserta
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              {/* Persiapan */}
                              <div>
                                <label
                                  className="block text-sm font-medium mb-2"
                                  style={{ color: "#ea580c" }}
                                >
                                  🟠 Persiapan
                                </label>
                                <select
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.persiapan || 1
                                  }
                                  onChange={(e) =>
                                    updateAntrian(
                                      hari.tanggal,
                                      lap.id_lapangan,
                                      "persiapan",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#ea580c",
                                    backgroundColor: "rgba(234, 88, 12, 0.1)",
                                  }}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                    (num) => (
                                      <option key={num} value={num}>
                                        {num} peserta
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              {/* Pemanasan */}
                              <div>
                                <label
                                  className="block text-sm font-medium mb-2"
                                  style={{ color: "#ca8a04" }}
                                >
                                  🟡 Pemanasan
                                </label>
                                <select
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.pemanasan || 1
                                  }
                                  onChange={(e) =>
                                    updateAntrian(
                                      hari.tanggal,
                                      lap.id_lapangan,
                                      "pemanasan",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#ca8a04",
                                    backgroundColor: "rgba(202, 138, 4, 0.1)",
                                  }}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                    (num) => (
                                      <option key={num} value={num}>
                                        {num} peserta
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>

                            {/* Info Kelas */}
                            {lap.kelasDipilih.length > 0 && (
                              <div
                                className="mt-4 p-3 rounded-lg"
                                style={{
                                  backgroundColor: "rgba(153,13,53,0.05)",
                                }}
                              >
                                <p
                                  className="text-xs font-medium mb-1"
                                  style={{ color: "#990D35" }}
                                >
                                  Kelas yang akan bertanding:{" "}
                                  {lap.kelasDipilih.length}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "#050505", opacity: 0.7 }}
                                >
                                  Total peserta:{" "}
                                  {lap.kelasDipilih.reduce(
                                    (total, kelasId) =>
                                      total +
                                      (approvedPesertaByKelas[kelasId]
                                        ?.length || 0),
                                    0
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default JadwalPertandingan;
