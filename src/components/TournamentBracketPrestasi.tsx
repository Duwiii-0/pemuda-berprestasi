import React, { useState, useEffect } from 'react';
import { Trophy, Edit3, ArrowLeft, AlertTriangle, RefreshCw, Download, Shuffle, CheckCircle } from 'lucide-react';
import { exportBracketFromData } from '../utils/exportBracketPDF';
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
  positionY?: number;    
  verticalCenter?: number;          
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

interface TournamentBracketPrestasiProps {
  kelasData: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
}

const TournamentBracketPrestasi: React.FC<TournamentBracketPrestasiProps> = ({ 
  kelasData, 
  onBack,
  apiBaseUrl = '/api',
}) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null);
  
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

const CARD_WIDTH = 280;
const CARD_HEIGHT = 140;
const ROUND_GAP = 120;
const BASE_VERTICAL_GAP = 60;
const CENTER_GAP = 120;

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
    // Get bracket element
    const bracketElement = bracketRef.current;

    if (!bracketElement) {
      throw new Error('Bracket element not found');
    }

    // ✅ FIXED: Gunakan fungsi yang benar dengan parameter yang tepat
    await exportBracketFromData(kelasData, bracketElement);

    showNotification(
      'success',
      'Berhasil!',
      'PDF bracket PRESTASI berhasil didownload!',
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

  const approvedParticipants = kelasData.peserta_kompetisi.filter(p => p.status === 'APPROVED');

  useEffect(() => {
    if (kelasData?.kompetisi?.id_kompetisi) {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;
      
      console.log(`🔄 Loading PRESTASI bracket for kelas ${kelasKejuaraanId}...`);
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
      console.log('📊 PRESTASI Bracket data fetched:', result);

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
        console.log(`✅ Loaded ${transformedMatches.length} PRESTASI matches`);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching PRESTASI bracket:', error);
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
    
    console.log('🏆 PRESTASI: Auto-generating bracket');
    
    setLoading(true);
    setShowParticipantPreview(false);
    
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
          byeParticipantIds: []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate bracket');
      }

      const result = await response.json();
      console.log('✅ PRESTASI Bracket generated:', result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);
      
      showNotification(
        'success',
        'Berhasil!',
        'Bracket berhasil dibuat secara otomatis!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error generating PRESTASI bracket:', error);
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
    
    console.log('🔀 Shuffling PRESTASI bracket...');
    
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
          isPemula: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.message?.includes('Bagan sudah dibuat')) {
          const deleteResponse = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              }
            }
          );
          
          if (!deleteResponse.ok) {
            throw new Error('Failed to delete existing bracket');
          }
          
          const retryResponse = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              },
              body: JSON.stringify({
                kelasKejuaraanId: kelasKejuaraanId
              })
            }
          );
          
          if (!retryResponse.ok) {
            throw new Error('Failed to regenerate bracket');
          }
        } else {
          throw new Error(errorData.message || 'Failed to shuffle bracket');
        }
      }

      await fetchBracketData(kompetisiId, kelasKejuaraanId);
      
      showNotification(
        'success',
        'Berhasil!',
        'Bracket berhasil diacak ulang dengan BYE baru!',
        () => setShowModal(false)
      );
      
    } catch (error: any) {
      console.error('❌ Error shuffling PRESTASI bracket:', error);
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

  const getTotalRounds = (): number => {
    if (matches.length > 0) {
      return Math.max(...matches.map(m => m.ronde));
    }
    
    if (approvedParticipants.length < 4) return 0;
    
    let rounds = 2;
    
    if (approvedParticipants.length >= 8) {
      rounds++;
      
      if (approvedParticipants.length > 8) {
        rounds++;
      }
    } else if (approvedParticipants.length > 4) {
      rounds++;
    }
    
    return rounds;
  };

  const getRoundName = (round: number, totalRounds: number): string => {
    const fromEnd = totalRounds - round;
    
    switch (fromEnd) {
      case 0: 
        return 'Final';
      case 1: 
        return 'Semi Final';
      case 2: 
        if (totalRounds >= 3) {
          if (approvedParticipants.length >= 8) {
            return 'Quarter Final';
          }
        }
        return 'Round 1';
      case 3:
        if (approvedParticipants.length >= 16) {
          return 'Round of 16';
        }
        return 'Round 1';
      default: 
        return `Round ${round}`;
    }
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.ronde === round);
  };

  const generatePrestasiLeaderboard = () => {
    if (matches.length === 0) return null;

    const leaderboard: {
      first: { name: string; dojo: string; id: number } | null;
      second: { name: string; dojo: string; id: number } | null;
      third: { name: string; dojo: string; id: number }[];
    } = {
      first: null,
      second: null,
      third: []
    };

    const totalRounds = getTotalRounds();
    
    const finalMatch = matches.find(m => m.ronde === totalRounds);
    
    if (finalMatch && (finalMatch.skor_a > 0 || finalMatch.skor_b > 0)) {
      const winner = finalMatch.skor_a > finalMatch.skor_b 
        ? finalMatch.peserta_a 
        : finalMatch.peserta_b;
      
      const loser = finalMatch.skor_a > finalMatch.skor_b 
        ? finalMatch.peserta_b 
        : finalMatch.peserta_a;
      
      if (winner) {
        leaderboard.first = {
          name: getParticipantName(winner),
          dojo: getDojoName(winner),
          id: winner.id_peserta_kompetisi
        };
      }
      
      if (loser) {
        leaderboard.second = {
          name: getParticipantName(loser),
          dojo: getDojoName(loser),
          id: loser.id_peserta_kompetisi
        };
      }
    }

    const semiRound = totalRounds - 1;
    const semiMatches = matches.filter(m => m.ronde === semiRound);
    
    semiMatches.forEach(match => {
      if (match.skor_a > 0 || match.skor_b > 0) {
        const loser = match.skor_a > match.skor_b 
          ? match.peserta_b 
          : match.peserta_a;
        
        if (loser) {
          const participant = {
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loser.id_peserta_kompetisi
          };
          
          if (!leaderboard.third.find(p => p.id === participant.id)) {
            leaderboard.third.push(participant);
          }
        }
      }
    });

    return leaderboard;
  };

// 🔗 Fungsi menggambar konektor antar round
const renderConnectorLines = (
  matchesBySide: Match[][],
  roundGap: number,
  side: 'left' | 'right'
) => {
  const lines: React.ReactNode[] = [];

  for (let roundIdx = 0; roundIdx < matchesBySide.length - 1; roundIdx++) {
    const currentRound = matchesBySide[roundIdx];
    const nextRound = matchesBySide[roundIdx + 1];

    for (let matchIdx = 0; matchIdx < currentRound.length; matchIdx++) {
      const match = currentRound[matchIdx];

      const nextIdx = Math.floor(matchIdx / 2);
      const parentMatch = nextRound[nextIdx];
      if (!match || !parentMatch) continue;

      const fromX = roundIdx * roundGap + CARD_WIDTH;
      const fromY = match.verticalCenter ?? 0;
      const toX = (roundIdx + 1) * roundGap;
      const toY = parentMatch.verticalCenter ?? 0;

      const direction = side === 'right' ? -1 : 1;
      const offset = 20 * direction;

      lines.push(
        <line
          key={`${side}-connector-${roundIdx}-${matchIdx}`}
          x1={fromX + offset}
          y1={fromY}
          x2={toX - offset}
          y2={toY}
          stroke="#aaa"
          strokeWidth="2"
        />
      );

      console.log(
        `Connector ${side}: Round ${roundIdx + 1} Match ${matchIdx + 1} → Round ${
          roundIdx + 2
        } Match ${nextIdx + 1}`
      );
    }
  }

  return lines;
};


