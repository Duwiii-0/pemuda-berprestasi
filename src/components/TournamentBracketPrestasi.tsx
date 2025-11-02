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

const CARD_WIDTH = 250;        // ✅ Reduced untuk fit split
const CARD_HEIGHT = 150;       // ✅ Reduced
const ROUND_GAP = 60;         // ✅ Gap antar round
const VERTICAL_SPACING = 120;  // ✅ Jarak vertikal antar match
const CENTER_GAP = 80;         // ✅ Jarak antara left/right dengan center

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

// ✅ FUNGSI HITUNG VERTICAL GAP ANTAR MATCH
const calculateVerticalGap = (roundIndex: number): number => {
  const baseSpacing = 280;
  return baseSpacing * Math.pow(2, roundIndex);
};

/**
 * 🆕 Render one side of split bracket (FINAL-CENTERED)
 */
const renderBracketSide = (
  matchesBySide: Match[][], 
  side: 'left' | 'right',
  startRound: number = 1
) => {
  const isRight = side === 'right';
  const totalRounds = getTotalRounds();
  
  return (
    <div 
      className="bracket-side"
      style={{
        display: 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        alignItems: 'center',  // ✅ Center align ke Final
        gap: `${ROUND_GAP}px`,
        position: 'relative'
      }}
    >
      {matchesBySide.map((roundMatches, roundIndex) => {
        if (roundMatches.length === 0) return null;
        
        const actualRound = startRound + roundIndex;
        const roundName = getRoundName(actualRound, totalRounds);
        const matchCount = roundMatches.length;
        
        // ✅ Calculate vertical spacing based on round (exponential)
        const verticalGap = VERTICAL_SPACING * Math.pow(2, roundIndex);
        
        return (
          <div 
            key={`${side}-round-${actualRound}`} 
            style={{ 
              position: 'relative',
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
                marginBottom: '30px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 20,
                background: '#F5FBEF',
                padding: '0 10px'
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
            
            {/* Round Matches Container */}
            <div 
              className="round-matches-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: `${verticalGap}px`,
                position: 'relative'
              }}
            >
             {roundMatches.map((match, matchIndex) => (
  <div 
    key={match.id_match}
    style={{ 
      position: 'relative',
      zIndex: 10
    }}
  >
    {renderMatchCard(match, actualRound, matchIndex)}
  </div>
))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 🆕 Render single match card
 */
const renderMatchCard = (match: Match, round: number, matchIndex: number) => {
  const hasScores = match.skor_a > 0 || match.skor_b > 0;
  const winner = hasScores 
    ? (match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b)
    : null;
  
return (
<div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
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
</div>
);
}


/**
 * 🆕 Render center final match
 */
const renderCenterFinal = () => {
  const finalMatch = getFinalMatch();
  
  if (!finalMatch) {
    return (
      <div 
        className="center-final"
        style={{
          width: `${CARD_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}
      >
        <div 
          className="px-6 py-3 rounded-lg font-bold text-lg shadow-md"
          style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
        >
          FINAL
        </div>
        <div 
          className="w-full p-6 rounded-xl border-2 text-center"
          style={{ borderColor: '#990D35', backgroundColor: 'rgba(153, 13, 53, 0.05)' }}
        >
          <Trophy size={48} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-2" />
          <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
            Waiting for finalists
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="center-final"
      style={{
        width: `${CARD_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}
    >
      {/* Final Header */}
      <div 
        className="px-6 py-3 rounded-lg font-bold text-lg shadow-md"
        style={{ backgroundColor: '#FFD700', color: '#050505' }}
      >
        🏆 FINAL
      </div>
      
      {/* Final Match Card */}
      {renderMatchCard(finalMatch, getTotalRounds(), 0)}
    </div>
  );
};

const debugCardPositions = () => {
  console.log('🔍 ===== BRACKET STRUCTURE DEBUG =====');
  console.log('Total Rounds:', getTotalRounds());
  console.log('Left Matches:', getLeftMatches());
  console.log('Right Matches:', getRightMatches());
  console.log('Final Match:', getFinalMatch());
  console.log('=====================================');
};

// Panggil debug saat component mount
React.useEffect(() => {
  if (matches.length > 0) {
    debugCardPositions();
  }
}, [matches]);

  const prestasiLeaderboard = generatePrestasiLeaderboard();
  const totalRounds = getTotalRounds();

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
      position: relative;  /* ✅ TAMBAH */
      z-index: 10;         /* ✅ TAMBAH */
      background: white;   /* ✅ TAMBAH */
    }

    .match-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 15;  /* ✅ TAMBAH - Hover lebih tinggi */
    }

    .round-header {
      position: relative;     /* ✅ TAMBAH */
      z-index: 20;            /* ✅ TAMBAH */
      background: #F5FBEF;    /* ✅ TAMBAH */
      padding: 0 10px;        /* ✅ TAMBAH */
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

    /* Smooth scroll */
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
// 🆕 SPLIT BRACKET HELPERS
// ============================================================================

/**
 * Split matches into left and right sides
 */
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
 * Get left side matches only
 */
const getLeftMatches = () => {
  const totalRounds = getTotalRounds();
  const allRounds = splitMatchesBySide(matches, totalRounds);
  return allRounds.map(r => r.left).slice(0, -1); // Exclude final
};

/**
 * Get right side matches only
 */
const getRightMatches = () => {
  const totalRounds = getTotalRounds();
  const allRounds = splitMatchesBySide(matches, totalRounds);
  return allRounds.map(r => r.right).slice(0, -1); // Exclude final
};

/**
 * Get final match (untuk ditampilkan di center)
 */
const getFinalMatch = (): Match | null => {
  const totalRounds = getTotalRounds();
  const finalMatches = getMatchesByRound(totalRounds);
  return finalMatches.length > 0 ? finalMatches[0] : null;
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

            {/* Bracket Content */}
            <div ref={bracketRef} className="overflow-x-auto overflow-y-visible pb-8">
              <div 
                className="tournament-layout"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',        // ✅ Center vertical alignment
                  gap: `${CENTER_GAP}px`,
                  minWidth: 'fit-content',
                  minHeight: '80vh',
                  padding: '40px 20px',
                  position: 'relative'
                }}
              >
                {/* LEFT BRACKET */}
                {renderBracketSide(getLeftMatches(), 'left', 1)}

                {/* CENTER FINAL */}
                <div style={{ 
                  position: 'relative', 
                  zIndex: 10, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Left Connector */}
                  <svg
                    style={{
                      position: 'absolute',
                      left: `-${CENTER_GAP / 2}px`,
                      top: '50%',
                      width: `${CENTER_GAP / 2}px`,
                      height: '2px',
                      pointerEvents: 'none',
                      zIndex: 5
                    }}
                  >
                    <line x1="0" y1="0" x2={CENTER_GAP / 2} y2="0" stroke="#990D35" strokeWidth="2" />
                  </svg>
                  
                  {/* Right Connector */}
                  <svg
                    style={{
                      position: 'absolute',
                      right: `-${CENTER_GAP / 2}px`,
                      top: '50%',
                      width: `${CENTER_GAP / 2}px`,
                      height: '2px',
                      pointerEvents: 'none',
                      zIndex: 5
                    }}
                  >
                    <line x1="0" y1="0" x2={CENTER_GAP / 2} y2="0" stroke="#990D35" strokeWidth="2" />
                  </svg>
                  
                  {renderCenterFinal()}
                </div>

                {/* RIGHT BRACKET */}
                {renderBracketSide(getRightMatches(), 'right', 1)}
              </div>
            </div> {/* Closing tag untuk bracket-export-area */}

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