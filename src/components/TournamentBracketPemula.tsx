import React, { useState, useEffect } from 'react';
import { Trophy, Edit3, Save, CheckCircle, ArrowLeft, AlertTriangle, RefreshCw, Download, Shuffle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/authContext';

interface Peserta {
  id_peserta_kompetisi: number;
  id_atlet?: number;
  is_team: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  atlet?: {
    id_atlet: number;
    nama_atlet: string;
    dojang: {
      nama_dojang: string;
    };
  };
  anggota_tim?: {
    atlet: {
      nama_atlet: string;
    };
  }[];
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
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null);
  const leaderboardRef = React.useRef<HTMLDivElement>(null);
  
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

    console.log(`\n🏅 Generating PEMULA Leaderboard:`);
    console.log(`   Round 1 matches: ${round1Matches.length}`);
    console.log(`   Round 2 matches: ${round2Matches.length}`);
    console.log(`   Has Additional Match: ${hasAdditionalMatch}`);

    // ========================================
    // SCENARIO 1: GENAP (No Additional Match)
    // ========================================
    if (!hasAdditionalMatch) {
      console.log(`   📊 GENAP Scenario`);
      
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
            console.log(`      Match ${index + 1} Winner → GOLD: ${getParticipantName(winner)}`);
          }
          
          // Loser → SILVER
          if (!processedSilver.has(loserId)) {
            leaderboard.silver.push({
              name: getParticipantName(loser),
              dojo: getDojoName(loser),
              id: loserId
            });
            processedSilver.add(loserId);
            console.log(`      Match ${index + 1} Loser → SILVER: ${getParticipantName(loser)}`);
          }
        }
      });
    }
    // ========================================
    // SCENARIO 2: GANJIL (Ada Additional Match)
    // ========================================
    // ========================================
// SCENARIO 2: GANJIL (Ada Additional Match)
// ========================================
else {
  console.log(`   📊 GANJIL Scenario (Additional Match exists)`);
  
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
      console.log(`      Additional Match Winner → GOLD: ${getParticipantName(winner)}`);
    }
    
    // Additional Match Loser → SILVER
    if (loser) {
      leaderboard.silver.push({
        name: getParticipantName(loser),
        dojo: getDojoName(loser),
        id: loser.id_peserta_kompetisi
      });
      processedSilver.add(loser.id_peserta_kompetisi);
      console.log(`      Additional Match Loser → SILVER: ${getParticipantName(loser)}`);
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
          console.log(`      Match ${index + 1} (Last) Loser → BRONZE: ${getParticipantName(loser)}`);
        }
        console.log(`      Match ${index + 1} (Last) Winner → Goes to Additional Match: ${getParticipantName(winner)}`);
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
          console.log(`      Match ${index + 1} Winner → GOLD: ${getParticipantName(winner)}`);
        }
        
        // Loser → SILVER (if not already processed)
        if (!processedSilver.has(loserId)) {
          leaderboard.silver.push({
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loserId
          });
          processedSilver.add(loserId);
          console.log(`      Match ${index + 1} Loser → SILVER: ${getParticipantName(loser)}`);
        }
      }
    }
  });
}

    console.log(`\n   ✅ Final Leaderboard:`);
    console.log(`      GOLD: ${leaderboard.gold.length}`);
    console.log(`      SILVER: ${leaderboard.silver.length}`);
    console.log(`      BRONZE: ${leaderboard.bronze.length}\n`);
    
    return leaderboard;
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

            <div className="flex gap-3">
              <button
                onClick={shuffleBracket}
                disabled={loading || approvedParticipants.length < 2 || !bracketGenerated}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
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
        <div className="p-6" ref={bracketRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: All Matches */}
            <div>