/**
 * 🆕 Render single match card
 */
const renderMatchCard = (match: Match, key: string | number) => {
  const hasScores = match.skor_a > 0 || match.skor_b > 0;
  const winner = hasScores 
    ? (match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b)
    : null;
  
return (
  <div
    className="match-card bg-white rounded-xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all"
    style={{ 
      borderColor: winner ? '#22c55e' : '#990D35',
      width: `${CARD_WIDTH}px`,
      minHeight: `${CARD_HEIGHT}px`,
      position: 'relative',    // ✅ TAMBAH
      zIndex: 10,              // ✅ TAMBAH - Above connectors
      background: 'white'      // ✅ TAMBAH - Solid background
    }}
  >
      {/* Header */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: 'rgba(153, 13, 53, 0.05)',
          borderColor: '#990D35'
        }}
      >
        <div className="flex items-center gap-2">
          {match.nomor_partai && (
            <span 
              className="text-xs px-2 py-1 rounded-full font-bold"
              style={{ backgroundColor: '#990D35', color: 'white' }}
            >
              {match.nomor_partai}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {match.tanggal_pertandingan && (
            <span className="text-xs" style={{ color: '#050505', opacity: 0.7 }}>
              {new Date(match.tanggal_pertandingan).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short'
              })}
            </span>
          )}
          <button
            onClick={() => setEditingMatch(match)}
            className="p-1 rounded hover:bg-black/5"
          >
            <Edit3 size={12} style={{ color: '#050505', opacity: 0.6 }} />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="flex flex-col">
        {/* Participant A */}
        <div 
          className={`flex-1 px-3 py-2 border-b flex items-center justify-between gap-2 ${
            match.skor_a > match.skor_b && hasScores
              ? 'bg-gradient-to-r from-green-50 to-green-100' 
              : ''
          }`}
          style={{ minHeight: '70px' }}
        >
          {match.peserta_a ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight truncate" style={{ color: '#050505' }}>
                  {getParticipantName(match.peserta_a)}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: '#3B82F6', opacity: 0.7 }}>
                  {getDojoName(match.peserta_a)}
                </p>
              </div>
              {hasScores && (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm"
                  style={{ 
                    backgroundColor: match.skor_a > match.skor_b ? '#22c55e' : '#e5e7eb',
                    color: match.skor_a > match.skor_b ? 'white' : '#6b7280'
                  }}
                >
                  {match.skor_a}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400 w-full text-center">TBD</span>
          )}
        </div>

        {/* Participant B */}
        <div 
          className={`flex-1 px-3 py-2 flex items-center justify-between gap-2 ${
            match.skor_b > match.skor_a && hasScores
              ? 'bg-gradient-to-r from-green-50 to-green-100' 
              : ''
          }`}
          style={{ minHeight: '70px' }}
        >
          {match.peserta_b ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight truncate" style={{ color: '#050505' }}>
                  {getParticipantName(match.peserta_b)}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: '#EF4444', opacity: 0.7 }}>
                  {getDojoName(match.peserta_b)}
                </p>
              </div>
              {hasScores && (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm"
                  style={{ 
                    backgroundColor: match.skor_b > match.skor_a ? '#22c55e' : '#e5e7eb',
                    color: match.skor_b > match.skor_a ? 'white' : '#6b7280'
                  }}
                >
                  {match.skor_b}
                </div>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center">
              {match.ronde === 1 ? (
                <span 
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(245, 183, 0, 0.15)', color: '#F5B700' }}
                >
                  BYE
                </span>
              ) : (
                <span 
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(192, 192, 192, 0.15)', color: '#6b7280' }}
                >
                  TBD
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
);
}

/**
 * 🎯 Calculate vertical positions for all rounds
 * Setiap round berikutnya berada TEPAT di tengah 2 parent match
 */
// 🧩 Fungsi untuk menghitung posisi vertikal setiap match di tiap ronde
const calculateVerticalPositions = (matchesBySide: Match[][]) => {
  if (matchesBySide.length === 0) return [];

  // positions[n][m] = posisi Y match ke-m di round ke-n
  const positions: number[][] = [];

  // 🧱 Round 1 (pertama) — pakai spacing dasar antar card
  const round1Count = matchesBySide[0].length;
  positions[0] = [];

  console.log(`📐 Calculating positions for ${round1Count} matches in Round 1...`);

  for (let i = 0; i < round1Count; i++) {
    const yPos = i * (CARD_HEIGHT + BASE_VERTICAL_GAP);
    positions[0].push(yPos);

    // ✅ Tambahan penting: simpan posisi vertikal di object match
    if (matchesBySide[0][i]) {
      matchesBySide[0][i].positionY = yPos;
      matchesBySide[0][i].verticalCenter = yPos + CARD_HEIGHT / 2;
    }

    console.log(`  Match ${i + 1}: Y = ${yPos}px`);
  }

  // 🌀 Round berikutnya — posisi = titik tengah vertikal dari 2 parent match
  for (let roundIdx = 1; roundIdx < matchesBySide.length; roundIdx++) {
    positions[roundIdx] = [];
    const currentRoundMatches = matchesBySide[roundIdx];
    const prevRoundMatches = matchesBySide[roundIdx - 1];

    console.log(`\n📐 Calculating positions for ${currentRoundMatches.length} matches in Round ${roundIdx + 1}...`);

    for (let matchIdx = 0; matchIdx < currentRoundMatches.length; matchIdx++) {
      const parent1Idx = matchIdx * 2;
      const parent2Idx = matchIdx * 2 + 1;

      const parent1Y = positions[roundIdx - 1][parent1Idx];
      const parent2Y = positions[roundIdx - 1][parent2Idx];

      if (parent1Y === undefined) {
        console.warn(`  ⚠️ Warning: parent1Y undefined for match ${matchIdx + 1}`);
        continue;
      }

      // 🧩 Handle BYE (jika hanya satu parent)
      const effectiveParent2Y = parent2Y !== undefined ? parent2Y : parent1Y;

      // 💡 Titik tengah vertikal antar dua parent
      const centerY =
        (parent1Y + effectiveParent2Y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;

      positions[roundIdx].push(centerY);

      // ✅ Tambahan penting: simpan posisi ke object match
      if (currentRoundMatches[matchIdx]) {
        currentRoundMatches[matchIdx].positionY = centerY;
        currentRoundMatches[matchIdx].verticalCenter = centerY + CARD_HEIGHT / 2;
      }

      console.log(`  Match ${matchIdx + 1}:`);
      console.log(`    Parent 1 Y: ${parent1Y.toFixed(2)}px`);
      console.log(`    Parent 2 Y: ${effectiveParent2Y.toFixed(2)}px`);
      console.log(`    Calculated Center Y: ${centerY.toFixed(2)}px`);
    }
  }

  // 📤 Return hasil posisi untuk referensi eksternal (opsional)
  return positions;
};


/**
 * 🎯 Calculate bracket container height
 */
const calculateBracketHeight = (matchesBySide: Match[][]) => {
  if (matchesBySide.length === 0 || matchesBySide[0].length === 0) return 800;
  
  const round1Count = matchesBySide[0].length;
  const totalHeight = (round1Count * CARD_HEIGHT) + ((round1Count - 1) * BASE_VERTICAL_GAP);
  
  return Math.max(totalHeight + 200, 800); // Minimal 800px
};

/**
 * 🆕 Render CENTER FINAL Match
 */
const renderCenterFinal = () => {
  const finalMatch = getFinalMatch();
  const leftMatches = getLeftMatches();
  const rightMatches = getRightMatches();
  
  // Calculate positions
  const leftPositions = calculateVerticalPositions(leftMatches);
  const rightPositions = calculateVerticalPositions(rightMatches);
  
  // Get semi-final Y positions
  const leftSemiY = leftPositions[leftPositions.length - 1]?.[0] || 0;
  const rightSemiY = rightPositions[rightPositions.length - 1]?.[0] || 0;
  
  // Final Y position = rata-rata dari kedua semi-final
  const finalYPosition = (leftSemiY + rightSemiY) / 2;
  const lineLength = CENTER_GAP / 2;
  
  return (
    <div 
      style={{ 
        position: 'relative',
        width: `${CARD_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Round Header */}
      <div 
        className="round-header"
        style={{
          width: `${CARD_WIDTH}px`,
          marginBottom: '20px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 20,
          background: '#F5FBEF',
          padding: '8px 12px'
        }}
      >
        <div 
          className="px-4 py-2 rounded-lg font-bold text-sm shadow-md"
          style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
        >
          Final
        </div>
        <div className="text-xs mt-1" style={{ color: '#050505', opacity: 0.6 }}>
          Championship Match
        </div>
      </div>

      {/* Container untuk card + connectors */}
      <div style={{ position: 'relative', width: '100%', minHeight: '600px' }}>
{/* 🔗 LEFT CONNECTOR ke Final */}
<svg
  style={{
    position: 'absolute',
    left: -lineLength,
    top: `${finalYPosition + (CARD_HEIGHT / 2)}px`,  // ✅ HAPUS +80
    width: lineLength,
    height: 2,
    pointerEvents: 'none',
    zIndex: 5
  }}
>
          <line 
            x1="0" 
            y1="0" 
            x2={lineLength} 
            y2="0" 
            stroke="#990D35" 
            strokeWidth="2.5" 
            opacity="0.8" 
          />
        </svg>
        
{/* 🔗 RIGHT CONNECTOR ke Final */}
<svg
  style={{
    position: 'absolute',
    right: -lineLength,
    top: `${finalYPosition + (CARD_HEIGHT / 2)}px`,  // ✅ HAPUS +80
    width: lineLength,
    height: 2,
    pointerEvents: 'none',
    zIndex: 5
  }}
>
          <line 
            x1="0" 
            y1="0" 
            x2={lineLength} 
            y2="0" 
            stroke="#990D35" 
            strokeWidth="2.5" 
            opacity="0.8" 
          />
        </svg>
        
{/* Final Match Card */}
<div
  style={{
    position: 'absolute',
    top: `${finalYPosition}px`,  // ✅ HAPUS +80
    left: 0,
    width: `${CARD_WIDTH}px`
  }}
>
          {finalMatch ? (
            renderMatchCard(finalMatch, `final-${finalMatch.id_match}`)
          ) : (
            <div 
              className="w-full p-6 rounded-xl border-2 text-center"
              style={{ borderColor: '#990D35', backgroundColor: 'rgba(153, 13, 53, 0.05)' }}
            >
              <Trophy size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                Waiting for finalists
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🧩 Kode perbaikan fungsi renderBracketSide
const renderBracketSide = (
  matchesBySide: Match[][],
  side: 'left' | 'right',
  startRound: number = 1
) => {
  const isRight = side === 'right';
  const totalRounds = getTotalRounds();

  // ✅ Hitung semua posisi vertikal untuk tiap match
  const verticalPositions = calculateVerticalPositions(matchesBySide);

  // ✅ Pastikan nilai tidak undefined sebelum dihitung
  const validY = verticalPositions.flat().filter((y): y is number => y !== undefined);
  const maxY = (validY.length > 0 ? Math.max(...validY) : 0) + CARD_HEIGHT + 100;

  return (
    <div
      className="bracket-side"
      style={{
        display: 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: `${ROUND_GAP}px`,
        position: 'relative',
        minHeight: `${maxY}px`,
      }}
    >
      {matchesBySide.map((roundMatches, roundIndex) => {
        if (roundMatches.length === 0) return null;

        const actualRound = startRound + roundIndex;
        const roundName = getRoundName(actualRound, totalRounds);
        const matchCount = roundMatches.length;
        const hasNextRound =
          roundIndex < matchesBySide.length - 1 && matchesBySide[roundIndex + 1].length > 0;

        return (
          <div
            key={`${side}-round-${actualRound}`}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: `${maxY}px`,
            }}
          >
            {/* 🏷️ Round Header */}
            <div
              className="round-header"
              style={{
                width: `${CARD_WIDTH}px`,
                marginBottom: '20px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 20,
                background: '#F5FBEF',
                padding: '8px 12px',
              }}
            >
              <div
                className="px-4 py-2 rounded-lg font-bold text-sm shadow-md"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                {roundName}
              </div>
              <div className="text-xs mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                {matchCount} {matchCount === 1 ? 'Match' : 'Matches'}
              </div>
            </div>

            {/* 🎮 Container untuk match cards dan connector */}
            <div
              style={{
                position: 'relative',
                width: `${CARD_WIDTH}px`,
                height: `${maxY}px`,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              {/* ============================================
                    🔗 RENDER CONNECTORS (Garis penghubung)
                  ============================================ */}
              {hasNextRound &&
                roundMatches.map((match, matchIndex) => {
                  const yPosition = verticalPositions[roundIndex]?.[matchIndex];
                  if (yPosition === undefined) return null;

                  const cardCenterY = yPosition + CARD_HEIGHT / 2;
                  const isFirstInPair = matchIndex % 2 === 0;
                  const hasPartner = matchIndex + 1 < matchCount;
                  const partnerY = hasPartner
                    ? verticalPositions[roundIndex]?.[matchIndex + 1]
                    : undefined;
                  const targetMatchIdx = Math.floor(matchIndex / 2);
                  const targetY = verticalPositions[roundIndex + 1]?.[targetMatchIdx];

                  return (
                    <React.Fragment key={`connectors-${match.id_match}`}>
                      {/* 1️⃣ Horizontal line */}
                      <svg
                        style={{
                          position: 'absolute',
                          left: isRight ? `-${ROUND_GAP / 2}px` : `${CARD_WIDTH}px`,
                          top: `${cardCenterY - 1}px`,
                          width: ROUND_GAP / 2,
                          height: 2,
                          pointerEvents: 'none',
                          zIndex: 5,
                          overflow: 'visible',
                        }}
                      >
                        <line
                          x1={isRight ? ROUND_GAP / 2 : 0}
                          y1="1"
                          x2={isRight ? 0 : ROUND_GAP / 2}
                          y2="1"
                          stroke="#990D35"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      </svg>

                      {/* 2️⃣ Vertical line */}
                      {isFirstInPair && targetY !== undefined && (() => {
                        const targetCenterY = targetY + CARD_HEIGHT / 2;
                        const y1 = cardCenterY;
                        const y2 =
                          hasPartner && partnerY !== undefined
                            ? partnerY + CARD_HEIGHT / 2
                            : cardCenterY;
                        const y3 = targetCenterY;

                        const minY = Math.min(y1, y2, y3);
                        const maxY = Math.max(y1, y2, y3);
                        const svgHeight = maxY - minY;
                        const lineX = isRight
                          ? -(ROUND_GAP / 2)
                          : CARD_WIDTH + ROUND_GAP / 2;

                        return (
                          <svg
                            key={`vertical-${matchIndex}`}
                            style={{
                              position: 'absolute',
                              left: `${lineX}px`,
                              top: `${minY}px`,
                              width: 2,
                              height: svgHeight,
                              pointerEvents: 'none',
                              zIndex: 4,
                              overflow: 'visible',
                            }}
                          >
                            <line
                              x1="1"
                              y1={y1 - minY}
                              x2="1"
                              y2={y3 - minY}
                              stroke="#990D35"
                              strokeWidth="2"
                              opacity="0.8"
                            />
                            {hasPartner && partnerY !== undefined && (
                              <line
                                x1="1"
                                y1={y2 - minY}
                                x2="1"
                                y2={y3 - minY}
                                stroke="#990D35"
                                strokeWidth="2"
                                opacity="0.8"
                              />
                            )}
                          </svg>
                        );
                      })()}
                    </React.Fragment>
                  );
                })}

              {/* ============================================
                  🧩 RENDER MATCH CARDS (Di atas garis)
                  ============================================ */}
              {roundMatches.map((match, matchIndex) => {
                const yPosition = verticalPositions[roundIndex]?.[matchIndex];
                if (yPosition === undefined) return null;

                return (
                  <div
                    key={`card-${match.id_match}`}
                    style={{
                      position: 'absolute',
                      top: `${yPosition}px`,
                      left: 0,
                      width: `${CARD_WIDTH}px`,
                      zIndex: 10,
                    }}
                  >
                    {renderMatchCard(match, match.id_match)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const debugCardPositions = () => {
/**
 * Debug: Print bracket structure
 */
const debugBracketStructure = () => {
  console.log('\n🏆 ===== BRACKET STRUCTURE DEBUG =====');
  console.log('Total Matches:', matches.length);
  console.log('Total Rounds:', getTotalRounds());
  console.log('Approved Participants:', approvedParticipants.length);
  
  const totalRounds = getTotalRounds();
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = getMatchesByRound(round);
    console.log(`\n📍 Round ${round} (${getRoundName(round, totalRounds)}):`);
    console.log(`  - Match count: ${roundMatches.length}`);
    roundMatches.forEach((match, idx) => {
      console.log(`  - Match ${idx + 1}:`, {
        id: match.id_match,
        participantA: getParticipantName(match.peserta_a) || 'TBD',
        participantB: getParticipantName(match.peserta_b) || 'BYE/TBD',
        scores: `${match.skor_a} - ${match.skor_b}`
      });
    });
  }
  console.log('=====================================\n');
};

/**
 * Debug: Print split structure (left/right/final)
 */
const debugSplitStructure = () => {
  console.log('\n🔀 ===== SPLIT STRUCTURE DEBUG =====');
  
  const leftMatches = getLeftMatches();
  const rightMatches = getRightMatches();
  const finalMatch = getFinalMatch();
  
  console.log('\n📍 LEFT SIDE:');
  leftMatches.forEach((roundMatches, roundIdx) => {
    console.log(`  Round ${roundIdx + 1}: ${roundMatches.length} matches`);
    roundMatches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}: ID ${match.id_match}`);
    });
  });
  
  console.log('\n📍 RIGHT SIDE:');
  rightMatches.forEach((roundMatches, roundIdx) => {
    console.log(`  Round ${roundIdx + 1}: ${roundMatches.length} matches`);
    roundMatches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}: ID ${match.id_match}`);
    });
  });
  
  console.log('\n📍 FINAL:');
  if (finalMatch) {
    console.log(`  Match ID: ${finalMatch.id_match}`);
    console.log(`  Participant A: ${getParticipantName(finalMatch.peserta_a) || 'TBD'}`);
    console.log(`  Participant B: ${getParticipantName(finalMatch.peserta_b) || 'TBD'}`);
  } else {
    console.log('  No final match yet');
  }
  
  console.log('=====================================\n');
};

/**
 * Debug: Print vertical positions calculation
 */
const debugVerticalPositions = () => {
  console.log('\n📐 ===== VERTICAL POSITIONS DEBUG =====');
  
  const leftMatches = getLeftMatches();
  const rightMatches = getRightMatches();
  
  console.log('\n📍 LEFT SIDE POSITIONS:');
  const leftPositions = calculateVerticalPositions(leftMatches);
  leftPositions.forEach((roundPositions, roundIdx) => {
    console.log(`\n  Round ${roundIdx + 1}:`);
    roundPositions.forEach((yPos, matchIdx) => {
      console.log(`    Match ${matchIdx + 1}: Y = ${yPos.toFixed(2)}px`);
    });
  });
  
  console.log('\n📍 RIGHT SIDE POSITIONS:');
  const rightPositions = calculateVerticalPositions(rightMatches);
  rightPositions.forEach((roundPositions, roundIdx) => {
    console.log(`\n  Round ${roundIdx + 1}:`);
    roundPositions.forEach((yPos, matchIdx) => {
      console.log(`    Match ${matchIdx + 1}: Y = ${yPos.toFixed(2)}px`);
    });
  });
  
  // Check symmetry
  console.log('\n🔍 SYMMETRY CHECK:');
  const leftFinalY = leftPositions[leftPositions.length - 1]?.[0] || 0;
  const rightFinalY = rightPositions[rightPositions.length - 1]?.[0] || 0;
  console.log(`  Left Semi-Final Y: ${leftFinalY.toFixed(2)}px`);
  console.log(`  Right Semi-Final Y: ${rightFinalY.toFixed(2)}px`);
  console.log(`  Difference: ${Math.abs(leftFinalY - rightFinalY).toFixed(2)}px`);
  console.log(`  Is Symmetric: ${Math.abs(leftFinalY - rightFinalY) < 1 ? '✅ YES' : '❌ NO'}`);
  
  console.log('=====================================\n');
};

/**
 * Debug: Print connector lines calculation
 */
const debugConnectorLines = () => {
  console.log('\n🔗 ===== CONNECTOR LINES DEBUG =====');
  
  const leftMatches = getLeftMatches();
  const leftPositions = calculateVerticalPositions(leftMatches);
  
  console.log('\n📍 LEFT SIDE CONNECTORS:');
  for (let roundIdx = 0; roundIdx < leftMatches.length - 1; roundIdx++) {
    const currentRound = leftMatches[roundIdx];
    const nextRoundPositions = leftPositions[roundIdx + 1];
    
    console.log(`\n  From Round ${roundIdx + 1} to Round ${roundIdx + 2}:`);
    
    for (let matchIdx = 0; matchIdx < currentRound.length; matchIdx += 2) {
      const match1Y = leftPositions[roundIdx][matchIdx];
      const match2Y = leftPositions[roundIdx][matchIdx + 1];
      const targetY = nextRoundPositions[Math.floor(matchIdx / 2)];
      
      console.log(`    Pair ${Math.floor(matchIdx / 2) + 1}:`);
      console.log(`      Match ${matchIdx + 1} Y: ${match1Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Match ${matchIdx + 2} Y: ${match2Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Target Next Round Y: ${targetY?.toFixed(2) || 'N/A'}px`);
      
      if (match1Y !== undefined && match2Y !== undefined && targetY !== undefined) {
        const expectedTargetY = (match1Y + match2Y + CARD_HEIGHT) / 2 - (CARD_HEIGHT / 2);
        console.log(`      Expected Target Y: ${expectedTargetY.toFixed(2)}px`);
        console.log(`      Difference: ${Math.abs(targetY - expectedTargetY).toFixed(2)}px`);
        console.log(`      Is Correct: ${Math.abs(targetY - expectedTargetY) < 1 ? '✅ YES' : '❌ NO'}`);
      }
    }
  }
  
  console.log('=====================================\n');
};

/**
 * Debug: Print bracket dimensions
 */
const debugBracketDimensions = () => {
  console.log('\n📏 ===== BRACKET DIMENSIONS DEBUG =====');
  console.log('Constants:');
  console.log(`  CARD_WIDTH: ${CARD_WIDTH}px`);
  console.log(`  CARD_HEIGHT: ${CARD_HEIGHT}px`);
  console.log(`  ROUND_GAP: ${ROUND_GAP}px`);
  console.log(`  BASE_VERTICAL_GAP: ${BASE_VERTICAL_GAP}px`);
  console.log(`  CENTER_GAP: ${CENTER_GAP}px`);
  
  const leftMatches = getLeftMatches();
  const rightMatches = getRightMatches();
  const totalRounds = getTotalRounds();
  
  console.log('\nCalculated Dimensions:');
  console.log(`  Total Rounds: ${totalRounds}`);
  console.log(`  Left Bracket Rounds: ${leftMatches.length}`);
  console.log(`  Right Bracket Rounds: ${rightMatches.length}`);
  console.log(`  Total Width: ${((totalRounds - 1) * (CARD_WIDTH + ROUND_GAP) * 2) + CARD_WIDTH + (CENTER_GAP * 2)}px`);
  console.log(`  Total Height: ${calculateBracketHeight(leftMatches)}px`);
  
  console.log('\nRound 1 Spacing:');
  const round1Count = leftMatches[0]?.length || 0;
  console.log(`  Match Count: ${round1Count}`);
  console.log(`  Gap Between Cards: ${BASE_VERTICAL_GAP}px`);
  console.log(`  Total Height: ${(round1Count * CARD_HEIGHT) + ((round1Count - 1) * BASE_VERTICAL_GAP)}px`);
  
  console.log('=====================================\n');
};

};

const runFullDebug = () => {
  console.clear();
  console.log('🚀 ===== FULL BRACKET DEBUG STARTED =====\n');
  console.log(`Timestamp: ${new Date().toLocaleTimeString()}\n`);
  
  // 1. RAW DATA CHECK
  console.log('📦 ===== RAW DATA CHECK =====');
  console.log('Total matches array length:', matches.length);
  console.log('Bracket generated status:', bracketGenerated);
  console.log('Approved participants:', approvedParticipants.length);
  console.log('\nAll matches by round:');
  const totalRounds = getTotalRounds();
  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = getMatchesByRound(r);
    console.log(`  Round ${r}: ${roundMatches.length} matches`, roundMatches.map(m => m.id_match));
  }
  console.log('=====================================\n');
  
  // 2. SPLIT LOGIC CHECK
  console.log('🔀 ===== SPLIT LOGIC CHECK =====');
  const leftMatches = getLeftMatches();
  const rightMatches = getRightMatches();
  const finalMatch = getFinalMatch();
  
  console.log('\n📍 LEFT SIDE STRUCTURE:');
  console.log(`Total rounds in left: ${leftMatches.length}`);
  leftMatches.forEach((roundMatches, roundIdx) => {
    console.log(`\n  Round ${roundIdx + 1}:`);
    console.log(`    Match count: ${roundMatches.length}`);
    roundMatches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}:`, {
        id: match.id_match,
        round: match.ronde,
        participantA: getParticipantName(match.peserta_a) || 'TBD',
        participantB: getParticipantName(match.peserta_b) || 'BYE/TBD'
      });
    });
  });
  
  console.log('\n📍 RIGHT SIDE STRUCTURE:');
  console.log(`Total rounds in right: ${rightMatches.length}`);
  rightMatches.forEach((roundMatches, roundIdx) => {
    console.log(`\n  Round ${roundIdx + 1}:`);
    console.log(`    Match count: ${roundMatches.length}`);
    roundMatches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}:`, {
        id: match.id_match,
        round: match.ronde,
        participantA: getParticipantName(match.peserta_a) || 'TBD',
        participantB: getParticipantName(match.peserta_b) || 'BYE/TBD'
      });
    });
  });
  
  console.log('\n📍 FINAL MATCH:');
  if (finalMatch) {
    console.log(`  ID: ${finalMatch.id_match}, Round: ${finalMatch.ronde}`);
    console.log(`  Participant A: ${getParticipantName(finalMatch.peserta_a) || 'TBD'}`);
    console.log(`  Participant B: ${getParticipantName(finalMatch.peserta_b) || 'TBD'}`);
  } else {
    console.log('  ❌ No final match found!');
  }
  console.log('=====================================\n');
  
  // 3. VERTICAL POSITIONS DETAILED
  console.log('📐 ===== VERTICAL POSITIONS DETAILED =====');
  
  console.log('\n🔵 LEFT SIDE CALCULATION:');
  const leftPositions = calculateVerticalPositions(leftMatches);
  console.log('Left positions result:', leftPositions);
  
  console.log('\n🔴 RIGHT SIDE CALCULATION:');
  const rightPositions = calculateVerticalPositions(rightMatches);
  console.log('Right positions result:', rightPositions);
  
  // 4. SYMMETRY CHECK
  console.log('\n🔍 ===== SYMMETRY CHECK =====');
  
  // Check if left and right have same structure
  console.log('\nStructure comparison:');
  console.log(`  Left rounds: ${leftMatches.length}`);
  console.log(`  Right rounds: ${rightMatches.length}`);
  console.log(`  Are equal: ${leftMatches.length === rightMatches.length ? '✅' : '❌'}`);
  
  for (let i = 0; i < Math.max(leftMatches.length, rightMatches.length); i++) {
    const leftCount = leftMatches[i]?.length || 0;
    const rightCount = rightMatches[i]?.length || 0;
    console.log(`\n  Round ${i + 1}:`);
    console.log(`    Left matches: ${leftCount}`);
    console.log(`    Right matches: ${rightCount}`);
    console.log(`    Are equal: ${leftCount === rightCount ? '✅' : '❌'}`);
  }
  
  // Check final round positions
  if (leftPositions.length > 0 && rightPositions.length > 0) {
    const lastLeftRound = leftPositions[leftPositions.length - 1];
    const lastRightRound = rightPositions[rightPositions.length - 1];
    
    console.log('\nSemi-Final Y positions:');
    console.log(`  Left Semi Y: ${lastLeftRound[0]?.toFixed(2) || 'N/A'}px`);
    console.log(`  Right Semi Y: ${lastRightRound[0]?.toFixed(2) || 'N/A'}px`);
    
    if (lastLeftRound[0] !== undefined && lastRightRound[0] !== undefined) {
      const diff = Math.abs(lastLeftRound[0] - lastRightRound[0]);
      console.log(`  Difference: ${diff.toFixed(2)}px`);
      console.log(`  Is Symmetric: ${diff < 1 ? '✅ YES' : '❌ NO'}`);
    }
  }
  console.log('=====================================\n');
  
  // 5. CONNECTOR VALIDATION
  console.log('🔗 ===== CONNECTOR VALIDATION =====');
  
  console.log('\n🔵 LEFT SIDE CONNECTORS:');
  for (let roundIdx = 0; roundIdx < leftMatches.length - 1; roundIdx++) {
    const currentRound = leftMatches[roundIdx];
    console.log(`\n  Round ${roundIdx + 1} → Round ${roundIdx + 2}:`);
    console.log(`    Source matches: ${currentRound.length}`);
    console.log(`    Target matches: ${leftMatches[roundIdx + 1].length}`);
    console.log(`    Expected pairs: ${Math.ceil(currentRound.length / 2)}`);
    
    // Check each pair
    for (let matchIdx = 0; matchIdx < currentRound.length; matchIdx += 2) {
      const pairNum = Math.floor(matchIdx / 2);
      const match1Y = leftPositions[roundIdx]?.[matchIdx];
      const match2Y = leftPositions[roundIdx]?.[matchIdx + 1];
      const targetY = leftPositions[roundIdx + 1]?.[pairNum];
      
      console.log(`\n    Pair ${pairNum + 1}:`);
      console.log(`      Source Match ${matchIdx + 1} Y: ${match1Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Source Match ${matchIdx + 2} Y: ${match2Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Target Match Y: ${targetY?.toFixed(2) || 'N/A'}px`);
      
      if (match1Y !== undefined && match2Y !== undefined && targetY !== undefined) {
        const expectedY = (match1Y + match2Y + CARD_HEIGHT) / 2 - (CARD_HEIGHT / 2);
        const diff = Math.abs(targetY - expectedY);
        console.log(`      Expected Target Y: ${expectedY.toFixed(2)}px`);
        console.log(`      Difference: ${diff.toFixed(2)}px`);
        console.log(`      Status: ${diff < 1 ? '✅ CORRECT' : '❌ INCORRECT'}`);
      } else {
        console.log(`      Status: ⚠️ MISSING DATA`);
      }
    }
  }
  
  console.log('\n🔴 RIGHT SIDE CONNECTORS:');
  for (let roundIdx = 0; roundIdx < rightMatches.length - 1; roundIdx++) {
    const currentRound = rightMatches[roundIdx];
    console.log(`\n  Round ${roundIdx + 1} → Round ${roundIdx + 2}:`);
    console.log(`    Source matches: ${currentRound.length}`);
    console.log(`    Target matches: ${rightMatches[roundIdx + 1].length}`);
    
    for (let matchIdx = 0; matchIdx < currentRound.length; matchIdx += 2) {
      const pairNum = Math.floor(matchIdx / 2);
      const match1Y = rightPositions[roundIdx]?.[matchIdx];
      const match2Y = rightPositions[roundIdx]?.[matchIdx + 1];
      const targetY = rightPositions[roundIdx + 1]?.[pairNum];
      
      console.log(`\n    Pair ${pairNum + 1}:`);
      console.log(`      Source Match ${matchIdx + 1} Y: ${match1Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Source Match ${matchIdx + 2} Y: ${match2Y?.toFixed(2) || 'N/A'}px`);
      console.log(`      Target Match Y: ${targetY?.toFixed(2) || 'N/A'}px`);
      
      if (match1Y !== undefined && match2Y !== undefined && targetY !== undefined) {
        const expectedY = (match1Y + match2Y + CARD_HEIGHT) / 2 - (CARD_HEIGHT / 2);
        const diff = Math.abs(targetY - expectedY);
        console.log(`      Expected Target Y: ${expectedY.toFixed(2)}px`);
        console.log(`      Difference: ${diff.toFixed(2)}px`);
        console.log(`      Status: ${diff < 1 ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
    }
  }
  console.log('=====================================\n');
  
  // 6. DIMENSIONS SUMMARY
  console.log('📏 ===== DIMENSIONS SUMMARY =====');
  console.log('Constants:');
  console.log(`  CARD_WIDTH: ${CARD_WIDTH}px`);
  console.log(`  CARD_HEIGHT: ${CARD_HEIGHT}px`);
  console.log(`  ROUND_GAP: ${ROUND_GAP}px`);
  console.log(`  BASE_VERTICAL_GAP: ${BASE_VERTICAL_GAP}px`);
  console.log(`  CENTER_GAP: ${CENTER_GAP}px`);
  
  console.log('\nCalculated bracket dimensions:');
  const bracketHeight = calculateBracketHeight(leftMatches);
  console.log(`  Total height: ${bracketHeight}px`);
  console.log(`  Total rounds: ${totalRounds}`);
  console.log(`  Rounds per side: ${totalRounds - 1} (excluding final)`);
  
  console.log('=====================================\n');
  
  // 7. ISSUES DETECTION
  console.log('⚠️ ===== ISSUES DETECTION =====');
  const issues: string[] = [];
  
  // Check structure symmetry
  if (leftMatches.length !== rightMatches.length) {
    issues.push(`❌ Left and right sides have different round counts (${leftMatches.length} vs ${rightMatches.length})`);
  }
  
  // Check match counts per round
  for (let i = 0; i < Math.min(leftMatches.length, rightMatches.length); i++) {
    if (leftMatches[i].length !== rightMatches[i].length) {
      issues.push(`❌ Round ${i + 1} has different match counts (Left: ${leftMatches[i].length}, Right: ${rightMatches[i].length})`);
    }
  }
  
  // Check final match
  if (!finalMatch) {
    issues.push(`❌ Final match is missing!`);
  }
  
  // Check position symmetry
  if (leftPositions.length > 0 && rightPositions.length > 0) {
    const lastLeftY = leftPositions[leftPositions.length - 1]?.[0];
    const lastRightY = rightPositions[rightPositions.length - 1]?.[0];
    
    if (lastLeftY !== undefined && lastRightY !== undefined) {
      const diff = Math.abs(lastLeftY - lastRightY);
      if (diff >= 1) {
        issues.push(`❌ Semi-finals are not aligned (difference: ${diff.toFixed(2)}px)`);
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No issues detected! Bracket structure looks good.');
  } else {
    console.log(`Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`);
    });
  }
  
  console.log('=====================================\n');
  
  console.log('✅ ===== FULL BRACKET DEBUG COMPLETED =====\n');
};

// Panggil debug saat component mount
React.useEffect(() => {
  if (matches.length > 0) {
    debugCardPositions();
  }
}, [matches]);

  const prestasiLeaderboard = generatePrestasiLeaderboard();
  const totalRounds = getTotalRounds();

  const calculateCenterOffset = () => {
  if (matches.length === 0) return 400;
  
  const firstRoundMatches = getMatchesByRound(1).length;
  const baseSpacing = 280;
  const firstRoundHeight = (firstRoundMatches - 1) * baseSpacing + CARD_HEIGHT;
  return (firstRoundHeight / 2) + 200;
};

const centerOffset = calculateCenterOffset();



  // 🆕 STEP 7: Inline styles for bracket
React.useEffect(() => {
  const style = document.createElement('style');
  style.innerHTML = `
    .tournament-layout {
      position: relative;
      z-index: 1;
    }

    .bracket-side {
      position: relative;
      z-index: 2;
    }

    .match-card {
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative !important;  /* ✅ FORCE */
      z-index: 10;
      background: white;
      box-sizing: border-box !important;  /* ✅ FORCE */
    }

    .match-card:hover {
      transform: translateY(-2px) !important;  /* ✅ Only Y translation */
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 15;
    }

    .round-header {
      position: relative;
      z-index: 20;
      background: #F5FBEF;
      padding: 8px 12px;
      box-sizing: border-box !important;  /* ✅ FORCE */
    }

    /* ✅ FORCE no margins/paddings */
    .bracket-side > div {
      margin: 0 !important;
    }

    /* Hide scrollbar but keep functionality */
    .overflow-x-auto::-webkit-scrollbar {
      height: 8px;
    }

    .overflow-x-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: #990D35;
      border-radius: 10px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: #7a0a2a;
    }

    .overflow-x-auto {
      scroll-behavior: smooth;
    }
  `;
  document.head.appendChild(style);
  
  return () => {
    document.head.removeChild(style);
  };
}, []);

// ============================================================================
// 🆕 HELPER: Calculate positions for split bracket
// ============================================================================

/**
 * Split matches into left and right sides
 */
const splitMatchesBySide = (matches: Match[], totalRounds: number) => {
  const allRounds: { left: Match[]; right: Match[] }[] = [];
  
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = getMatchesByRound(round);
    
    // Final round stays in center (tidak di-split)
    if (round === totalRounds) {
      allRounds.push({ left: [], right: [] });
      continue;
    }
    
    // Split round matches in half
    const half = Math.ceil(roundMatches.length / 2);
    allRounds.push({
      left: roundMatches.slice(0, half),
      right: roundMatches.slice(half)
    });
  }
  
  return allRounds;
};

/**
 * Get left matches only (untuk render bracket side)
 */
const getLeftMatches = () => {
  const totalRounds = getTotalRounds();
  const split = splitMatchesBySide(matches, totalRounds);
  
  const result: Match[][] = [];
  
  for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
    result.push(split[roundIndex].left);
  }
  
  return result;
};

