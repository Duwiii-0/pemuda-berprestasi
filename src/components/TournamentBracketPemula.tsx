import React, { useState, useEffect } from 'react';
import { Trophy, Edit3, CheckCircle, ArrowLeft, AlertTriangle, RefreshCw, Download, Shuffle } from 'lucide-react';
import { exportBracketFromData } from '../utils/exportBracketPDF';
import { useAuth } from '../context/authContext';
import sriwijaya from "../assets/logo/sriwijaya.png";
import taekwondo from "../assets/logo/taekwondo.png";
import * as XLSX from 'xlsx';

interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  jenis_kelamin?: 'LAKI_LAKI' | 'PEREMPUAN';
  tanggal_lahir?: string;
  berat_badan?: number;
  tinggi_badan?: number;
  belt?: string;
  sabuk?: {
    nama_sabuk: string;
  };
  dojang: {
    nama_dojang: string;
    id_dojang?: number;
  };
}

interface AnggotaTim {
  atlet: Atlet;
}

interface Peserta {
  id_peserta_kompetisi: number;
  id_atlet?: number;
  is_team: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  atlet?: Atlet;
  anggota_tim?: AnggotaTim[];
}

interface Match {
  id_match: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  skor_a: number;
  skor_b: number;
  peserta_a?: Peserta;
  peserta_b?: Peserta;
  venue?: {
    nama_venue: string;
  };
  tanggal_pertandingan?: string;
  nomor_partai?: string;
  nomor_antrian?: number;
  nomor_lapangan?: string;
}

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: 'KYORUGI' | 'POOMSAE';
  kategori_event: {
    nama_kategori: string;
  };
  kelompok?: {
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    nama_kelas: string;
    batas_min: number;
    batas_max: number;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  };
  poomsae?: {
    nama_kelas: string;
  };
  kompetisi: {
    id_kompetisi: number;
    nama_event: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    lokasi: string;
    status: 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI';
  };
  peserta_kompetisi: Peserta[];
  bagan: {
    id_bagan: number;
    match: Match[];
    drawing_seed: {
      peserta_kompetisi: Peserta;
      seed_num: number;
    }[];
  }[];
}

interface TournamentBracketPemulaProps {
  kelasData: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
}