<div className="space-y-4">
                {/* ⭐ ROUND 1 MATCHES */}
                {matches.filter(m => m.ronde === 1).map((match, matchIndex) => (
                  <div
                    key={match.id_match}
                    className="bg-white rounded-xl shadow-md border-2 overflow-hidden"
                    style={{ borderColor: '#990D35' }}
                  >
                    <div 
                        className="px-4 py-2.5 border-b flex items-center justify-between"
                        style={{ 
                          backgroundColor: 'rgba(153, 13, 53, 0.05)',
                          borderColor: '#990D35'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          
                          {/* ⭐ BADGE: NOMOR PARTAI (Auto-generated dari backend) */}
                          {match.nomor_partai && (
                            <span 
                              className="text-xs px-2.5 py-1 rounded-full font-bold shadow-sm"
                              style={{ backgroundColor: '#990D35', color: 'white' }}
                            >
                              No. Partai: {match.nomor_partai}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {match.tanggal_pertandingan && (
                            <span className="text-xs flex items-center gap-1" style={{ color: '#050505', opacity: 0.7 }}>
                              {new Date(match.tanggal_pertandingan).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingMatch(match)}
                            className="p-1.5 rounded-lg hover:bg-black/5 transition-all"
                          >
                            <Edit3 size={14} style={{ color: '#050505', opacity: 0.6 }} />
                          </button>
                        </div>
                      </div>

                    <div className="p-4 space-y-3">
                      {/* Participant A */}
                      <div 
                        className={`relative rounded-lg border-2 p-3 transition-all ${
                          match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0)
                            ? 'border-yellow-400 bg-yellow-50/50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {match.peserta_a ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span 
                                  className="font-bold text-base truncate"
                                  style={{ color: '#3B82F6' }}
                                >
                                  {getParticipantName(match.peserta_a)}
                                </span>
                              </div>
                              <p className="text-xs uppercase truncate pl-0.5" style={{ color: '#3B82F6', opacity: 0.7 }}>
                                {getDojoName(match.peserta_a)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0) && (
                                <span 
                                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                  style={{ backgroundColor: '#F5B700', color: 'white' }}
                                >
                                  🏆 GOLD
                                </span>
                              )}
                              {(match.skor_a > 0 || match.skor_b > 0) && (
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                                  style={{ 
                                    backgroundColor: match.skor_a > match.skor_b ? '#22c55e' : '#e5e7eb',
                                    color: match.skor_a > match.skor_b ? 'white' : '#6b7280'
                                  }}
                                >
                                  {match.skor_a}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <span className="text-sm font-medium" style={{ color: '#050505', opacity: 0.4 }}>
                              TBD
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Participant B */}
                      {match.peserta_b ? (
                        <div 
                          className={`relative rounded-lg border-2 p-3 transition-all ${
                            match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0)
                              ? 'border-yellow-400 bg-yellow-50/50' 
                              : match.skor_a > 0 || match.skor_b > 0
                              ? 'border-gray-300 bg-gray-50/30'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span 
                                  className="font-bold text-base truncate"
                                  style={{ color: '#EF4444' }}
                                >
                                  {getParticipantName(match.peserta_b)}
                                </span>
                              </div>
                              <p className="text-xs uppercase truncate pl-0.5" style={{ color: '#EF4444', opacity: 0.7 }}>
                                {getDojoName(match.peserta_b)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                                <span 
                                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                  style={{ backgroundColor: '#F5B700', color: 'white' }}
                                >
                                  🏆 GOLD
                                </span>
                              )}
                              {match.skor_b < match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                                <span 
                                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                  style={{ backgroundColor: '#C0C0C0', color: 'white' }}
                                >
                                  🥈 SILVER
                                </span>
                              )}
                              {(match.skor_a > 0 || match.skor_b > 0) && (
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                                  style={{ 
                                    backgroundColor: match.skor_b > match.skor_a ? '#22c55e' : '#e5e7eb',
                                    color: match.skor_b > match.skor_a ? 'white' : '#6b7280'
                                  }}
                                >
                                  {match.skor_b}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3 px-4 rounded-lg border-2" style={{ 
                          backgroundColor: 'rgba(156, 163, 175, 0.05)',
                          borderColor: '#e5e7eb'
                        }}>
                          <span 
                            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full"
                            style={{ 
                              backgroundColor: '#9CA3AF', 
                              color: 'white' 
                            }}
                          >
                            ⏳ TBD
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* ⭐ ADDITIONAL MATCH (Round 2 - Bagan 3) */}
                {(() => {
                  const round2Matches = matches.filter(m => m.ronde === 2);
                  const round1Matches = matches.filter(m => m.ronde === 1);
                  
                  if (round2Matches.length === 0) return null;
                  
                  const additionalMatch = round2Matches[0];
                  const lastRound1Match = round1Matches[round1Matches.length - 1];
                  
                  return (
                    <div className="mt-8 pt-8 border-t-4 border-dashed" style={{ borderColor: '#F5B700' }}>
                      {/* Header Additional Match */}
                      <div className="mb-4">
                        <div 
                          className="rounded-lg p-4 shadow-sm flex items-center justify-between"
                          style={{ backgroundColor: 'rgba(245, 183, 0, 0.1)', border: '2px solid #F5B700' }}
                        >
                          
                          {/* Indicator: Connected from last match */}
                          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#F5B700' }}>
                            <span>↑</span>
                            <span>From Match {round1Matches.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Match Card */}
                      <div
                        className="bg-white rounded-xl shadow-md border-2 overflow-hidden"
                        style={{ borderColor: '#F5B700' }}
                      >
                        <div 
                          className="px-4 py-2.5 border-b flex items-center justify-between"
                          style={{ 
                            backgroundColor: 'rgba(245, 183, 0, 0.1)',
                            borderColor: '#F5B700'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {additionalMatch.nomor_partai && (
                              <span 
                                className="text-xs px-2.5 py-1 rounded-full font-bold shadow-sm"
                                style={{ backgroundColor: '#F5B700', color: 'white' }}
                              >
                                No. Partai: {additionalMatch.nomor_partai}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {additionalMatch.tanggal_pertandingan && (
                              <span className="text-xs flex items-center gap-1" style={{ color: '#050505', opacity: 0.7 }}>
                                {new Date(additionalMatch.tanggal_pertandingan).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                            <button
                              onClick={() => setEditingMatch(additionalMatch)}
                              className="p-1.5 rounded-lg hover:bg-black/5 transition-all"
                            >
                              <Edit3 size={14} style={{ color: '#050505', opacity: 0.6 }} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Participant A (BYE Participant) */}
                          <div 
                            className={`relative rounded-lg border-2 p-3 transition-all ${
                              additionalMatch.skor_a > additionalMatch.skor_b && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0)
                                ? 'border-yellow-400 bg-yellow-50/50' 
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            {additionalMatch.peserta_a ? (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span 
                                      className="font-bold text-base truncate"
                                      style={{ color: '#3B82F6' }}
                                    >
                                      {getParticipantName(additionalMatch.peserta_a)}
                                    </span>
                                    <span 
                                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                                      style={{ backgroundColor: '#990D35', color: 'white' }}
                                    >
                                      BYE
                                    </span>
                                  </div>
                                  <p className="text-xs uppercase truncate pl-0.5" style={{ color: '#3B82F6', opacity: 0.7 }}>
                                    {getDojoName(additionalMatch.peserta_a)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {additionalMatch.skor_a > additionalMatch.skor_b && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <span 
                                      className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                      style={{ backgroundColor: '#F5B700', color: 'white' }}
                                    >
                                      🏆 GOLD
                                    </span>
                                  )}
                                  {additionalMatch.skor_a < additionalMatch.skor_b && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <span 
                                      className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                      style={{ backgroundColor: '#C0C0C0', color: 'white' }}
                                    >
                                      🥈 SILVER
                                    </span>
                                  )}
                                  {(additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                                      style={{ 
                                        backgroundColor: additionalMatch.skor_a > additionalMatch.skor_b ? '#22c55e' : '#e5e7eb',
                                        color: additionalMatch.skor_a > additionalMatch.skor_b ? 'white' : '#6b7280'
                                      }}
                                    >
                                      {additionalMatch.skor_a}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <span className="text-sm font-medium" style={{ color: '#050505', opacity: 0.4 }}>
                                  TBD
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Participant B (Loser from Last Match) */}
                          <div 
                            className={`relative rounded-lg border-2 p-3 transition-all ${
                              additionalMatch.skor_b > additionalMatch.skor_a && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0)
                                ? 'border-yellow-400 bg-yellow-50/50' 
                                : additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0
                                ? 'border-gray-300 bg-gray-50/30'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            {additionalMatch.peserta_b ? (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span 
                                      className="font-bold text-base truncate"
                                      style={{ color: '#EF4444' }}
                                    >
                                      {getParticipantName(additionalMatch.peserta_b)}
                                    </span>
                                    <span 
                                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ backgroundColor: '#EF4444', color: 'white' }}
                                    >
                                      from Match {round1Matches.length}
                                    </span>
                                  </div>
                                  <p className="text-xs uppercase truncate pl-0.5" style={{ color: '#EF4444', opacity: 0.7 }}>
                                    {getDojoName(additionalMatch.peserta_b)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {additionalMatch.skor_b > additionalMatch.skor_a && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <span 
                                      className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                      style={{ backgroundColor: '#F5B700', color: 'white' }}
                                    >
                                      🏆 GOLD
                                    </span>
                                  )}
                                  {additionalMatch.skor_b < additionalMatch.skor_a && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <span 
                                      className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                      style={{ backgroundColor: '#C0C0C0', color: 'white' }}
                                    >
                                      🥈 SILVER
                                    </span>
                                  )}
                                  {(additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0) && (
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm"
                                      style={{ 
                                        backgroundColor: additionalMatch.skor_b > additionalMatch.skor_a ? '#22c55e' : '#e5e7eb',
                                        color: additionalMatch.skor_b > additionalMatch.skor_a ? 'white' : '#6b7280'
                                      }}
                                    >
                                      {additionalMatch.skor_b}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-3 px-4 rounded-lg border-2" style={{ 
                                backgroundColor: 'rgba(245, 183, 0, 0.1)',
                                borderColor: '#F5B700'
                              }}>
                                <span 
                                  className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full"
                                  style={{ 
                                    backgroundColor: '#990D35', 
                                    color: 'white' 
                                  }}
                                >
                                  ⏳ Waiting for Match {round1Matches.length} Result
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
            </div>

            {/* RIGHT: Leaderboard */}
            <div className="lg:sticky lg:top-6 lg:self-start" ref={leaderboardRef}>
              <div className="bg-white rounded-lg shadow-lg border-2" style={{ borderColor: '#990D35' }}>
                <div className="p-6 border-b" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: '#990D35' }}>
                  <div className="flex items-center gap-3 justify-center">
                    <Trophy size={28} style={{ color: '#990D35' }} />
                    <h3 className="text-2xl font-bold" style={{ color: '#990D35' }}>
                      LEADERBOARD
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {leaderboard && leaderboard.gold.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5B700' }}>
                          <span className="text-lg">🥇</span>
                        </div>
                        <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                          GOLD MEDALS
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {leaderboard.gold.map((participant, idx) => (
                          <div key={participant.id} className="p-3 rounded-lg border-2" style={{ 
                            backgroundColor: 'rgba(245, 183, 0, 0.1)', 
                            borderColor: '#F5B700' 
                          }}>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold" style={{ color: '#F5B700' }}>
                                {idx + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                  {participant.name}
                                </p>
                                <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                  {participant.dojo}
                                </p>
                              </div>
                              <Trophy size={20} style={{ color: '#F5B700' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {leaderboard && leaderboard.silver.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C0C0C0' }}>
                          <span className="text-lg">🥈</span>
                        </div>
                        <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                          SILVER MEDALS
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {leaderboard.silver.map((participant, idx) => (
                          <div key={participant.id} className="p-3 rounded-lg border" style={{ 
                            backgroundColor: 'rgba(192, 192, 192, 0.1)', 
                            borderColor: '#C0C0C0' 
                          }}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold" style={{ color: '#6b7280' }}>
                                {idx + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                  {participant.name}
                                </p>
                                <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
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
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#CD7F32' }}>
                          <span className="text-lg">🥉</span>
                        </div>
                        <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                          BRONZE MEDALS
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {leaderboard.bronze.map((participant, idx) => (
                          <div key={participant.id} className="p-3 rounded-lg border" style={{ 
                            backgroundColor: 'rgba(205, 127, 50, 0.1)', 
                            borderColor: '#CD7F32' 
                          }}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold" style={{ color: '#CD7F32' }}>
                                {idx + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                  {participant.name}
                                </p>
                                <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
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
                    <div className="text-center py-8">
                      <Trophy size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-3" />
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
                className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
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
                        <p className="font-bold text-base mb-1 break-words" style={{ color: '#050505' }}>
                          {getParticipantName(peserta)}
                        </p>
                        <p 
                          className="text-sm break-words" 
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
              {/* METADATA SECTION - ALWAYS EDITABLE */}
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

              {/* SCORE SECTION - OPTIONAL */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold" style={{ color: '#050505' }}>
                    Hasil Pertandingan 
                  </label>
                </div>

                {editingMatch.peserta_a && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">
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
                    <label className="block text-sm font-medium mb-2">
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