/**
 * Get right matches only (untuk render bracket side)
 */
const getRightMatches = () => {
  const totalRounds = getTotalRounds();
  const split = splitMatchesBySide(matches, totalRounds);
  
  const result: Match[][] = [];
  
  for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
    result.push(split[roundIndex].right);
  }
  
  return result;
};

/**
 * Get final match (untuk render di center)
 */
const getFinalMatch = (): Match | null => {
  const totalRounds = getTotalRounds();
  const finalMatches = getMatchesByRound(totalRounds);
  return finalMatches.length > 0 ? finalMatches[0] : null;
};

/**
 * Calculate card position for split bracket
 */
const calculateCardPosition = (
  side: 'left' | 'right' | 'final',
  roundIndex: number,
  matchIndex: number,
  totalMatchesInRound: number,
  centerOffset: number
): { x: number; y: number } => {
  
  if (side === 'final') {
    // Final card di tengah
    const totalRounds = getTotalRounds();
    const finalX = (totalRounds - 1) * (CARD_WIDTH + ROUND_GAP) + 32;
    return { x: finalX, y: centerOffset - (CARD_HEIGHT / 2) };
  }
  
  const baseSpacing = 280;
  const spacingMultiplier = Math.pow(2, roundIndex);
  const spacing = baseSpacing * spacingMultiplier;
  
  // Vertical position
  const totalHeight = (totalMatchesInRound - 1) * spacing;
  const startOffset = -totalHeight / 2;
  const y = centerOffset + startOffset + (matchIndex * spacing);
  
  // Horizontal position
  let x: number;
  if (side === 'left') {
    x = roundIndex * (CARD_WIDTH + ROUND_GAP) + 32;
  } else {
    // Right side: mirror position dari kanan
    const leftSideWidth = (getTotalRounds() - 1) * (CARD_WIDTH + ROUND_GAP);
    x = leftSideWidth + (roundIndex * (CARD_WIDTH + ROUND_GAP)) + 32;
  }
  
  return { x, y };
};

