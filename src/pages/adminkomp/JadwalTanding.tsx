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
  Download,
  Check,
  Zap,
  X
} from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import { exportMultipleBracketsByLapangan } from "../../utils/exportBracketPDF";
import taekwondo from "../../assets/logo/taekwondo.png";
import sriwijaya from "../../assets/logo/sriwijaya.png";

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
  const [sortedKelasKejuaraanList, setSortedKelasKejuaraanList] = useState<
    any[]
  >([]);

  const [loadingHari, setLoadingHari] = useState(false);
  const [loadingBagan, setLoadingBagan] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAutoNumberModal, setShowAutoNumberModal] = useState(false);
  const [selectedAutoGenHari, setSelectedAutoGenHari] = useState<string>('');
  const [selectedAutoGenLapangan, setSelectedAutoGenLapangan] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [generatingNumbers, setGeneratingNumbers] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [addingLapanganTo, setAddingLapanganTo] = useState<string | null>(null);
  const [savingKelas, setSavingKelas] = useState<Record<number, boolean>>({});
  const [isSavingAntrian, setIsSavingAntrian] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportHari, setSelectedExportHari] = useState<string>("");
  const [selectedExportLapangan, setSelectedExportLapangan] = useState<number[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [lapanganSearchTerms, setLapanganSearchTerms] = useState<Record<number, string>>({});

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

  // 🆕 Auto-load preview saat lapangan dipilih
useEffect(() => {
  if (selectedAutoGenLapangan) {
    console.log(`📊 Lapangan selected: ${selectedAutoGenLapangan}, fetching preview...`);
    fetchPreviewNumbers(selectedAutoGenLapangan);
  } else {
    setPreviewData(null);
  }
}, [selectedAutoGenLapangan]);

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

  useEffect(() => {
    if (kelasKejuaraanList.length > 0) {
      const sortedList = [...kelasKejuaraanList].sort((a, b) => {
        const countA =
          (approvedPesertaByKelas[a.id_kelas_kejuaraan] || []).length;
        const countB =
          (approvedPesertaByKelas[b.id_kelas_kejuaraan] || []).length;
        return countB - countA;
      });
      setSortedKelasKejuaraanList(sortedList);
    } else {
      setSortedKelasKejuaraanList([]);
    }
  }, [kelasKejuaraanList, approvedPesertaByKelas]);

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

  // 🆕 ============================================================================
// AUTO-GENERATE NOMOR PARTAI FUNCTIONS
// 🆕 ============================================================================

/**
 * Fetch preview nomor partai tanpa save
 */
const fetchPreviewNumbers = async (id_lapangan: number) => {
  setLoadingPreview(true);
  setErrorMessage('');
  
  try {
    console.log(`🔮 Fetching preview for lapangan ${id_lapangan}...`);
    
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/lapangan/${id_lapangan}/preview-numbers?starting_number=1`
    );
    
    const data = await res.json();
    
    if (data.success) {
      setPreviewData(data);
      console.log('✅ Preview loaded:', data);
    } else {
      throw new Error(data.message || 'Gagal memuat preview');
    }
  } catch (err: any) {
    console.error('❌ Error fetching preview:', err);
    setErrorMessage(err.message || 'Gagal memuat preview nomor partai');
    setTimeout(() => setErrorMessage(''), 5000);
  } finally {
    setLoadingPreview(false);
  }
};

/**
 * Auto-generate dan save nomor partai
 */
const handleAutoGenerateNumbers = async () => {
  if (!selectedAutoGenLapangan) return;
  
  setGeneratingNumbers(true);
  setErrorMessage('');
  setSuccessMessage('');
  
  try {
    console.log(`🎯 Generating numbers for lapangan ${selectedAutoGenLapangan}...`);
    
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/lapangan/${selectedAutoGenLapangan}/auto-generate-numbers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting_number: 1 })
      }
    );
    
    const data = await res.json();
    
    if (data.success) {
      setSuccessMessage(`✅ ${data.message} - Range: ${data.range}`);
      
      // Close modal
      setShowAutoNumberModal(false);
      setSelectedAutoGenHari('');
      setSelectedAutoGenLapangan(null);
      setPreviewData(null);
      
      // Refresh data
      await fetchHariLapangan();
      
      console.log('✅ Numbers generated successfully');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      throw new Error(data.message || 'Gagal generate nomor partai');
    }
  } catch (err: any) {
    console.error('❌ Error auto-generate:', err);
    setErrorMessage(err.message || 'Gagal generate nomor partai');
    setTimeout(() => setErrorMessage(''), 5000);
  } finally {
    setGeneratingNumbers(false);
  }
};

/**
 * Reset nomor partai di lapangan
 */
const handleResetNumbers = async (id_lapangan: number, namaLapangan: string) => {
  if (!confirm(`Yakin ingin reset semua nomor partai di Lapangan ${namaLapangan}?\n\nNomor partai akan dihapus dan harus di-generate ulang.`)) {
    return;
  }
  
  setErrorMessage('');
  setSuccessMessage('');
  
  try {
    console.log(`🗑️ Resetting numbers for lapangan ${id_lapangan}...`);
    
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/lapangan/${id_lapangan}/reset-numbers`,
      { method: 'DELETE' }
    );
    
    const data = await res.json();
    
    if (data.success) {
      setSuccessMessage(data.message);
      await fetchHariLapangan();
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log('✅ Numbers reset successfully');
    } else {
      throw new Error(data.message || 'Gagal reset nomor partai');
    }
  } catch (err: any) {
    console.error('❌ Error reset:', err);
    setErrorMessage(err.message || 'Gagal reset nomor partai');
    setTimeout(() => setErrorMessage(''), 3000);
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
  navigate(`/admin-kompetisi/drawing-bagan/${kelasId}`);
  };

const handleExportLapangan = async () => {
  if (!idKompetisi || selectedExportLapangan.length === 0) return;

  setExportingPDF(true);
  setErrorMessage('');
  setSuccessMessage('');

  try {
    const selectedHari = hariList.find(h => h.tanggal === selectedExportHari);
    if (!selectedHari) throw new Error('Hari tidak ditemukan');

    const bracketsToExport = [];
    const failedKelas: string[] = [];

    for (const lapanganId of selectedExportLapangan) {
      const lapangan = selectedHari.lapangan.find(l => l.id_lapangan === lapanganId);
      if (!lapangan) continue;

      console.log(`\n📍 ========================================`);
      console.log(`   Processing Lapangan ${lapangan.nama_lapangan}`);
      console.log(`   Total kelas assigned: ${lapangan.kelasDipilih.length}`);
      console.log(`========================================`);

// ⭐ STEP 1: MAP kelas dengan data lengkap (kategori + jumlah peserta)
const kelasList = lapangan.kelasDipilih
  .map(kelasId => {
    const kelas = kelasKejuaraanList.find(k => k.id_kelas_kejuaraan === kelasId);
    if (!kelas) {
      console.warn(`   ⚠️ Kelas ${kelasId} tidak ditemukan di kelasKejuaraanList`);
      return null;
    }
    
    const isPemula = kelas.kategori_event.nama_kategori.toLowerCase().includes('pemula');
    const jumlahPeserta = pesertaList.filter(
      p => p.status === 'APPROVED' && p.kelas_kejuaraan?.id_kelas_kejuaraan === kelasId
    ).length;
    
    return {
      kelasId,
      kelasData: kelas,
      isPemula,
      jumlahPeserta,
      namaKelas: generateNamaKelas(kelas)
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null); // ✅ Type guard

// ⭐ STEP 2: SORT sesuai logic auto-generate
// Priority: PEMULA first, then by jumlah peserta (DESC)
const sortedKelas = kelasList.sort((a, b) => {
  // PEMULA always comes first
  if (a.isPemula && !b.isPemula) return -1;
  if (!a.isPemula && b.isPemula) return 1;
  
  // Within same category, sort by jumlah peserta (DESC - terbanyak dulu)
  return b.jumlahPeserta - a.jumlahPeserta;
});

      // ⭐ STEP 3: LOG urutan export (untuk debugging)
      console.log(`\n   📋 URUTAN EXPORT (sesuai auto-generate):`);
      sortedKelas.forEach((kelas, idx) => {
        const category = kelas.isPemula ? '🥋 PEMULA' : '🏆 PRESTASI';
        console.log(`      ${idx + 1}. ${category} - ${kelas.namaKelas} (${kelas.jumlahPeserta} peserta)`);
      });
      console.log(''); // Empty line for readability

      // ⭐ STEP 4: LOOP dengan urutan yang sudah di-sort
      for (const kelas of sortedKelas) {
        const kelasId = kelas.kelasId;
        const kelasData = kelas.kelasData;

        try {
          console.log(`   🔄 Fetching bracket for: ${kelas.namaKelas}...`);
          
          // ✅ Fetch bracket data
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/kompetisi/${idKompetisi}/brackets/${kelasId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          // ❌ Handle 404 (bracket belum dibuat)
          if (response.status === 404) {
            failedKelas.push(`${kelas.namaKelas} (Lapangan ${lapangan.nama_lapangan})`);
            console.warn(`      ⚠️ Bracket belum dibuat`);
            continue;
          }

          if (!response.ok) {
            throw new Error(`Failed to fetch bracket for kelas ${kelasId}`);
          }

          const result = await response.json();
          
          // ❌ Validate bracket data
          if (!result.data || !result.data.matches || result.data.matches.length === 0) {
            failedKelas.push(`${kelas.namaKelas} (Lapangan ${lapangan.nama_lapangan})`);
            console.warn(`      ⚠️ Bracket kosong`);
            continue;
          }

          console.log(`      ✅ Bracket loaded: ${result.data.matches.length} matches`);

          // ✅ Transform peserta data
          const pesertaKelas = pesertaList.filter(
            p => p.status === 'APPROVED' && 
            p.kelas_kejuaraan?.id_kelas_kejuaraan === kelasId
          );

          // ✅ Siapkan data lengkap untuk export
          bracketsToExport.push({
            kelasData: {
              id_kelas_kejuaraan: kelasId,
              cabang: kelasData.cabang,
              kategori_event: kelasData.kategori_event,
              kelompok: kelasData.kelompok,
              kelas_berat: kelasData.kelas_berat,
              poomsae: kelasData.poomsae,
              kompetisi: {
                id_kompetisi: idKompetisi,
                nama_event: "Sriwijaya International Taekwondo Championship 2025",
                tanggal_mulai: selectedExportHari,
                tanggal_selesai: selectedExportHari,
                lokasi: "GOR Ranau JSC Palembang",
                status: "SEDANG_DIMULAI" as const,
              },
              peserta_kompetisi: pesertaKelas.map(p => ({
                id_peserta_kompetisi: p.id_peserta_kompetisi,
                id_atlet: p.atlet?.id_atlet,
                is_team: p.is_team,
                status: p.status,
                atlet: p.atlet ? {
                  id_atlet: p.atlet.id_atlet,
                  nama_atlet: p.atlet.nama_atlet,
                  dojang: {
                    nama_dojang: p.atlet.dojang?.nama_dojang || "",
                  },
                } : undefined,
                anggota_tim: p.anggota_tim?.map(at => ({
                  atlet: {
                    nama_atlet: at.atlet.nama_atlet,
                  },
                })),
              })),
              bagan: [{
                id_bagan: result.data.id_bagan || 1,
                match: result.data.matches || [],
                drawing_seed: result.data.drawing_seed || []
              }],
            },
            bracketData: result.data,
            lapanganNama: lapangan.nama_lapangan,
            tanggal: selectedExportHari,
            isPemula: kelas.isPemula,
            namaKelas: kelas.namaKelas
          });

          console.log(`      ✅ Added to export queue`);

        } catch (kelasError: any) {
          console.error(`      ❌ Error fetching bracket:`, kelasError);
          failedKelas.push(`${kelas.namaKelas} (Lapangan ${lapangan.nama_lapangan})`);
        }
      }
    }

    console.log(`\n📦 ========================================`);
    console.log(`   EXPORT SUMMARY`);
    console.log(`   Total brackets to export: ${bracketsToExport.length}`);
    console.log(`   Failed/skipped: ${failedKelas.length}`);
    console.log(`========================================\n`);

    // ✅ Validasi final
    if (bracketsToExport.length === 0) {
      if (failedKelas.length > 0) {
        throw new Error(
          `Tidak ada bracket yang siap untuk di-export.\n\n` +
          `Kelas yang belum dibuat bracket:\n${failedKelas.slice(0, 5).join('\n')}` +
          (failedKelas.length > 5 ? `\n... dan ${failedKelas.length - 5} lainnya` : '')
        );
      } else {
        throw new Error('Tidak ada bracket yang siap untuk di-export');
      }
    }

    // ✅ Export PDF dengan urutan yang sudah sorted
    console.log(`📄 Generating PDF...`);
    await exportMultipleBracketsByLapangan(bracketsToExport, {
      namaKejuaraan: 'Sriwijaya International Taekwondo Championship 2025',
      logoPBTI: taekwondo,
      logoEvent: sriwijaya,
    });

    // ✅ Success message
    let message = `✅ Berhasil export ${bracketsToExport.length} bracket!`;
    if (failedKelas.length > 0) {
      message += `\n\n⚠️ ${failedKelas.length} kelas di-skip karena bracket belum dibuat:\n${failedKelas.slice(0, 3).join('\n')}`;
      if (failedKelas.length > 3) {
        message += `\n... dan ${failedKelas.length - 3} lainnya`;
      }
    }

    setSuccessMessage(message);
    setShowExportModal(false);
    setSelectedExportHari('');
    setSelectedExportLapangan([]);
    
    console.log(`✅ Export complete!`);
    setTimeout(() => setSuccessMessage(''), 5000);

  } catch (err: any) {
    console.error('❌ Error exporting brackets:', err);
    setErrorMessage(err.message || 'Gagal export brackets');
  } finally {
    setExportingPDF(false);
  }
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
                            <input
                              type="text"
                              placeholder="Cari kelas kejuaraan..."
                              className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#990D35] mb-2"
                              style={{ borderColor: "#990D35", backgroundColor: "#F5FBEF" }}
                              value={lapanganSearchTerms[lap.id_lapangan] || ''}
                              onChange={(e) => setLapanganSearchTerms(prev => ({
                                ...prev,
                                [lap.id_lapangan]: e.target.value
                              }))}
                            />

                            <div
                              className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg"
                              style={{ backgroundColor: "#F5FBEF" }}
                            >
                              {(() => {
                                const currentSearchTerm = lapanganSearchTerms[lap.id_lapangan]?.toLowerCase() || '';
                                const filteredKelasKejuaraan = sortedKelasKejuaraanList.filter(kelas => {
                                  const namaKelasDisplay = generateNamaKelas(kelas);
                                  return namaKelasDisplay.toLowerCase().includes(currentSearchTerm);
                                });

                                return (
                                  <>
                                    {filteredKelasKejuaraan &&
                                    filteredKelasKejuaraan.length > 0 ? (
                                      filteredKelasKejuaraan.map((kelas) => {
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
                                  </>
                                );
                              })()}
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
                 {/* 🆕 BUTTON EXPORT PER LAPANGAN */}
                <button
                  onClick={() => setShowExportModal(true)}
                  disabled={hariList.length === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium"
                  style={{ backgroundColor: "#990D35", color: "#F5FBEF" }}
                >
                  <Download size={16} />
                  Export Bracket per Lapangan
                </button>
              </div>
                    {/* 🆕 BUTTON AUTO-GENERATE */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowAutoNumberModal(true)}
          disabled={hariList.length === 0}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
        >
          <Zap size={16} />
          Auto-Generate Nomor Partai
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
      {/* 🆕 MODAL EXPORT PER LAPANGAN */}
{showExportModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div className="p-6 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#990D35' }}>
        <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
          Export Bracket per Lapangan
        </h3>
        <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
          Pilih hari dan lapangan yang ingin di-export ke PDF
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Pilih Hari */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
            Pilih Hari Pertandingan
          </label>
          <select
            value={selectedExportHari}
            onChange={(e) => {
              setSelectedExportHari(e.target.value);
              setSelectedExportLapangan([]);
            }}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ borderColor: '#990D35' }}
          >
            <option value="">-- Pilih Hari --</option>
            {hariList.map((hari, idx) => (
              <option key={hari.tanggal} value={hari.tanggal}>
                Hari ke-{idx + 1} - {new Date(hari.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Lapangan */}
        {selectedExportHari && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
              Pilih Lapangan (bisa pilih lebih dari 1)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3" style={{ backgroundColor: '#F5FBEF' }}>
              {hariList
                .find(h => h.tanggal === selectedExportHari)
                ?.lapangan.map((lap) => {
                  const isSelected = selectedExportLapangan.includes(lap.id_lapangan);
                  const kelasCount = lap.kelasDipilih.length;
                  
                  return (
                    <label
                      key={lap.id_lapangan}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected ? 'bg-white' : 'hover:bg-white'
                      }`}
                      style={{
                        borderColor: isSelected ? '#990D35' : 'rgba(153,13,53,0.3)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExportLapangan([...selectedExportLapangan, lap.id_lapangan]);
                            } else {
                              setSelectedExportLapangan(
                                selectedExportLapangan.filter(id => id !== lap.id_lapangan)
                              );
                            }
                          }}
                          className="w-5 h-5 accent-[#990D35]"
                        />
                        <div>
                          <p className="font-bold" style={{ color: '#050505' }}>
                            Lapangan {lap.nama_lapangan}
                          </p>
                          <p className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                            {kelasCount} Kelas Kejuaraan
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check size={20} style={{ color: '#990D35' }} />}
                    </label>
                  );
                })}
            </div>
          </div>
        )}

        {/* Info terpilih */}
        {selectedExportLapangan.length > 0 && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(153,13,53,0.1)' }}>
            <p className="text-sm font-medium" style={{ color: '#990D35' }}>
              {selectedExportLapangan.length} lapangan terpilih
            </p>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white z-10">
        <button
          onClick={() => {
            setShowExportModal(false);
            setSelectedExportHari('');
            setSelectedExportLapangan([]);
          }}
          className="flex-1 py-3 px-4 rounded-lg border-2 font-medium"
          style={{ borderColor: '#990D35', color: '#990D35' }}
        >
          Batal
        </button>
        <button
          onClick={handleExportLapangan}
          disabled={selectedExportLapangan.length === 0 || exportingPDF}
          className="flex-1 py-3 px-4 rounded-lg font-medium disabled:opacity-50"
          style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
        >
          {exportingPDF ? (
            <>
              <Loader size={16} className="animate-spin inline mr-2" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={16} className="inline mr-2" />
              Export PDF
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
{/* ============================================================================ */}
{/* MODAL AUTO-GENERATE NOMOR PARTAI */}
{/* ============================================================================ */}
{showAutoNumberModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <div className="p-6 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#990D35' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
              🎯 Auto-Generate Nomor Partai
            </h3>
            <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
              Sistem akan generate nomor partai otomatis berdasarkan jumlah peserta
            </p>
          </div>
          <button
            onClick={() => {
              setShowAutoNumberModal(false);
              setSelectedAutoGenHari('');
              setSelectedAutoGenLapangan(null);
              setPreviewData(null);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: '#990D35' }} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">

        {/* STEP 1: PILIH HARI */}
        <div>
          <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#050505' }}>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Pilih Hari Pertandingan
          </label>

          <select
            value={selectedAutoGenHari}
            onChange={(e) => {
              setSelectedAutoGenHari(e.target.value);
              setSelectedAutoGenLapangan(null);
              setPreviewData(null);
            }}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: '#990D35' }}
          >
            <option value="">-- Pilih Hari --</option>
            {hariList.map((hari, idx) => (
              <option key={hari.tanggal} value={hari.tanggal}>
                Hari ke-{idx + 1} - {new Date(hari.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        {/* STEP 2: PILIH LAPANGAN */}
        {selectedAutoGenHari && (
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#050505' }}>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Pilih Lapangan
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {hariList
                .find(h => h.tanggal === selectedAutoGenHari)
                ?.lapangan.filter(lap => lap.kelasDipilih.length > 0)
                .map((lap) => {
                  const isSelected = selectedAutoGenLapangan === lap.id_lapangan;
                  const kelasCount = lap.kelasDipilih.length;
                  const pesertaCount = lap.kelasDipilih.reduce(
                    (total, kelasId) => total + (approvedPesertaByKelas[kelasId]?.length || 0),
                    0
                  );

                  return (
                    <button
                      key={lap.id_lapangan}
                      onClick={() => setSelectedAutoGenLapangan(lap.id_lapangan)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected ? 'shadow-lg scale-105' : 'hover:border-opacity-60 hover:scale-102'
                      }`}
                      style={{
                        borderColor: isSelected ? '#990D35' : 'rgba(153,13,53,0.3)',
                        backgroundColor: isSelected ? 'rgba(153,13,53,0.05)' : 'white'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg" style={{ color: '#990D35' }}>
                          Lapangan {lap.nama_lapangan}
                        </span>
                        {isSelected && <Check size={20} style={{ color: '#990D35' }} />}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs" style={{ color: '#050505', opacity: 0.7 }}>
                          📚 {kelasCount} Kelas
                        </p>
                        <p className="text-xs" style={{ color: '#050505', opacity: 0.7 }}>
                          👥 {pesertaCount} Peserta
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>

            {hariList.find(h => h.tanggal === selectedAutoGenHari)?.lapangan.filter(lap => lap.kelasDipilih.length > 0).length === 0 && (
              <div className="mt-3 p-4 rounded-lg border-2" style={{ borderColor: '#F5B700', backgroundColor: 'rgba(245, 183, 0, 0.1)' }}>
                <p className="text-sm font-medium" style={{ color: '#F5B700' }}>
                  ⚠️ Tidak ada lapangan dengan kelas yang sudah di-assign
                </p>
                <p className="text-xs mt-1" style={{ color: '#050505', opacity: 0.7 }}>
                  Silakan assign kelas ke lapangan terlebih dahulu di tab "Setup Jadwal"
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {loadingPreview && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin mb-3" size={48} style={{ color: '#990D35' }} />
            <span className="text-sm font-medium" style={{ color: '#990D35' }}>
              Memuat preview nomor partai...
            </span>
          </div>
        )}

        {previewData && !loadingPreview && (
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#050505' }}>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Preview Penomoran
            </label>

            <div className="border-2 rounded-lg p-4 space-y-4" style={{ borderColor: '#990D35', backgroundColor: 'rgba(153,13,53,0.02)' }}>

{/* Summary Cards */}
<div className="grid grid-cols-4 gap-3">
  <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'white', borderLeft: '4px solid #990D35' }}>
    <p className="text-xs mb-1" style={{ color: '#050505', opacity: 0.6 }}>Total Matches</p>
    <p className="text-3xl font-bold" style={{ color: '#990D35' }}>
      {previewData.total_matches}
    </p>
  </div>

  {/* ⭐ NEW CARD: BYE Skipped */}
  <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'white', borderLeft: '4px solid #F5B700' }}>
    <p className="text-xs mb-1" style={{ color: '#050505', opacity: 0.6 }}>BYE Skipped</p>
    <p className="text-3xl font-bold" style={{ color: '#F5B700' }}>
      {previewData.total_bye_skipped || 0}
    </p>
  </div>

  <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'white', borderLeft: '4px solid #6366F1' }}>
    <p className="text-xs mb-1" style={{ color: '#050505', opacity: 0.6 }}>Range Nomor</p>
    <p className="text-xl font-bold" style={{ color: '#6366F1' }}>
      {previewData.range}
    </p>
  </div>

  <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'white', borderLeft: '4px solid #16a34a' }}>
    <p className="text-xs mb-1" style={{ color: '#050505', opacity: 0.6 }}>Total Kelas</p>
    <p className="text-3xl font-bold" style={{ color: '#16a34a' }}>
      {(previewData.summary.pemula?.length || 0) + (previewData.summary.prestasi?.length || 0)}
    </p>
  </div>
</div>

              {/* PEMULA */}
              {previewData.summary.pemula?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(22,163,74,0.2)', color: '#16a34a' }}>
                      🥋 PEMULA
                    </div>
                    <span className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                      {previewData.summary.pemula.length} kelas (habis per kelas)
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previewData.summary.pemula.map((kelas: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white shadow-sm border flex justify-between items-center" style={{ borderColor: 'rgba(22,163,74,0.2)' }}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: '#050505' }}>{kelas.kelas}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#050505', opacity: 0.6 }}>
                            👥 {kelas.peserta} peserta • 🥊 {kelas.matches} matches
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
                            {kelas.range}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRESTASI */}
              {previewData.summary.prestasi?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(153,13,53,0.2)', color: '#990D35' }}>
                      🏆 PRESTASI
                    </div>
                    <span className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                      {previewData.summary.prestasi.length} kelas (habis per round)
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previewData.summary.prestasi.map((kelas: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white shadow-sm border flex justify-between items-center" style={{ borderColor: 'rgba(153,13,53,0.2)' }}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: '#050505' }}>{kelas.kelas}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#050505', opacity: 0.6 }}>
                            👥 {kelas.peserta} peserta • 🥊 {kelas.matches} matches
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(153,13,53,0.1)', color: '#990D35' }}>
                            {kelas.range}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INFO */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                <p className="text-xs font-medium" style={{ color: '#6366F1' }}>
                  ℹ️ <strong>Catatan:</strong> Nomor akan di-generate otomatis berdasarkan urutan:
                </p>
                <ul className="text-xs mt-2 space-y-1 ml-4" style={{ color: '#050505', opacity: 0.7 }}>
                  <li>• PEMULA: Dihabiskan per kelas (jumlah peserta terbanyak dulu)</li>
                  <li>• PRESTASI: Dihabiskan per round (R1 → Quarter → Semi → Final)</li>
                </ul>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white z-10">

        <button
          onClick={() => {
            setShowAutoNumberModal(false);
            setSelectedAutoGenHari('');
            setSelectedAutoGenLapangan(null);
            setPreviewData(null);
          }}
          className="flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-50"
          style={{ borderColor: '#990D35', color: '#990D35' }}
        >
          Batal
        </button>

        <button
          onClick={handleAutoGenerateNumbers}
          disabled={!previewData || generatingNumbers}
          className="flex-1 py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
        >
          {generatingNumbers ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={16} className="animate-spin" />
              Generating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap size={16} />
              Generate Nomor Partai
            </span>
          )}
        </button>

      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default JadwalPertandingan;