const TournamentBracketPemula: React.FC<TournamentBracketPemulaProps> = ({ 
  kelasData, 
  onBack,
  apiBaseUrl = '/api',
}) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false); // ✅ NEW
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null); // ✅ NEW
  const leaderboardRef = React.useRef<HTMLDivElement>(null); // ✅ NEW
  
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    type: 'info',
    title: '',
    message: '',
  });

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({
      type,
      title,
      message,
      onConfirm,
      confirmText: 'OK',
    });
    setShowModal(true);
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setModalConfig({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
    });
    setShowModal(true);
  };

  const approvedParticipants = kelasData.peserta_kompetisi.filter(p => p.status === 'APPROVED');

  useEffect(() => {
    if (kelasData?.kompetisi?.id_kompetisi) {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;
      
      console.log(`🔄 Loading PEMULA bracket for kelas ${kelasKejuaraanId}...`);
      fetchBracketData(kompetisiId, kelasKejuaraanId);
    }
  }, [kelasData?.id_kelas_kejuaraan]);

  const fetchBracketData = async (kompetisiId: number, kelasKejuaraanId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ Bracket not yet generated for this class');
          setBracketGenerated(false);
          setMatches([]);
          return;
        }
        throw new Error('Failed to fetch bracket data');
      }

      const result = await response.json();
      console.log('📊 PEMULA Bracket data fetched:', result);

      if (result.data && result.data.matches) {
      const transformedMatches: Match[] = result.data.matches.map((m: any) => ({
        id_match: m.id,
        ronde: m.round,
        id_peserta_a: m.participant1?.id,
        id_peserta_b: m.participant2?.id,
        skor_a: m.scoreA || 0,
        skor_b: m.scoreB || 0,
        peserta_a: m.participant1 ? transformParticipantFromAPI(m.participant1) : undefined,
        peserta_b: m.participant2 ? transformParticipantFromAPI(m.participant2) : undefined,
        venue: m.venue ? { nama_venue: m.venue } : undefined,
        tanggal_pertandingan: m.tanggalPertandingan,
        nomor_partai: m.nomorPartai,        
        nomor_antrian: m.nomorAntrian,
        nomor_lapangan: m.nomorLapangan
      }));

        setMatches(transformedMatches);
        setBracketGenerated(true);
        console.log(`✅ Loaded ${transformedMatches.length} PEMULA matches`);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching PEMULA bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformParticipantFromAPI = (participant: any): Peserta => {
    if (participant.isTeam) {
      return {
        id_peserta_kompetisi: participant.id,
        is_team: true,
        status: 'APPROVED',
        anggota_tim: participant.teamMembers?.map((name: string) => ({
          atlet: { nama_atlet: name }
        })) || []
      };
    } else {
      return {
        id_peserta_kompetisi: participant.id,
        id_atlet: participant.atletId,
        is_team: false,
        status: 'APPROVED',
        atlet: {
          id_atlet: participant.atletId || 0,
          nama_atlet: participant.name,
          dojang: {
            nama_dojang: participant.dojang || ''
          }
        }
      };
    }
  };

  const openParticipantPreview = () => {
      setShowParticipantPreview(true);
    };

  const generateBracket = async () => {
    if (!kelasData) return;
    
    console.log('🥋 PEMULA: Generating bracket (auto, no BYE selection)');
    
    setLoading(true);
    setShowParticipantPreview(false); // ⭐ CLOSE PREVIEW SAAT GENERATE
    
    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      const endpoint = `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          kelasKejuaraanId: kelasKejuaraanId,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate bracket');
      }

      const result = await response.json();
      console.log('✅ PEMULA Bracket generated:', result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);
      
      showNotification(
        'success',
        'Berhasil!',
        'Bracket PEMULA berhasil dibuat!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error generating PEMULA bracket:', error);
      showNotification(
        'error',
        'Gagal Membuat Bracket',
        error.message || 'Terjadi kesalahan saat membuat bracket.',
        () => setShowModal(false)
      );
    } finally {
      setLoading(false);
    }
  };

  const shuffleBracket = async () => {
    if (!kelasData) return;
    
    console.log('🔀 Shuffling PEMULA bracket...');
    
    setLoading(true);
    
    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      const endpoint = `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/shuffle`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          kelasKejuaraanId: kelasKejuaraanId,
          isPemula: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to shuffle bracket');
      }

      const result = await response.json();
      console.log('✅ PEMULA Bracket shuffled:', result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);
      
      showNotification(
        'success',
        'Berhasil!',
        'Susunan peserta berhasil diacak ulang!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error shuffling PEMULA bracket:', error);
      showNotification(
        'error',
        'Gagal Shuffle',
        error.message || 'Terjadi kesalahan saat shuffle bracket.',
        () => setShowModal(false)
      );
    } finally {
      setLoading(false);
    }
  };

const exportPesertaToExcel = () => {
  // ✅ PERBAIKAN KRUSIAL: Gunakan data ASLI dari kelasData, BUKAN dari state matches!
  if (!kelasData?.peserta_kompetisi?.length) {
    showNotification(
      'warning',
      'Export Peserta',
      'Tidak ada data peserta untuk diexport',
      () => setShowModal(false)
    );
    return;
  }

  try {
    // ✅ Filter hanya APPROVED dari data ORIGINAL
    const approvedList = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');

    if (approvedList.length === 0) {
      showNotification(
        'warning',
        'Export Peserta',
        'Tidak ada peserta yang sudah di-approve',
        () => setShowModal(false)
      );
      return;
    }

    // ✅ Siapkan data header informasi kejuaraan
    const currentDate = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const headerInfo = [
      ['LAPORAN DATA PESERTA KOMPETISI - KATEGORI PEMULA'],
      ['Nama Event', kelasData.kompetisi?.nama_event || 'Sriwijaya International Taekwondo Championship 2025'],
      ['Kelas', `${kelasData.kelompok?.nama_kelompok} ${kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}`],
      ['Lokasi', kelasData.kompetisi?.lokasi || 'GOR Ranau JSC Palembang'],
      ['Tanggal Export', currentDate],
      ['Total Peserta', approvedList.length.toString()],
      [], // Baris kosong
    ];

    const rows: any[] = [];

    // ✅ LOOP PAKAI DATA ORIGINAL - Ini yang penting!
    approvedList.forEach((peserta: any, index: number) => {
      const isTeam = peserta.is_team;
      
      // ✅ Handle nama peserta untuk tim dan individu
      const namaPeserta = isTeam
        ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
        : peserta.atlet?.nama_atlet || "-";
      
      const cabang = kelasData.cabang || "-";
      const levelEvent = kelasData.kategori_event?.nama_kategori || "PEMULA";
      
      const kelasBerat = cabang === "KYORUGI"
        ? kelasData.kelas_berat?.nama_kelas || "-"
        : "-";
      
      const kelasPoomsae = cabang === "POOMSAE"
        ? kelasData.poomsae?.nama_kelas || "-"
        : "-";
      
      const kelasUsia = kelasData.kelompok?.nama_kelompok || "-";
      
      // ✅ PERBAIKAN: Jenis kelamin - langsung dari data peserta
      const jenisKelamin = !isTeam 
        ? (peserta.atlet?.jenis_kelamin === "LAKI_LAKI" ? "Laki-Laki" : peserta.atlet?.jenis_kelamin === "PEREMPUAN" ? "Perempuan" : "-")
        : "-";
      
      // ✅ PERBAIKAN: Dojang - langsung dari data peserta
      const dojang = isTeam && peserta.anggota_tim?.length
        ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
        : peserta.atlet?.dojang?.nama_dojang || "-";
      
      // ✅ PERBAIKAN: Data detail - langsung dari data peserta
      const tanggalLahir = !isTeam 
        ? peserta.atlet?.tanggal_lahir || "-"
        : "-";
      
      const beratBadan = !isTeam 
        ? peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-"
        : "-";
      
      const tingiBadan = !isTeam 
        ? peserta.atlet?.tinggi_badan ? `${peserta.atlet.tinggi_badan} cm` : "-"
        : "-";
      
      // ✅ PERBAIKAN: Sabuk - langsung dari data peserta dengan fallback
      const sabuk = !isTeam 
        ? (peserta.atlet?.sabuk?.nama_sabuk || peserta.atlet?.belt || "-")
        : "-";

      // ✅ Detail anggota tim
      const anggotaTimDetail = isTeam && peserta.anggota_tim?.length
        ? peserta.anggota_tim.map((m: any, i: number) => 
            `${i + 1}. ${m.atlet.nama_atlet} (${m.atlet.dojang?.nama_dojang || "-"})`
          ).join("; ")
        : "-";

      rows.push({
        "No": index + 1,
        "Nama Peserta": namaPeserta,
        "Tipe": isTeam ? "Tim" : "Individu",
        "Kategori": cabang,
        "Level": levelEvent,
        "Kelas Berat": kelasBerat,
        "Kelas Poomsae": kelasPoomsae,
        "Kelompok Usia": kelasUsia,
        "Jenis Kelamin": jenisKelamin,
        "Tanggal Lahir": tanggalLahir,
        "Berat Badan": beratBadan,
        "Tinggi Badan": tingiBadan,
        "Sabuk": sabuk,
        "Dojang": dojang,
        "Status": peserta.status,
        "Anggota Tim": anggotaTimDetail,
      });
    });

    // ✅ Create workbook dengan header info
    const workbook = XLSX.utils.book_new();
    
    // ✅ Buat worksheet dengan header info dulu
    const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);
    
    // ✅ Tambahkan data peserta ke worksheet yang sama
    XLSX.utils.sheet_add_json(worksheet, rows, { 
      origin: `A${headerInfo.length + 1}`, 
      skipHeader: false 
    });
    
    // ✅ Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama Peserta
      { wch: 10 },  // Tipe
      { wch: 12 },  // Kategori
      { wch: 10 },  // Level
      { wch: 15 },  // Kelas Berat
      { wch: 15 },  // Kelas Poomsae
      { wch: 18 },  // Kelompok Usia
      { wch: 15 },  // Jenis Kelamin
      { wch: 15 },  // Tanggal Lahir
      { wch: 12 },  // Berat Badan
      { wch: 12 },  // Tinggi Badan
      { wch: 15 },  // Sabuk
      { wch: 25 },  // Dojang
      { wch: 12 },  // Status
      { wch: 50 },  // Anggota Tim
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    // ✅ Generate filename dengan timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const eventName = kelasData.kompetisi?.nama_event?.replace(/\s+/g, '_') || 'Turnamen';
    const kelasName = `${kelasData.kelompok?.nama_kelompok}_${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}`.replace(/\s+/g, '_');
    const fileName = `Data_Peserta_PEMULA_${eventName}_${kelasName}_${timestamp}.xlsx`;

    // ✅ Export file
    XLSX.writeFile(workbook, fileName);

    showNotification(
      'success',
      'Export Peserta',
      'Data peserta PEMULA berhasil diexport ke spreadsheet',
      () => setShowModal(false)
    );
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showNotification(
      'error',
      'Gagal Export',
      'Terjadi kesalahan saat mengekspor data',
      () => setShowModal(false)
    );
  }
};

  const clearBracketResults = async () => {
    if (!kelasData) return;
    
    const kompetisiId = kelasData.kompetisi.id_kompetisi;
    const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

    showConfirmation(
      'Hapus Semua Hasil Pertandingan?',
      'Semua skor akan direset ke 0. Struktur bracket tetap sama. Aksi ini tidak dapat dibatalkan.',
      async () => {
        setClearing(true);
        try {
          const response = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}/clear-results`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              }
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to clear results');
          }

          await fetchBracketData(kompetisiId, kelasKejuaraanId);

          showNotification(
            'success',
            'Berhasil!',
            'Semua hasil pertandingan berhasil direset',
            () => setShowModal(false)
          );
        } catch (error: any) {
          console.error('❌ Error clearing results:', error);
          showNotification(
            'error',
            'Gagal Mereset Hasil',
            error.message || 'Terjadi kesalahan saat mereset hasil.',
            () => setShowModal(false)
          );
        } finally {
          setClearing(false);
        }
      },
      () => setShowModal(false)
    );
  };

  const deleteBracketPermanent = async () => {
    if (!kelasData) return;
    
    const kompetisiId = kelasData.kompetisi.id_kompetisi;
    const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;
    const isSelesai = kelasData.kompetisi.status === 'SELESAI';

    const confirmationSteps = async () => {
      showConfirmation(
        'Hapus Bracket Turnamen?',
        'Bracket akan dihapus PERMANENT termasuk semua pertandingan dan hasil. Anda harus generate ulang dari awal. Aksi ini tidak dapat dibatalkan.',
        async () => {
          if (isSelesai) {
            showConfirmation(
              '⚠️ Kompetisi Sudah Selesai!',
              'Kompetisi ini sudah berstatus SELESAI. Apakah Anda YAKIN ingin menghapus bracket? Data hasil tidak dapat dikembalikan.',
              async () => {
                await executeDeletion();
              },
              () => setShowModal(false)
            );
          } else {
            await executeDeletion();
          }
        },
        () => setShowModal(false)
      );
    };

    const executeDeletion = async () => {
      setDeleting(true);
      try {
        const response = await fetch(
          `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete bracket');
        }

        setMatches([]);
        setBracketGenerated(false);

        showNotification(
          'success',
          'Berhasil!',
          'Bracket berhasil dihapus. Anda dapat generate bracket baru.',
          () => setShowModal(false)
        );
      } catch (error: any) {
        console.error('❌ Error deleting bracket:', error);
        showNotification(
          'error',
          'Gagal Menghapus Bracket',
          error.message || 'Terjadi kesalahan saat menghapus bracket.',
          () => setShowModal(false)
        );
      } finally {
        setDeleting(false);
      }
    };

    confirmationSteps();
  };

  const updateMatchResult = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!kelasData) return;

    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      
      const match = matches.find(m => m.id_match === matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const tanggalInput = (document.getElementById('tanggalPertandingan') as HTMLInputElement)?.value || null;
      const nomorAntrianInput = (document.getElementById('nomorAntrian') as HTMLInputElement)?.value || null;
      const nomorLapanganInput = (document.getElementById('nomorLapangan') as HTMLInputElement)?.value || null;

      // ⭐ VALIDASI: Harus diisi bersamaan
      if ((nomorAntrianInput && !nomorLapanganInput) || (!nomorAntrianInput && nomorLapanganInput)) {
        showNotification(
          'warning',
          'Input Tidak Lengkap',
          'Nomor antrian dan nomor lapangan harus diisi bersamaan',
          () => setShowModal(false)
        );
        return;
      }

      // ⭐ CEK: Apakah ada perubahan skor?
      const hasScoreChange = scoreA > 0 || scoreB > 0;
      
      // ⭐ HANYA TENTUKAN WINNER JIKA ADA SKOR
      let winnerId = null;
      if (hasScoreChange) {
        winnerId = scoreA > scoreB ? match.id_peserta_a : match.id_peserta_b;
        
        if (!winnerId) {
          throw new Error('Cannot determine winner - no valid participant');
        }
      }

      // ⭐ PAYLOAD FLEKSIBEL
      const payload: any = {
        tanggalPertandingan: tanggalInput,
        nomorAntrian: nomorAntrianInput ? parseInt(nomorAntrianInput) : null,
        nomorLapangan: nomorLapanganInput ? nomorLapanganInput.toUpperCase() : null
      };

      // ⭐ HANYA KIRIM SKOR & WINNER JIKA ADA
      if (hasScoreChange) {
        payload.scoreA = scoreA;
        payload.scoreB = scoreB;
        payload.winnerId = winnerId;
      }

      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/match/${matchId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update match result');
      }

      await fetchBracketData(kompetisiId, kelasData.id_kelas_kejuaraan);

      setEditingMatch(null);
      showNotification(
        'success',
        'Berhasil!',
        hasScoreChange 
          ? 'Hasil pertandingan berhasil diperbarui!' 
          : 'Informasi pertandingan berhasil disimpan!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error updating match:', error);
      showNotification(
        'error',
        'Gagal Memperbarui',
        error.message || 'Gagal memperbarui pertandingan.',
        () => setShowModal(false)
      );
    }
  };

  const getParticipantName = (peserta?: Peserta) => {
    if (!peserta) return '';
    if (peserta.is_team) {
      return peserta.anggota_tim?.map(t => t.atlet.nama_atlet).join(', ') || 'Team';
    }
    return peserta.atlet?.nama_atlet || '';
  };

  const getDojoName = (peserta?: Peserta) => {
    if (!peserta) return '';
    return peserta.atlet?.dojang.nama_dojang || '';
  };

const generateLeaderboard = () => {
    if (matches.length === 0) return null;

    const leaderboard: {
      gold: { name: string; dojo: string; id: number }[];
      silver: { name: string; dojo: string; id: number }[];
      bronze: { name: string; dojo: string; id: number }[];
    } = {
      gold: [],
      silver: [],
      bronze: []
    };

    const processedGold = new Set<number>();
    const processedSilver = new Set<number>();
    const processedBronze = new Set<number>();

    // ⭐ DETECT: Ada Round 2 (Additional Match)?
    const round1Matches = matches.filter(m => m.ronde === 1);
    const round2Matches = matches.filter(m => m.ronde === 2);
    const hasAdditionalMatch = round2Matches.length > 0;

    if (!hasAdditionalMatch) {
      
      round1Matches.forEach((match, index) => {
        const hasScore = match.skor_a > 0 || match.skor_b > 0;
        
        if (hasScore && match.peserta_a && match.peserta_b) {
          const winner = match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b;
          const loser = match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;
          
          const winnerId = winner.id_peserta_kompetisi;
          const loserId = loser.id_peserta_kompetisi;
          
          // Winner → GOLD
          if (!processedGold.has(winnerId)) {
            leaderboard.gold.push({
              name: getParticipantName(winner),
              dojo: getDojoName(winner),
              id: winnerId
            });
            processedGold.add(winnerId);
          }
          
          // Loser → SILVER
          if (!processedSilver.has(loserId)) {
            leaderboard.silver.push({
              name: getParticipantName(loser),
              dojo: getDojoName(loser),
              id: loserId
            });
            processedSilver.add(loserId);
          }
        }
      });
    }
    // ========================================
    // SCENARIO 2: GANJIL (Ada Additional Match)
    // ========================================
else {
  
  const additionalMatch = round2Matches[0];
  const lastRound1Match = round1Matches[round1Matches.length - 1];
  
  // ⭐ STEP 1: Process Additional Match (Round 2) FIRST
  if (additionalMatch && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0)) {
    const winner = additionalMatch.skor_a > additionalMatch.skor_b 
      ? additionalMatch.peserta_a 
      : additionalMatch.peserta_b;
    const loser = additionalMatch.skor_a > additionalMatch.skor_b 
      ? additionalMatch.peserta_b 
      : additionalMatch.peserta_a;
    
    // Additional Match Winner → GOLD
    if (winner) {
      leaderboard.gold.push({
        name: getParticipantName(winner),
        dojo: getDojoName(winner),
        id: winner.id_peserta_kompetisi
      });
      processedGold.add(winner.id_peserta_kompetisi);
    }
    
    // Additional Match Loser → SILVER
    if (loser) {
      leaderboard.silver.push({
        name: getParticipantName(loser),
        dojo: getDojoName(loser),
        id: loser.id_peserta_kompetisi
      });
      processedSilver.add(loser.id_peserta_kompetisi);
    }
  }
  
  // ⭐ STEP 2: Process Round 1 Matches
  round1Matches.forEach((match, index) => {
    const hasScore = match.skor_a > 0 || match.skor_b > 0;
    const isLastMatch = match.id_match === lastRound1Match?.id_match;
    
    if (hasScore && match.peserta_a && match.peserta_b) {
      const winner = match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b;
      const loser = match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;
      
      const winnerId = winner.id_peserta_kompetisi;
      const loserId = loser.id_peserta_kompetisi;
      
      if (isLastMatch) {
        // ⭐ LAST MATCH SPECIAL HANDLING
        // Winner goes to Additional Match (already processed above or pending)
        // Loser → BRONZE
        if (!processedBronze.has(loserId)) {
          leaderboard.bronze.push({
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loserId
          });
          processedBronze.add(loserId);
        }
      } else {
        // ⭐ OTHER MATCHES (Match A, etc.)
        // Winner → GOLD (if not already processed)
        if (!processedGold.has(winnerId)) {
          leaderboard.gold.push({
            name: getParticipantName(winner),
            dojo: getDojoName(winner),
            id: winnerId
          });
          processedGold.add(winnerId);
        }
        
        // Loser → SILVER (if not already processed)
        if (!processedSilver.has(loserId)) {
          leaderboard.silver.push({
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loserId
          });
          processedSilver.add(loserId);
        }
      }
    }
  });
}
    
    return leaderboard;
  };

const handleExportPDF = async () => {
  if (!kelasData || matches.length === 0) {
    showNotification(
      'warning',
      'Tidak Dapat Export',
      'Bracket belum dibuat atau tidak ada data untuk di-export.',
      () => setShowModal(false)
    );
    return;
  }

  setExportingPDF(true);

  try {
    // ✅ METHOD 1: Try using ref
    let bracketElement = bracketRef.current;
    
    // ✅ METHOD 2: If ref fails, query selector
    if (!bracketElement) {
      console.warn('⚠️ Ref not found, trying querySelector...');
      bracketElement = document.querySelector('.tournament-layout') as HTMLElement;
    }
    
    // ✅ METHOD 3: Last resort - find by class pattern
    if (!bracketElement) {
      console.warn('⚠️ tournament-layout not found, trying alternative...');
      const allDivs = document.querySelectorAll('div[class*="space-y-4"]');
      for (const div of allDivs) {
        const htmlDiv = div as HTMLElement;
        if (htmlDiv.querySelector('.bg-white.rounded-lg.shadow-md')) {
          bracketElement = htmlDiv.parentElement as HTMLElement;
          console.log('✅ Found bracket via alternative method');
          break;
        }
      }
    }

    if (!bracketElement) {
      throw new Error('Bracket element not found. Please refresh and try again.');
    }

    // ✅ Ambil tanggal dari input manual
    const dateInput = document.getElementById('tournament-date-display') as HTMLInputElement;
    const selectedDate = dateInput?.value 
      ? new Date(dateInput.value).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      : new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });

    // ✅ Siapkan metadata untuk PDF header
    const metadata = {
      logoPBTI: taekwondo,
      logoEvent: sriwijaya,
      namaKejuaraan: kelasData.kompetisi.nama_event,
      kelas: `${kelasData.kelompok?.nama_kelompok} ${kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}`,
      tanggalTanding: selectedDate, // ✅ Pakai tanggal dari input
      jumlahKompetitor: approvedParticipants.length,
      lokasi: kelasData.kompetisi.lokasi
    };

    await exportBracketFromData(kelasData, bracketElement, metadata);

    showNotification(
      'success',
      'Berhasil!',
      'PDF bracket PEMULA berhasil didownload!',
      () => setShowModal(false)
    );
  } catch (error: any) {
    console.error('❌ Error exporting PDF:', error);
    showNotification(
      'error',
      'Gagal Export PDF',
      error.message || 'Terjadi kesalahan saat membuat PDF.',
      () => setShowModal(false)
    );
  } finally {
    setExportingPDF(false);
  }
};

  const leaderboard = generateLeaderboard();

return (
  <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
    {/* Header */}
    <div className="bg-white shadow-sm border-b" style={{ borderColor: '#990D35' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-black/5 transition-all"
              >
                <ArrowLeft size={20} style={{ color: '#990D35' }} />
              </button>
            )}
            <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#990D35' }}>
              <Trophy size={32} style={{ color: '#F5FBEF' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#050505' }}>
                {kelasData.kompetisi.nama_event}
              </h1>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                <span>🥋 KATEGORI PEMULA</span>
                <span>•</span>
                <span>{kelasData.kompetisi.lokasi}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
                onClick={exportPesertaToExcel}
                className="py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: '#16a34a', color: '#F5FBEF' }}
              >
                Export Peserta
              </button>
            <button
              onClick={shuffleBracket}
              disabled={loading || approvedParticipants.length < 2 || !bracketGenerated}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Shuffle size={16} />
                  <span>Shuffle</span>
                </>
              )}
            </button>
            
            <button
              onClick={clearBracketResults}
              disabled={!bracketGenerated || clearing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#F97316', color: '#F5FBEF' }}
            >
              {clearing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Clear Results</span>
                </>
              )}
            </button>

            <button
              onClick={deleteBracketPermanent}
              disabled={!bracketGenerated || deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#DC2626', color: '#F5FBEF' }}
            >
              {deleting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Delete Bracket</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!bracketGenerated || exportingPDF || matches.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90 shadow-md"
              style={{ backgroundColor: '#10B981', color: '#F5FBEF' }}
            >
              {exportingPDF ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Competition details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#990D35' }}>
                {kelasData.kelompok?.nama_kelompok} {kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} {kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.7 }}>
                Contestants: {approvedParticipants.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* PEMULA Layout */}
    {bracketGenerated && matches.length > 0 ? (
      <div className="p-6">
        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          {/* CENTER: Bracket Container */}
          <div className="w-full">    
            {/* Header Sederhana - Tanpa Border */}
            <div className="mb-4">
              {/* Header 3 Kolom - Compact */}
              <div className="flex items-start justify-between gap-4 mb-3">
                {/* KOLOM KIRI - Logo PBTI */}
                <div className="flex-shrink-0 w-20">
                  <img 
                    src={taekwondo} 
                    alt="PBTI Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                
                {/* KOLOM TENGAH - Info Kejuaraan */}
                <div className="flex-1 text-center px-3">
                  {/* Nama Kejuaraan */}
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#990D35' }}>
                    {kelasData.kompetisi.nama_event}
                  </h2>
                  
                  {/* Detail Kelas */}
                  <p className="text-base font-semibold mb-1" style={{ color: '#050505' }}>
                    {kelasData.kelompok?.nama_kelompok}{' '}
                    {kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'}{' '}
                    {kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}
                  </p>
                  
                  {/* Tanggal - Input Manual */}
                  <input
                    type="date"
                    id="tournament-date-display"
                    defaultValue={new Date(kelasData.kompetisi.tanggal_mulai).toISOString().split('T')[0]}
                    className="text-sm px-2 py-1 rounded border text-center mb-1"
                    style={{ borderColor: '#990D35', color: '#050505' }}
                  />
                  
                  {/* Lokasi */}
                  <p className="text-sm mb-1" style={{ color: '#050505', opacity: 0.7 }}>
                    {kelasData.kompetisi.lokasi}
                  </p>
                  
                  {/* Jumlah Kompetitor */}
                  <p className="text-sm font-medium" style={{ color: '#990D35' }}>
                    {approvedParticipants.length} Kompetitor
                  </p>
                </div>
                
                {/* KOLOM KANAN - Logo Event */}
                <div className="flex-shrink-0 w-20">
                  <img 
                    src={sriwijaya} 
                    alt="Event Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

              {/* ROUND 1 MATCHES */}
          <div ref={bracketRef} className="tournament-layout bg-white p-6 rounded-lg">
              <div className="space-y-4">
                {matches.filter(m => m.ronde === 1).map((match, matchIndex) => (
                  <div
                    key={match.id_match}
                    className="bg-white rounded-lg shadow-md border overflow-hidden mx-auto"
                    style={{ 
                      borderColor: '#DC143C',
                      maxWidth: '320px'
                    }}
                  >
{/* Header Card */}
                    <div 
                      className="px-3 py-2 border-b flex items-center justify-between"
                      style={{ 
                        backgroundColor: '#FFF5F5',
                        borderColor: '#DC143C'
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {match.nomor_partai && (
            <span 
              className="text-xs px-2 py-1 rounded-full font-bold"
              style={{ backgroundColor: '#990D35', color: 'white' }}
            >
                           No.Partai: {match.nomor_partai}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="p-1 rounded hover:bg-black/5 transition-all"
                      >
                        <Edit3 size={14} style={{ color: '#DC143C' }} />
                      </button>
                    </div>

{/* Participants Container */}
                    <div className="flex flex-col">
                      {/* Participant A */}
                      <div 
                        className="px-3 py-3 border-b flex items-start justify-between gap-2"
                        style={{ 
                          borderColor: '#F0F0F0',
                          minHeight: '70px'
                        }}
                      >
                        {match.peserta_a ? (
                          <>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-bold text-lg leading-tight mb-1"
                                style={{ 
                                  color: '#000',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {getParticipantName(match.peserta_a)}
                              </p>
                              <p 
                                className="text-base leading-tight"
                                style={{ 
                                  color: '#DC143C',
                                  opacity: 0.7
                                }}
                              >
                                {getDojoName(match.peserta_a)}
                              </p>
                            </div>
                            {(match.skor_a > 0 || match.skor_b > 0) && (
                              <div 
                                className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                style={{ 
                                  backgroundColor: match.skor_a > match.skor_b ? '#22c55e' : '#F0F0F0',
                                  color: match.skor_a > match.skor_b ? 'white' : '#6b7280'
                                }}
                              >
                                {match.skor_a}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full text-center">
                            <span className="text-sm text-gray-400">TBD</span>
                          </div>
                        )}
                      </div>

{/* Participant B atau BYE */}
                      <div 
                        className="px-3 py-3 flex items-center justify-center"
                        style={{ 
                          minHeight: '70px',
                          backgroundColor: match.peserta_b ? 'transparent' : '#FFFBEA'
                        }}
                      >
                        {match.peserta_b ? (
                          <div className="w-full flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-bold text-lg leading-tight mb-1"
                                style={{ 
                                  color: '#000',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {getParticipantName(match.peserta_b)}
                              </p>
                              <p 
                                className="text-base leading-tight"
                                style={{ 
                                  color: '#EF4444',
                                  opacity: 0.7
                                }}
                              >
                                {getDojoName(match.peserta_b)}
                              </p>
                            </div>
                            {(match.skor_a > 0 || match.skor_b > 0) && (
                              <div 
                                className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                style={{ 
                                  backgroundColor: match.skor_b > match.skor_a ? '#22c55e' : '#F0F0F0',
                                  color: match.skor_b > match.skor_a ? 'white' : '#6b7280'
                                }}
                              >
                                {match.skor_b}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span 
                            className="text-xs font-bold px-3 py-1 rounded"
                            style={{ 
                              backgroundColor: '#F5B700',
                              color: 'white'
                            }}
                          >
                            BYE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* ADDITIONAL MATCH (Round 2) */}
              {(() => {
                const round2Matches = matches.filter(m => m.ronde === 2);
                const round1Matches = matches.filter(m => m.ronde === 1);
                
                if (round2Matches.length === 0) return null;
                
                const additionalMatch = round2Matches[0];
                
                return (
                  <div className="mt-8 pt-6">
                    {/* Header Additional Match */}
                    <div className="mb-4">
                      <div 
                        className="rounded-lg p-3 shadow-sm mx-auto"
                        style={{ 
                          backgroundColor: '#FFFBEA', 
                          border: '2px solid #F5B700',
                          maxWidth: '320px'
                        }}
                      >
                        <h3 className="text-center font-bold text-base" style={{ color: '#000' }}>
                          ADDITIONAL MATCH
                        </h3>
                      </div>
                    </div>

                    {/* Additional Match Card */}
                    <div
                      className="bg-white rounded-lg shadow-md border overflow-hidden mx-auto"
                      style={{ 
                        borderColor: '#DC143C',
                        maxWidth: '320px'
                      }}
                    >
  <div 
    className="px-3 py-2 border-b flex items-center justify-between"
    style={{ 
      backgroundColor: '#FFFBEA',
      borderColor: '#DC143C'
    }}
  >
    <div className="flex items-center gap-2 flex-1">
      {additionalMatch.nomor_partai && (
        <span 
          className="text-xs font-medium"
          style={{ color: '#050505', opacity: 0.7 }}
        >
          {additionalMatch.nomor_partai}
        </span>
      )}
    </div>
    
    <button
      onClick={() => setEditingMatch(additionalMatch)}
      className="p-1 rounded hover:bg-black/5 transition-all"
    >
      <Edit3 size={14} style={{ color: '#DC143C' }} />
    </button>
  </div>

 {/* Participants Container */}
                    <div className="flex flex-col">
                      {/* Participant A */}
                      <div 
                        className="px-3 py-3 border-b flex items-start justify-between gap-2"
                        style={{ 
                          borderColor: '#F0F0F0',
                          minHeight: '70px'
                        }}
                      >
                        {additionalMatch.peserta_a ? (
                          <>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-bold text-lg leading-tight mb-1"
                                style={{ 
                                  color: '#000',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {getParticipantName(additionalMatch.peserta_a)}
                              </p>
                              <p 
                                className="text-base leading-tight"
                                style={{ 
                                  color: '#DC143C',
                                  opacity: 0.7
                                }}
                              >
                                {getDojoName(additionalMatch.peserta_a)}
                              </p>
                            </div>
                            {(additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                              <div 
                                className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                style={{ 
                                  backgroundColor: additionalMatch.skor_a > additionalMatch.skor_b ? '#22c55e' : '#F0F0F0',
                                  color: additionalMatch.skor_a > additionalMatch.skor_b ? 'white' : '#6b7280'
                                }}
                              >
                                {additionalMatch.skor_a}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full text-center">
                            <span className="text-sm text-gray-400">TBD</span>
                          </div>
                        )}
                      </div>

    {/* Participant B (from last match) */}
                        <div 
                          className="px-3 py-3 flex items-center justify-center"
                          style={{ 
                            minHeight: '70px',
                            backgroundColor: additionalMatch.peserta_b ? 'transparent' : '#FFF5F5'
                          }}
                        >
                          {additionalMatch.peserta_b ? (
                            <div className="w-full flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p 
                                    className="font-bold text-lg leading-tight"
                                    style={{ 
                                      color: '#000',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {getParticipantName(additionalMatch.peserta_b)}
                                  </p>
                                  <span 
                                    className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0"
                                    style={{ backgroundColor: '#DC143C', color: 'white' }}
                                  >
                                    from Match {round1Matches.length}
                                  </span>
                                </div>
                                <p 
                                  className="text-base leading-tight"
                                  style={{ 
                                    color: '#EF4444',
                                    opacity: 0.7
                                  }}
                                >
                                  {getDojoName(additionalMatch.peserta_b)}
                                </p>
                              </div>
                              {(additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                <div 
                                  className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                  style={{ 
                                    backgroundColor: additionalMatch.skor_b > additionalMatch.skor_a ? '#22c55e' : '#F0F0F0',
                                    color: additionalMatch.skor_b > additionalMatch.skor_a ? 'white' : '#6b7280'
                                  }}
                                >
                                  {additionalMatch.skor_b}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <span 
                                className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded"
                                style={{ 
                                  backgroundColor: '#DC143C', 
                                  color: 'white' 
                                }}
                              >
                                ⏳ Waiting for Match {round1Matches.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>
                        <div className="w-full mt-10">
              <div className="bg-white rounded-lg shadow-md border overflow-hidden" style={{ borderColor: '#DC143C', maxWidth: '500px', margin: '0 auto' }}>
              <div className="px-4 py-3 border-b" style={{ backgroundColor: '#FFF5F5', borderColor: '#DC143C' }}>
                <div className="flex items-center gap-2 justify-center">
                  <Trophy size={24} style={{ color: '#DC143C' }} />
                  <h3 className="text-xl font-bold" style={{ color: '#DC143C' }}>
                    LEADERBOARD
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {leaderboard && leaderboard.gold.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <span className="text-lg">🥇</span>
                      <h4 className="font-bold text-base" style={{ color: '#000' }}>
                        GOLD MEDALS
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.gold.map((participant, idx) => (
                        <div key={participant.id} className="p-3 rounded border" style={{ 
                          backgroundColor: '#FFFBEA', 
                          borderColor: '#F5B700' 
                        }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold" style={{ color: '#F5B700' }}>
                              {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight" style={{ color: '#000' }}>
                                {participant.name}
                              </p>
                              <p className="text-xs leading-tight" style={{ color: '#DC143C', opacity: 0.7 }}>
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leaderboard && leaderboard.silver.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <span className="text-lg">🥈</span>
                      <h4 className="font-bold text-base" style={{ color: '#000' }}>
                        SILVER MEDALS
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.silver.map((participant, idx) => (
                        <div key={participant.id} className="p-3 rounded border" style={{ 
                          backgroundColor: '#F5F5F5', 
                          borderColor: '#C0C0C0' 
                        }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold" style={{ color: '#9CA3AF' }}>
                              {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight" style={{ color: '#000' }}>
                                {participant.name}
                              </p>
                              <p className="text-xs leading-tight" style={{ color: '#DC143C', opacity: 0.7 }}>
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leaderboard && leaderboard.bronze && leaderboard.bronze.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <span className="text-lg">🥉</span>
                      <h4 className="font-bold text-base" style={{ color: '#000' }}>
                        BRONZE MEDALS
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {leaderboard.bronze.map((participant, idx) => (
                        <div key={participant.id} className="p-3 rounded border" style={{ 
                          backgroundColor: '#FFF8F0', 
                          borderColor: '#CD7F32' 
                        }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold" style={{ color: '#CD7F32' }}>
                              {idx + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight" style={{ color: '#000' }}>
                                {participant.name}
                              </p>
                              <p className="text-xs leading-tight" style={{ color: '#DC143C', opacity: 0.7 }}>
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leaderboard && leaderboard.gold.length === 0 && (
                  <div className="text-center py-6">
                    <Trophy size={40} style={{ color: '#DC143C', opacity: 0.3 }} className="mx-auto mb-2" />
                    <p className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                      Belum ada hasil pertandingan
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="p-6">
        <div className="text-center py-16">
          <Trophy size={64} style={{ color: '#990D35', opacity: 0.4 }} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#050505' }}>
            {approvedParticipants.length < 2 ? 'Insufficient Participants' : 'Tournament Bracket Not Generated'}
          </h3>
          <p className="text-base mb-6" style={{ color: '#050505', opacity: 0.6 }}>
            {approvedParticipants.length < 2 
              ? `Need at least 2 approved participants. Currently have ${approvedParticipants.length}.`
              : 'Click "Generate" to create the tournament bracket'
            }
          </p>
          {approvedParticipants.length >= 2 && (
            <button
              onClick={openParticipantPreview}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
            >
              {loading ? 'Processing...' : 'Preview & Generate Bracket'}
            </button>
          )}
        </div>
      </div>
    )}

    {/* Participant Preview Modal */}
    {showParticipantPreview && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#990D35' }}>
            <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
              Preview Peserta Tournament
            </h3>
            <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
              Total {approvedParticipants.length} peserta akan diikutkan dalam bracket
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {approvedParticipants.map((peserta, index) => (
                <div
                  key={peserta.id_peserta_kompetisi}
                  className="p-4 rounded-lg border-2"
                  style={{ borderColor: '#990D35', backgroundColor: 'rgba(153, 13, 53, 0.05)' }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                      style={{ backgroundColor: '#990D35', color: 'white' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg mb-1 break-words" style={{ color: '#050505' }}>
                        {getParticipantName(peserta)}
                      </p>
                      <p 
                        className="text-base break-words" 
                        style={{ 
                          color: '#050505', 
                          opacity: 0.6,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {getDojoName(peserta)}
                      </p>
                    </div>
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white z-10" style={{ borderColor: '#990D35' }}>
            <button
              onClick={() => setShowParticipantPreview(false)}
              className="flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-50"
              style={{ borderColor: '#990D35', color: '#990D35' }}
            >
              Batal
            </button>
            <button
              onClick={generateBracket}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
            >
              Generate Bracket Otomatis
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Match Modal */}
    {editingMatch && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
            <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
              Update Match Result
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* METADATA SECTION */}
            <div className="space-y-3 pb-4 border-b" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  📅 Tanggal Pertandingan
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2"
                  style={{ borderColor: '#990D35' }}
                  defaultValue={
                    editingMatch.tanggal_pertandingan 
                      ? new Date(editingMatch.tanggal_pertandingan).toISOString().split('T')[0] 
                      : ''
                  }
                  id="tanggalPertandingan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    🔢 Nomor Antrian
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2"
                    style={{ borderColor: '#990D35' }}
                    defaultValue={editingMatch.nomor_antrian || ''}
                    id="nomorAntrian"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    📍 Nomor Lapangan
                  </label>
                  <input
                    type="text"
                    maxLength={1}
                    className="w-full px-3 py-2 rounded-lg border uppercase focus:ring-2"
                    style={{ borderColor: '#990D35' }}
                    defaultValue={editingMatch.nomor_lapangan || ''}
                    id="nomorLapangan"
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SCORE SECTION */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold" style={{ color: '#050505' }}>
                  Hasil Pertandingan
                </label>
              </div>

              {editingMatch.peserta_a && (
                <div className="mb-3">
                  <label className="block text-lg font-medium mb-2">
                    🔵 {getParticipantName(editingMatch.peserta_a)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35' }}
                    defaultValue={editingMatch.skor_a || 0}
                    id="scoreA"
                    placeholder="0"
                  />
                </div>
              )}
              
              {editingMatch.peserta_b && (
                <div>
                  <label className="block text-lg font-medium mb-2">
                    🔴 {getParticipantName(editingMatch.peserta_b)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35' }}
                    defaultValue={editingMatch.skor_b || 0}
                    id="scoreB"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t flex gap-3">
            <button
              onClick={() => setEditingMatch(null)}
              className="flex-1 py-2 px-4 rounded-lg border"
              style={{ borderColor: '#990D35', color: '#990D35' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const scoreA = parseInt((document.getElementById('scoreA') as HTMLInputElement)?.value || '0');
                const scoreB = parseInt((document.getElementById('scoreB') as HTMLInputElement)?.value || '0');
                updateMatchResult(editingMatch.id_match, scoreA, scoreB);
              }}
              className="flex-1 py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
            >
              💾 Save Result
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Notification Modal - Animated */}
    {showModal && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        style={{
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes bounceIn {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.05); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}
        </style>
        
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          style={{
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Icon Header with Color */}
          <div 
            className="p-6 flex flex-col items-center"
            style={{
              backgroundColor: modalConfig.type === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                            modalConfig.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                            modalConfig.type === 'warning' ? 'rgba(245, 183, 0, 0.1)' :
                            'rgba(153, 13, 53, 0.1)'
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: modalConfig.type === 'success' ? '#22c55e' :
                            modalConfig.type === 'error' ? '#ef4444' :
                            modalConfig.type === 'warning' ? '#F5B700' :
                            '#990D35',
                animation: 'bounceIn 0.5s ease-out'
              }}
            >
              {modalConfig.type === 'success' && (
                <CheckCircle size={40} style={{ color: 'white' }} />
              )}
              {modalConfig.type === 'error' && (
                <AlertTriangle size={40} style={{ color: 'white' }} />
              )}
              {modalConfig.type === 'warning' && (
                <AlertTriangle size={40} style={{ color: 'white' }} />
              )}
              {modalConfig.type === 'info' && (
                <Trophy size={40} style={{ color: 'white' }} />
              )}
            </div>
            
            <h3 
              className="text-2xl font-bold text-center mb-2"
              style={{ color: '#050505' }}
            >
              {modalConfig.title}
            </h3>
            
            <p 
              className="text-center text-base leading-relaxed"
              style={{ color: '#050505', opacity: 0.7 }}
            >
              {modalConfig.message}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 flex gap-3">
            {modalConfig.cancelText && (
              <button
                onClick={() => {
                  if (modalConfig.onCancel) modalConfig.onCancel();
                  setShowModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:bg-white border-2"
                style={{ 
                  borderColor: '#990D35', 
                  color: '#990D35',
                  backgroundColor: 'white'
                }}
              >
                {modalConfig.cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (modalConfig.onConfirm) modalConfig.onConfirm();
                setShowModal(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg"
              style={{ 
                backgroundColor: modalConfig.type === 'success' ? '#22c55e' :
                            modalConfig.type === 'error' ? '#ef4444' :
                            modalConfig.type === 'warning' ? '#F5B700' :
                            '#990D35',
                color: 'white'
              }}
            >
              {modalConfig.confirmText || 'OK'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default TournamentBracketPemula