/**
 * Get left bracket matches (excluding final)
 */
const getLeftBracketMatches = () => {
  const totalRounds = getTotalRounds();
  const split = splitMatchesBySide(matches, totalRounds);
  
  const result: { round: number; matches: Match[]; positions: {x: number; y: number}[] }[] = [];
  
  for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
    const roundMatches = split[roundIndex].left;
    const positions = roundMatches.map((_, idx) => 
      calculateCardPosition('left', roundIndex, idx, roundMatches.length, centerOffset)
    );
    
    result.push({
      round: roundIndex + 1,
      matches: roundMatches,
      positions
    });
  }
  
  return result;
};

/**
 * Get right bracket matches (excluding final)
 */
const getRightBracketMatches = () => {
  const totalRounds = getTotalRounds();
  const split = splitMatchesBySide(matches, totalRounds);
  
  const result: { round: number; matches: Match[]; positions: {x: number; y: number}[] }[] = [];
  
  for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
    const roundMatches = split[roundIndex].right;
    const positions = roundMatches.map((_, idx) => 
      calculateCardPosition('right', roundIndex, idx, roundMatches.length, centerOffset)
    );
    
    result.push({
      round: roundIndex + 1,
      matches: roundMatches,
      positions
    });
  }
  
  return result;
};

/**
 * Get final match with position
 */
