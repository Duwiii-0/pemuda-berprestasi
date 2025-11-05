import React, { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Loader,
  ClipboardList,
  Eye,
  GitBranch,
  Save,
} from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

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

interface BaganInfo {
  id_kelas_kejuaraan: number;
  total_matches: number;
  nama_kelas: string;
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

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const idKompetisi = user?.admin_kompetisi?.id_kompetisi;

  const [activeTab, setActiveTab] = useState<"jadwal" | "antrian">("jadwal");
  const [hariList, setHariList] = useState<HariPertandingan[]>([]);
  const [hariAntrianList, setHariAntrianList] = useState<HariAntrian[]>([]);
  const [approvedPesertaByKelas, setApprovedPesertaByKelas] = useState<
    Record<number, any[]>
  >({});
  const [baganInfoMap, setBaganInfoMap] = useState<Record<number, BaganInfo>>(
    {}
  );

  const [loadingHari, setLoadingHari] = useState(false);
  const [loadingBagan, setLoadingBagan] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addingLapanganTo, setAddingLapanganTo] = useState<string | null>(null);
  const [savingKelas, setSavingKelas] = useState<Record<number, boolean>>({});
  const [isSavingAntrian, setIsSavingAntrian] = useState(false);

  useEffect(() => {
    if (!idKompetisi) return;
    (async () => {
      try {
        await fetchKelasKejuaraanByKompetisi(idKompetisi);
        await fetchAtletByKompetisi(idKompetisi);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    })();
  }, [idKompetisi]);

  useEffect(() => {
    if (!idKompetisi) return;
    fetchHariLapangan();
  }, [idKompetisi]);

  const fetchHariLapangan = async () => {
    if (!idKompetisi) return;
    setLoadingHari(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || ""
        }/lapangan/kompetisi/${idKompetisi}`
      );
      const data = await res.json();

      if (data.success) {
        const hariData = data.data.hari_pertandingan.map((hari: any) => ({
          tanggal: hari.tanggal,
          jumlah_lapangan: hari.jumlah_lapangan,
          lapangan: hari.lapangan.map((lap: any) => ({
            id_lapangan: lap.id_lapangan,
            id_kompetisi: lap.id_kompetisi,
            nama_lapangan: lap.nama_lapangan,
            tanggal: lap.tanggal,
            kelasDipilih:
              lap.kelas_list?.map((kl: any) => kl.id_kelas_kejuaraan) || [],
          })),
        }));
        setHariList(hariData);
        console.log("✅ Data lapangan berhasil dimuat:", hariData);
      } else {
        throw new Error(data.message || "Gagal memuat data lapangan");
      }
    } catch (err: any) {
      console.error("❌ Error fetching hari lapangan:", err);
      setErrorMessage(err.message || "Gagal memuat data lapangan");
    } finally {
      setLoadingHari(false);
    }
  };

  // Fetch bagan info untuk semua kelas yang dipilih
  useEffect(() => {
    const fetchBaganInfo = async () => {
      if (!idKompetisi || hariList.length === 0 || !token) return;

      const allKelasIds = new Set<number>();
      hariList.forEach((hari) => {
        hari.lapangan.forEach((lap) => {
          lap.kelasDipilih.forEach((kelasId) => allKelasIds.add(kelasId));
        });
      });

      if (allKelasIds.size === 0) return;

      setLoadingBagan(true);
      console.log(
        "🔍 Fetching bagan info untuk kelas:",
        Array.from(allKelasIds)
      );

      const baganMap: Record<number, BaganInfo> = {};

      await Promise.all(
        Array.from(allKelasIds).map(async (kelasId) => {
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_API_URL || "/api"
              }/kompetisi/${idKompetisi}/brackets/${kelasId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              const matches = result.data?.matches || [];

              const kelas = kelasKejuaraanList.find(
                (k) => k.id_kelas_kejuaraan === kelasId
              );
              const namaKelas = kelas
                ? generateNamaKelas(kelas)
                : `Kelas ${kelasId}`;

              baganMap[kelasId] = {
                id_kelas_kejuaraan: kelasId,
                total_matches: matches.length,
                nama_kelas: namaKelas,
              };

              console.log(
                `✅ Bagan kelas ${kelasId}: ${matches.length} matches`
              );
            } else if (response.status === 404) {
              console.log(`ℹ️ Bagan untuk kelas ${kelasId} belum dibuat`);
              const kelas = kelasKejuaraanList.find(
                (k) => k.id_kelas_kejuaraan === kelasId
              );
              const namaKelas = kelas
                ? generateNamaKelas(kelas)
                : `Kelas ${kelasId}`;

              baganMap[kelasId] = {
                id_kelas_kejuaraan: kelasId,
                total_matches: 0,
                nama_kelas: namaKelas,
              };
            }
          } catch (error) {
            console.error(
              `❌ Error fetching bagan untuk kelas ${kelasId}:`,
              error
            );
          }
        })
      );

      setBaganInfoMap(baganMap);
      setLoadingBagan(false);
    };

    fetchBaganInfo();
  }, [hariList, idKompetisi, token, kelasKejuaraanList]);

  // Pisahkan peserta approved
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

  // Sync antrian list
  useEffect(() => {
    setHariAntrianList((prev) => {
      return hariList.map((hari) => {
        const existingHari = prev.find((h) => h.tanggal === hari.tanggal);
        const lapanganAntrian: Record<number, AntrianLapangan> = {};

        hari.lapangan.forEach((lap) => {
          lapanganAntrian[lap.id_lapangan] = existingHari?.lapanganAntrian?.[
            lap.id_lapangan
          ] || {
            bertanding: 0,
            persiapan: 0,
            pemanasan: 0,
          };
        });

        return {
          tanggal: hari.tanggal,
          lapanganAntrian,
        };
      });
    });
  }, [hariList]);

  const addHari = async () => {
    if (!idKompetisi) return;

    setIsAdding(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/lapangan/tambah-hari`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_kompetisi: idKompetisi }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await fetchHariLapangan();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(data.message || "Gagal menambah hari pertandingan");
      }
    } catch (err: any) {
      console.error("Error tambah hari:", err);
      setErrorMessage(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const addLapanganKeHari = async (tanggal: string) => {
    if (!idKompetisi) return;

    setAddingLapanganTo(tanggal);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || ""
        }/lapangan/tambah-lapangan-ke-hari`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_kompetisi: idKompetisi,
            tanggal: tanggal,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await fetchHariLapangan();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(data.message || "Gagal menambah lapangan");
      }
    } catch (err: any) {
      console.error("Error tambah lapangan:", err);
      setErrorMessage(err.message);
    } finally {
      setAddingLapanganTo(null);
    }
  };

  const hapusLapangan = async (id_lapangan: number) => {
    if (!confirm("Yakin ingin menghapus lapangan ini?")) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/lapangan/hapus-lapangan`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_lapangan }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await fetchHariLapangan();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(data.message || "Gagal menghapus lapangan");
      }
    } catch (err: any) {
      console.error("Error hapus lapangan:", err);
      setErrorMessage(err.message);
    }
  };

  const hapusHari = async (tanggal: string) => {
    if (!idKompetisi) return;
    if (
      !confirm(
        `Yakin ingin menghapus semua lapangan pada tanggal ${new Date(
          tanggal
        ).toLocaleDateString("id-ID")}?`
      )
    )
      return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/lapangan/hapus-hari`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_kompetisi: idKompetisi, tanggal }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await fetchHariLapangan();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(data.message || "Gagal menghapus hari pertandingan");
      }
    } catch (err: any) {
      console.error("Error hapus hari:", err);
      setErrorMessage(err.message);
    }
  };

  const toggleKelasAndSave = async (
    tanggal: string,
    lapanganId: number,
    kelasId: number
  ) => {
    // 1️⃣ DAPATKAN DATA LAPANGAN SAAT INI
    const currentHari = hariList.find((h) => h.tanggal === tanggal);
    const currentLapangan = currentHari?.lapangan.find(
      (l) => l.id_lapangan === lapanganId
    );

    if (!currentLapangan) {
      console.error("❌ Lapangan tidak ditemukan!");
      return;
    }

    // 2️⃣ HITUNG KELAS BARU SEBELUM UPDATE UI (Toggle: tambah/hapus)
    const isCurrentlySelected = currentLapangan.kelasDipilih.includes(kelasId);
    const updatedKelasList = isCurrentlySelected
      ? currentLapangan.kelasDipilih.filter((id) => id !== kelasId)
      : [...currentLapangan.kelasDipilih, kelasId];

    console.log("🔄 Toggle kelas", {
      kelasId,
      lapanganId,
      before: currentLapangan.kelasDipilih,
      after: updatedKelasList,
      action: isCurrentlySelected ? "removed" : "added",
    });

    // 3️⃣ UPDATE UI (OPTIMISTIC)
    setHariList((prev) =>
      prev.map((hari) =>
        hari.tanggal === tanggal
          ? {
              ...hari,
              lapangan: hari.lapangan.map((lap) =>
                lap.id_lapangan === lapanganId
                  ? { ...lap, kelasDipilih: updatedKelasList }
                  : lap
              ),
            }
          : hari
      )
    );

    // 4️⃣ SET LOADING
    setSavingKelas((prev) => ({ ...prev, [lapanganId]: true }));

    try {
      console.log("💾 Saving to API:", {
        id_lapangan: lapanganId,
        kelas_kejuaraan_ids: updatedKelasList,
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/lapangan/simpan-kelas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_lapangan: lapanganId,
            kelas_kejuaraan_ids: updatedKelasList,
          }),
        }
      );

      const data = await res.json();
      console.log("📡 API Response:", data);

      if (data.success) {
        console.log("✅ Berhasil disimpan!");
        setSuccessMessage(`Kelas berhasil ditambahkan ke lapangan`);
        setTimeout(() => setSuccessMessage(""), 2000);
      } else {
        throw new Error(data.message || "Gagal menyimpan kelas");
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      setErrorMessage(err.message || "Gagal menyimpan kelas");

      // ROLLBACK UI
      setHariList((prev) =>
        prev.map((hari) =>
          hari.tanggal === tanggal
            ? {
                ...hari,
                lapangan: hari.lapangan.map((lap) =>
                  lap.id_lapangan === lapanganId
                    ? { ...lap, kelasDipilih: currentLapangan.kelasDipilih }
                    : lap
                ),
              }
            : hari
        )
      );

      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSavingKelas((prev) => ({ ...prev, [lapanganId]: false }));
    }
  };

  const updateAntrian = (
    tanggal: string,
    lapanganId: number,
    field: "bertanding" | "persiapan" | "pemanasan",
    value: number
  ) => {
    setHariAntrianList((prev) =>
      prev.map((hari) => {
        if (hari.tanggal !== tanggal) return hari;

        const currentAntrian = hari.lapanganAntrian[lapanganId] || {
          bertanding: 0,
          persiapan: 0,
          pemanasan: 0,
        };

        let updatedAntrian = { ...currentAntrian, [field]: value };

        // Auto-increment jika field adalah "bertanding"
        if (field === "bertanding") {
          updatedAntrian.persiapan = value + 1;
          updatedAntrian.pemanasan = value + 2;
        }

        return {
          ...hari,
          lapanganAntrian: {
            ...hari.lapanganAntrian,
            [lapanganId]: updatedAntrian,
          },
        };
      })
    );
  };

  const saveAllAntrian = async () => {
    setIsSavingAntrian(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const promises = hariAntrianList.flatMap((hari) =>
        Object.entries(hari.lapanganAntrian).map(([lapanganId, antrian]) =>
          fetch(`${import.meta.env.VITE_API_URL || ""}/lapangan/antrian`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_lapangan: parseInt(lapanganId),
              ...antrian,
            }),
          })
        )
      );

      const results = await Promise.all(promises);

      for (const res of results) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Gagal menyimpan salah satu antrian");
        }
      }

      setSuccessMessage("Semua antrian berhasil disimpan!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error simpan semua antrian:", err);
      setErrorMessage(err.message);
    } finally {
      setIsSavingAntrian(false);
    }
  };

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

  const handleLihatBagan = (kelasId: number) => {
    console.log(`🔗 Navigating to drawing bagan for kelas ${kelasId}`);
    navigate("/admin-kompetisi/drawing-bagan");
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

        {/* MESSAGES */}
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
                      Tambah Hari Pertandingan (1 Lapangan)
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => addLapanganKeHari(hari.tanggal)}
                          disabled={addingLapanganTo === hari.tanggal}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: "rgba(153, 13, 53, 0.1)",
                            color: "#990D35",
                          }}
                        >
                          {addingLapanganTo === hari.tanggal ? (
                            <>
                              <Loader size={14} className="animate-spin" />
                              Menambah...
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              Tambah Lapangan
                            </>
                          )}
                        </button>
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
                    </div>

                    {/* LAPANGAN - GRID 3 KOLOM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hari.lapangan.map((lap) => (
                        <div
                          key={lap.id_lapangan}
                          className="rounded-xl border p-4 space-y-4 relative"
                          style={{
                            borderColor: "#990D35",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          {/* Loading Overlay */}
                          {savingKelas[lap.id_lapangan] && (
                            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-xl z-10">
                              <div className="flex flex-col items-center gap-2">
                                <Loader
                                  className="animate-spin"
                                  size={24}
                                  style={{ color: "#990D35" }}
                                />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: "#990D35" }}
                                >
                                  Menyimpan...
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <h3
                              className="font-semibold"
                              style={{ color: "#050505" }}
                            >
                              Lapangan {lap.nama_lapangan}
                            </h3>
                            <button
                              onClick={() => hapusLapangan(lap.id_lapangan)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Hapus Lapangan"
                            >
                              <Trash2 size={16} />
                            </button>
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
                                            name={`kelas-lapangan-${lap.id_lapangan}-${kelas.id_kelas_kejuaraan}`}
                                            checked={lap.kelasDipilih.includes(
                                              kelas.id_kelas_kejuaraan
                                            )}
                                            onChange={() =>
                                              toggleKelasAndSave(
                                                hari.tanggal,
                                                lap.id_lapangan,
                                                kelas.id_kelas_kejuaraan
                                              )
                                            }
                                            disabled={
                                              savingKelas[lap.id_lapangan]
                                            }
                                            className="accent-[#990D35] cursor-pointer disabled:opacity-50"
                                          />
                                          <span className="text-xs font-medium text-[#050505]">
                                            {namaKelasDisplay}
                                          </span>
                                        </div>
                                        <span
                                          className="text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap"
                                          style={{
                                            backgroundColor:
                                              "rgba(153,13,53,0.1)",
                                            color: "#990D35",
                                          }}
                                        >
                                          {approvedPeserta.length}
                                        </span>
                                      </div>

                                      {/* DAFTAR PESERTA */}
                                      {approvedPeserta.length > 0 &&
                                        lap.kelasDipilih.includes(
                                          kelas.id_kelas_kejuaraan
                                        ) && (
                                          <ul className="mt-2 ml-6 list-disc text-xs text-[#050505] space-y-1">
                                            {approvedPeserta
                                              .slice(0, 3)
                                              .map((p) => (
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
                                            {approvedPeserta.length > 3 && (
                                              <li className="text-[#990D35] font-medium">
                                                +{approvedPeserta.length - 3}{" "}
                                                lainnya
                                              </li>
                                            )}
                                          </ul>
                                        )}
                                    </label>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8">
                                  <p
                                    className="text-xs font-medium mb-1"
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
                                Kelas: {lap.kelasDipilih.length}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "#050505", opacity: 0.7 }}
                              >
                                Peserta:{" "}
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
              <div className="mb-6">
                <button
                  onClick={saveAllAntrian}
                  disabled={isSavingAntrian}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#16a34a", color: "#F5FBEF" }}
                >
                  {isSavingAntrian ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan Semua Antrian
                    </>
                  )}
                </button>
              </div>
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

                      {/* LAPANGAN - GRID 3 KOLOM */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <div className="space-y-3">
                              {/* Bertanding */}
                              <div>
                                <label
                                  className="block text-xs font-medium mb-1"
                                  style={{ color: "#16a34a" }}
                                >
                                  🟢 Bertanding - Nomor Pertandingan
                                </label>
                                <input
                                  type="number"
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.bertanding || ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                      updateAntrian(
                                        hari.tanggal,
                                        lap.id_lapangan,
                                        "bertanding",
                                        val === "" ? 0 : parseInt(val)
                                      );
                                    }
                                  }}
                                  placeholder="Nomor pertandingan"
                                  className="w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#16a34a",
                                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                                  }}
                                />
                              </div>

                              {/* Persiapan */}
                              <div>
                                <label
                                  className="block text-xs font-medium mb-1"
                                  style={{ color: "#ea580c" }}
                                >
                                  🟠 Persiapan - Nomor Pertandingan
                                </label>
                                <input
                                  type="number"
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.persiapan || ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                      updateAntrian(
                                        hari.tanggal,
                                        lap.id_lapangan,
                                        "persiapan",
                                        val === "" ? 0 : parseInt(val)
                                      );
                                    }
                                  }}
                                  placeholder="Nomor pertandingan"
                                  className="w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#ea580c",
                                    backgroundColor: "rgba(234, 88, 12, 0.1)",
                                  }}
                                />
                              </div>

                              {/* Pemanasan */}
                              <div>
                                <label
                                  className="block text-xs font-medium mb-1"
                                  style={{ color: "#ca8a04" }}
                                >
                                  🟡 Pemanasan - Nomor Pertandingan
                                </label>
                                <input
                                  type="number"
                                  value={
                                    hari.lapanganAntrian[lap.id_lapangan]
                                      ?.pemanasan || ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                      updateAntrian(
                                        hari.tanggal,
                                        lap.id_lapangan,
                                        "pemanasan",
                                        val === "" ? 0 : parseInt(val)
                                      );
                                    }
                                  }}
                                  placeholder="Nomor pertandingan"
                                  className="w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "#ca8a04",
                                    backgroundColor: "rgba(202, 138, 4, 0.1)",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Info Kelas & Bagan */}
                            {lap.kelasDipilih.length > 0 && (
                              <div className="mt-4 space-y-3">
                                <div
                                  className="p-3 rounded-lg"
                                  style={{
                                    backgroundColor: "rgba(153,13,53,0.05)",
                                  }}
                                >
                                  <p
                                    className="text-xs font-medium mb-1"
                                    style={{ color: "#990D35" }}
                                  >
                                    Kelas: {lap.kelasDipilih.length}
                                  </p>
                                  <p
                                    className="text-xs"
                                    style={{ color: "#050505", opacity: 0.7 }}
                                  >
                                    Peserta:{" "}
                                    {lap.kelasDipilih.reduce(
                                      (total, kelasId) =>
                                        total +
                                        (approvedPesertaByKelas[kelasId]
                                          ?.length || 0),
                                      0
                                    )}
                                  </p>
                                </div>

                                {/* Bagan Info per Kelas */}
                                {loadingBagan ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader
                                      size={16}
                                      className="animate-spin"
                                      style={{ color: "#990D35" }}
                                    />
                                    <span
                                      className="text-xs ml-2"
                                      style={{ color: "#990D35" }}
                                    >
                                      Memuat info bagan...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {lap.kelasDipilih.map((kelasId) => {
                                      const baganInfo = baganInfoMap[kelasId];
                                      if (!baganInfo) return null;

                                      return (
                                        <div
                                          key={kelasId}
                                          className="p-3 rounded-lg border"
                                          style={{
                                            backgroundColor: "#F5FBEF",
                                            borderColor: "rgba(153,13,53,0.2)",
                                          }}
                                        >
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <p
                                              className="text-xs font-medium flex-1"
                                              style={{ color: "#050505" }}
                                            >
                                              {baganInfo.nama_kelas}
                                            </p>
                                            {baganInfo.total_matches > 0 ? (
                                              <span
                                                className="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                                                style={{
                                                  backgroundColor:
                                                    "rgba(34, 197, 94, 0.2)",
                                                  color: "#22c55e",
                                                }}
                                              >
                                                ✓ Siap
                                              </span>
                                            ) : (
                                              <span
                                                className="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                                                style={{
                                                  backgroundColor:
                                                    "rgba(245, 183, 0, 0.2)",
                                                  color: "#F5B700",
                                                }}
                                              >
                                                Belum dibuat
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <GitBranch
                                                size={14}
                                                style={{ color: "#990D35" }}
                                              />
                                              <span
                                                className="text-xs font-medium"
                                                style={{ color: "#990D35" }}
                                              >
                                                {baganInfo.total_matches > 0
                                                  ? `${baganInfo.total_matches} Match`
                                                  : "0 Match"}
                                              </span>
                                            </div>

                                            <button
                                              onClick={() =>
                                                handleLihatBagan(kelasId)
                                              }
                                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                              style={{
                                                backgroundColor: "#990D35",
                                                color: "white",
                                              }}
                                            >
                                              <Eye size={12} />
                                              Lihat
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
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