const getFinalMatchWithPosition = () => {
  const totalRounds = getTotalRounds();
  const finalMatches = getMatchesByRound(totalRounds);
  
  if (finalMatches.length === 0) return null;
  
  const position = calculateCardPosition('final', totalRounds - 1, 0, 1, centerOffset);
  
  return {
    match: finalMatches[0],
    position
  };
};

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
                  <span>🏆 KATEGORI PRESTASI</span>
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

              <button
                onClick={handleExportPDF}
                disabled={!bracketGenerated || exportingPDF || matches.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
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
              {/* DEBUG BUTTON - Development Only */}
  <button
    onClick={runFullDebug}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
    style={{ backgroundColor: '#8B5CF6', color: '#F5FBEF' }}
  >
    <AlertTriangle size={16} />
    <span>Debug Bracket</span>
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

      {/* PRESTASI Layout dengan FIXED POSITIONING */}
      {bracketGenerated && matches.length > 0 ? (
        <div className="p-6">
          <div id="bracket-export-area">
            {/* Title for PDF */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold" style={{ color: '#990D35' }}>
                Tournament Bracket - {kelasData.kelompok?.nama_kelompok} {kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} {kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas}
              </h2>
              <p className="text-sm mt-2" style={{ color: '#050505', opacity: 0.7 }}>
                {kelasData.kompetisi.nama_event} • {kelasData.kompetisi.lokasi}
              </p>
            </div>

<div ref={bracketRef} className="overflow-x-auto overflow-y-visible pb-8">
  <div 
    className="tournament-layout"
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start', // ✅ PENTING!
      gap: `${CENTER_GAP}px`,
      minWidth: 'fit-content',
      minHeight: '800px', // ✅ Fixed minimum height
      padding: '60px 40px',
      position: 'relative'
    }}
  >
    {/* LEFT BRACKET */}
    {renderBracketSide(getLeftMatches(), 'left', 1)}

    {/* CENTER FINAL */}
    {renderCenterFinal()}

    {/* RIGHT BRACKET */}
    {renderBracketSide(getRightMatches(), 'right', 1)}
  </div>
</div>

            {/* Leaderboard section tetap di luar export area */}
            {prestasiLeaderboard && (
              <div className="mt-8" id="prestasi-leaderboard">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg border-2" style={{ borderColor: '#990D35' }}>
                    <div className="p-6 border-b" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: '#990D35' }}>
                      <div className="flex items-center gap-3 justify-center">
                        <Trophy size={28} style={{ color: '#990D35' }} />
                        <h3 className="text-2xl font-bold" style={{ color: '#990D35' }}>
                          LEADERBOARD
                        </h3>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* 1st Place */}
                      {prestasiLeaderboard.first && (
                        <div className="mb-6">
                          <div 
                            className="relative p-6 rounded-xl border-4 shadow-xl"
                            style={{ 
                              backgroundColor: 'rgba(255, 215, 0, 0.1)', 
                              borderColor: '#FFD700'
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                                style={{ backgroundColor: '#FFD700' }}
                              >
                                <span className="text-4xl">🥇</span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span 
                                    className="text-xs font-bold px-3 py-1 rounded-full"
                                    style={{ backgroundColor: '#FFD700', color: 'white' }}
                                  >
                                    CHAMPION
                                  </span>
                                </div>
                                <h4 className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                                  {prestasiLeaderboard.first.name}
                                </h4>
                                <p className="text-sm uppercase font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                                  {prestasiLeaderboard.first.dojo}
                                </p>
                              </div>
                              
                              <Trophy size={48} style={{ color: '#FFD700' }} className="flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2nd & 3rd Places */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 2nd Place */}
                        {prestasiLeaderboard.second && (
                          <div 
                            className="p-4 rounded-lg border-2 shadow-md col-span-1"
                            style={{ 
                              backgroundColor: 'rgba(192, 192, 192, 0.1)', 
                              borderColor: '#C0C0C0'
                            }}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md"
                                style={{ backgroundColor: '#C0C0C0' }}
                              >
                                <span className="text-3xl">🥈</span>
                              </div>
                              <span 
                                className="text-xs font-bold px-2 py-1 rounded-full mb-2"
                                style={{ backgroundColor: '#C0C0C0', color: 'white' }}
                              >
                                2ND PLACE
                              </span>
                              <h5 className="text-lg font-bold mb-1" style={{ color: '#050505' }}>
                                {prestasiLeaderboard.second.name}
                              </h5>
                              <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                {prestasiLeaderboard.second.dojo}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 3rd Places */}
                        {prestasiLeaderboard.third.map((participant) => (
                          <div 
                            key={participant.id}
                            className="p-4 rounded-lg border-2 shadow-md col-span-1"
                            style={{ 
                              backgroundColor: 'rgba(205, 127, 50, 0.1)', 
                              borderColor: '#CD7F32'
                            }}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md"
                                style={{ backgroundColor: '#CD7F32' }}
                              >
                                <span className="text-3xl">🥉</span>
                              </div>
                              <span 
                                className="text-xs font-bold px-2 py-1 rounded-full mb-2"
                                style={{ backgroundColor: '#CD7F32', color: 'white' }}
                              >
                                3RD PLACE
                              </span>
                              <h5 className="text-lg font-bold mb-1" style={{ color: '#050505' }}>
                                {participant.name}
                              </h5>
                              <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Empty State */}
                      {!prestasiLeaderboard.first && !prestasiLeaderboard.second && prestasiLeaderboard.third.length === 0 && (
                        <div className="text-center py-12">
                          <Trophy size={64} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-4" />
                          <p className="text-lg font-semibold mb-2" style={{ color: '#050505' }}>
                            Belum Ada Hasil
                          </p>
                          <p className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                            Leaderboard akan muncul setelah pertandingan dimulai
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                : 'Click "Preview & Generate Bracket" to create the tournament bracket'
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

export default TournamentBracketPrestasi;