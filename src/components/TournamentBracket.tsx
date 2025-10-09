import React, { useState, useEffect } from 'react';
import { Trophy, Edit3, Save, Medal, ArrowLeft, RefreshCw, Download, Shuffle } from 'lucide-react';
import { useAuth } from '../context/authContext'; // ⬅️ TAMBAHKAN INI

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

interface TournamentBracketProps {
  kelasData?: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
  kompetisiId?: number;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  kelasData, 
  onBack,
  apiBaseUrl = '/api',
  kompetisiId
}) => {
  const { token } = useAuth(); // ⬅️ TAMBAHKAN INI
  const [selectedKelas, setSelectedKelas] = useState<KelasKejuaraan | null>(kelasData || null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isPemula = selectedKelas?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
  
  console.log('📊 Category type:', isPemula ? 'PEMULA' : 'PRESTASI');

  // Fetch competition class data from database
  const fetchKelasData = async (id_kelas_kejuaraan: number) => {
    try {
      setLoading(true);
      
      if (!selectedKelas?.kompetisi?.id_kompetisi) {
        console.error('❌ Kompetisi ID not found');
        return;
      }

      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;

      // Fetch bracket data if exists
      await fetchBracketData(kompetisiId, id_kelas_kejuaraan);
      
    } catch (error) {
      console.error('❌ Error fetching kelas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - replace with your actual API calls
  useEffect(() => {
    if (!kelasData && !selectedKelas) {
      // If no data provided, component will show "Pilih Kelas Kejuaraan" message
      console.log('⚠️ No kelas data provided. Waiting for selection...');
    }
  }, [kelasData, selectedKelas]);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate tournament bracket with shuffle
  const generateBracket = async (shuffle: boolean = true) => {
    if (!selectedKelas) return;
    
    setLoading(true);
    
    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi; // ⬅️ Pastikan ada field ini
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

      console.log(`🎯 Generating bracket for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

      // Call API to generate bracket
      const endpoint = shuffle 
        ? `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/shuffle`
        : `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`;
      
      const response = await fetch(endpoint, {
        method: shuffle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          kelasKejuaraanId: kelasKejuaraanId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate bracket');
      }

      const result = await response.json();
      console.log('✅ Bracket generated:', result);

      // Fetch updated bracket data
      await fetchBracketData(kompetisiId, kelasKejuaraanId);
      
      alert(shuffle ? 'Bracket shuffled successfully!' : 'Bracket generated successfully!');
      
    } catch (error: any) {
      console.error('❌ Error generating bracket:', error);
      alert(error.message || 'Failed to generate bracket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          // Bracket not found - not an error, just not generated yet
          console.log('ℹ️ Bracket not yet generated for this class');
          setBracketGenerated(false);
          setMatches([]);
          return;
        }
        throw new Error('Failed to fetch bracket data');
      }

      const result = await response.json();
      console.log('📊 Bracket data fetched:', result);

      // Transform API response to match component interface
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
          venue: m.venue ? { nama_venue: m.venue } : undefined
        }));

        setMatches(transformedMatches);
        setBracketGenerated(true);
        console.log(`✅ Loaded ${transformedMatches.length} matches`);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching bracket:', error);
      // Don't show alert here, as this might be called on mount
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transform participant data from API format
   */
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

  // Save bracket to database
    const saveBracket = async () => {
    if (!selectedKelas || !bracketGenerated) return;
    
    setSaving(true);
    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

      // Note: Bracket is already saved when generated via API
      // This button can be used to manually trigger save or update
      console.log('ℹ️ Bracket is already saved via API');
      
      alert('Bracket is already saved in the database!');
      
    } catch (error: any) {
      console.error('❌ Error saving bracket:', error);
      alert('Failed to save bracket. Please try again.');
    } finally {
      setSaving(false);
    }
  };

    const exportToPDF = async () => {
    if (!selectedKelas || !bracketGenerated) return;
    
    setExporting(true);
    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;

      console.log(`📄 Exporting PDF for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

      // Call API to export PDF
      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/pdf?kelasKejuaraanId=${kelasKejuaraanId}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Get PDF as blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tournament-bracket-${kelasKejuaraanId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF exported successfully');
      
    } catch (error: any) {
      console.error('❌ Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Generate PDF content (text-based for demo)
  const generateTextPDFContent = (): string => {
    if (!selectedKelas) return '';
    
    let content = `TOURNAMENT BRACKET\n`;
    content += `================\n\n`;
    content += `Competition: ${selectedKelas.kompetisi.nama_event}\n`;
    content += `Class: ${selectedKelas.kelompok?.nama_kelompok} ${selectedKelas.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} ${selectedKelas.kelas_berat?.nama_kelas || selectedKelas.poomsae?.nama_kelas}\n`;
    content += `Date: ${new Date(selectedKelas.kompetisi.tanggal_mulai).toLocaleDateString()}\n`;
    content += `Location: ${selectedKelas.kompetisi.lokasi}\n\n`;
    
    const totalRounds = getTotalRounds();
    
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = getMatchesByRound(round);
      content += `${getRoundName(round, totalRounds).toUpperCase()}\n`;
      content += `${'-'.repeat(getRoundName(round, totalRounds).length)}\n`;
      
      roundMatches.forEach((match, index) => {
        content += `\nMatch ${index + 1}:\n`;
        if (match.peserta_a) {
          content += `  B/${match.peserta_a.id_peserta_kompetisi} ${getParticipantName(match.peserta_a)}`;
          if (match.skor_a > 0 || match.skor_b > 0) content += ` - ${match.skor_a}`;
          content += `\n`;
        }
        if (match.peserta_b) {
          content += `  R/${match.peserta_b.id_peserta_kompetisi} ${getParticipantName(match.peserta_b)}`;
          if (match.skor_a > 0 || match.skor_b > 0) content += ` - ${match.skor_b}`;
          content += `\n`;
        }
        if (match.peserta_a && !match.peserta_b) {
          content += `  (Free draw)\n`;
        }
      });
      content += `\n`;
    }
    
    return content;
  };

  // Generate HTML content for PDF
  const generatePDFContent = (): string => {
    // This would generate proper HTML for PDF conversion
    // Implementation would be similar to the render but optimized for print
    return '<div>PDF Content Here</div>';
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.ronde === round);
  };

  const getTotalRounds = () => {
    if (!selectedKelas) return 0;
    const approvedCount = selectedKelas.peserta_kompetisi.filter(p => p.status === 'APPROVED').length;
    return Math.ceil(Math.log2(approvedCount));
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi Final';
    if (round === totalRounds - 2) return 'Quarter Final';
    return `Round ${round}`;
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
    if (!isPemula || matches.length === 0) return null;

    const leaderboard: {
      gold: { name: string; dojo: string; id: number }[];
      silver: { name: string; dojo: string; id: number }[];
      bye: { name: string; dojo: string; id: number }[];
    } = {
      gold: [],
      silver: [],
      bye: []
    };

    matches.forEach(match => {
      // Check if match has been played
      const hasScore = match.skor_a > 0 || match.skor_b > 0;
      
      if (hasScore) {
        // Determine winner and loser
        const winner = match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b;
        const loser = match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;
        
        if (winner) {
          leaderboard.gold.push({
            name: getParticipantName(winner),
            dojo: getDojoName(winner),
            id: winner.id_peserta_kompetisi
          });
        }
        
        if (loser) {
          leaderboard.silver.push({
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loser.id_peserta_kompetisi
          });
        }
      } else {
        // Match not played yet - check for BYE
        if (match.peserta_a && !match.peserta_b) {
          leaderboard.bye.push({
            name: getParticipantName(match.peserta_a),
            dojo: getDojoName(match.peserta_a),
            id: match.peserta_a.id_peserta_kompetisi
          });
        }
      }
    });

    return leaderboard;
  };

  const leaderboard = generateLeaderboard();

    const updateMatchResult = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!selectedKelas) return;

    try {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      
      // Determine winner based on scores
      const match = matches.find(m => m.id_match === matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const winnerId = scoreA > scoreB 
        ? match.id_peserta_a 
        : match.id_peserta_b;

      if (!winnerId) {
        throw new Error('Cannot determine winner');
      }

      console.log(`🎯 Updating match ${matchId}: ${scoreA} - ${scoreB}, winner: ${winnerId}`);

      // Call API to update match
      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/match/${matchId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            winnerId: winnerId,
            scoreA: scoreA,
            scoreB: scoreB
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update match result');
      }

      const result = await response.json();
      console.log('✅ Match updated:', result);

      // Refresh bracket data to get updated state
      await fetchBracketData(kompetisiId, selectedKelas.id_kelas_kejuaraan);

      setEditingMatch(null);
      alert('Match result updated successfully!');
      
    } catch (error: any) {
      console.error('❌ Error updating match result:', error);
      alert(error.message || 'Failed to update match result. Please try again.');
    }
  };

  if (!selectedKelas) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="text-center">
          <Trophy size={64} style={{ color: '#990D35' }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#050505' }}>
            Pilih Kelas Kejuaraan
          </h2>
          <p style={{ color: '#050505', opacity: 0.6 }}>
            Silakan pilih kelas kejuaraan untuk melihat bracket tournament
          </p>
        </div>
      </div>
    );
  }

  const totalRounds = getTotalRounds();
  const approvedParticipants = selectedKelas.peserta_kompetisi.filter(p => p.status === 'APPROVED');

  useEffect(() => {
    if (selectedKelas && selectedKelas.kompetisi?.id_kompetisi) {
      const kompetisiId = selectedKelas.kompetisi.id_kompetisi;
      const kelasKejuaraanId = selectedKelas.id_kelas_kejuaraan;
      
      console.log(`🔄 Loading bracket for kelas ${kelasKejuaraanId}...`);
      fetchBracketData(kompetisiId, kelasKejuaraanId);
    }
  }, [selectedKelas?.id_kelas_kejuaraan]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Header with competition info */}
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
                  {selectedKelas.kompetisi.nama_event}
                </h1>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                  <span>Tournament date: {new Date(selectedKelas.kompetisi.tanggal_mulai).toLocaleDateString()} - {new Date(selectedKelas.kompetisi.tanggal_selesai).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{selectedKelas.kompetisi.lokasi}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => generateBracket(true)}
                disabled={loading || approvedParticipants.length < 2}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Shuffling...</span>
                  </>
                ) : (
                  <>
                    <Shuffle size={16} />
                    <span>Shuffle & Generate</span>
                  </>
                )}
              </button>

              <button
                onClick={() => generateBracket(false)}
                disabled={loading || approvedParticipants.length < 2}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>{bracketGenerated ? 'Regenerate' : 'Generate'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={saveBracket}
                disabled={!bracketGenerated || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save</span>
                  </>
                )}
              </button>

              <button
                onClick={exportToPDF}
                disabled={!bracketGenerated || exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#059669', color: '#F5FBEF' }}
              >
                {exporting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export PDF</span>
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
                  {selectedKelas.kelompok?.nama_kelompok} {selectedKelas.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'} {selectedKelas.kelas_berat?.nama_kelas || selectedKelas.poomsae?.nama_kelas}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.7 }}>
                  Contestants: {approvedParticipants.length}
                </p>
              </div>
              <div className="text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                Competition date: {new Date(selectedKelas.kompetisi.tanggal_mulai).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Bracket */}
      {bracketGenerated && matches.length > 0 ? (
        <div className="p-6">
          {isPemula ? (
            /* ========== PEMULA LAYOUT ========== */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: All Matches */}
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-center" style={{ color: '#990D35' }}>
                    🥋 PARTAI PERTANDINGAN
                  </h3>
                  <p className="text-center text-sm mt-2" style={{ color: '#050505', opacity: 0.6 }}>
                    Semua pertandingan dalam 1 babak
                  </p>
                </div>

                <div className="space-y-4">
                  {matches.map((match, matchIndex) => (
                    <div
                      key={match.id_match}
                      className="bg-white rounded-lg shadow-sm border overflow-hidden"
                      style={{ borderColor: '#990D35' }}
                    >
                      {/* Match Header */}
                      <div className="px-4 py-2 border-b flex items-center justify-between" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: '#990D35' }}>
                        <span className="text-sm font-medium" style={{ color: '#050505' }}>
                          Partai {matchIndex + 1}
                        </span>
                        <button
                          onClick={() => setEditingMatch(match)}
                          className="p-1 rounded hover:bg-black/5"
                        >
                          <Edit3 size={14} style={{ color: '#050505', opacity: 0.6 }} />
                        </button>
                      </div>

                      {/* Participants */}
                      <div className="p-4">
                        {/* Participant A */}
                        <div className={`p-3 rounded border-2 mb-3 transition-all ${
                          match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0)
                            ? 'border-yellow-500 bg-yellow-50' 
                            : 'border-gray-200'
                        }`}>
                          {match.peserta_a ? (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#990D35', color: 'white' }}>
                                    B/{match.peserta_a.id_peserta_kompetisi}
                                  </span>
                                  <span className="text-sm font-bold text-blue-600">
                                    {getParticipantName(match.peserta_a)}
                                  </span>
                                  {match.skor_a > match.skor_b && (match.skor_a > 0 || match.skor_b > 0) && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5B700', color: 'white' }}>
                                      🥇 GOLD
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-blue-600 uppercase">
                                  {getDojoName(match.peserta_a)}
                                </p>
                              </div>
                              {(match.skor_a > 0 || match.skor_b > 0) && (
                                <div className="text-right ml-4">
                                  <span className="text-lg font-bold" style={{ color: '#050505' }}>
                                    {match.skor_a}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <span className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                                TBD
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Participant B */}
                        {match.peserta_b ? (
                          <div className={`p-3 rounded border-2 transition-all ${
                            match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0)
                              ? 'border-yellow-500 bg-yellow-50' 
                              : match.skor_a > 0 || match.skor_b > 0
                              ? 'border-gray-300 bg-gray-50'
                              : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#990D35', color: 'white' }}>
                                    R/{match.peserta_b.id_peserta_kompetisi}
                                  </span>
                                  <span className="text-sm font-bold text-red-600">
                                    {getParticipantName(match.peserta_b)}
                                  </span>
                                  {match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5B700', color: 'white' }}>
                                      🥇 GOLD
                                    </span>
                                  )}
                                  {match.skor_b < match.skor_a && (match.skor_a > 0 || match.skor_b > 0) && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C0C0C0', color: 'white' }}>
                                      🥈 SILVER
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-red-600 uppercase">
                                  {getDojoName(match.peserta_b)}
                                </p>
                              </div>
                              {(match.skor_a > 0 || match.skor_b > 0) && (
                                <div className="text-right ml-4">
                                  <span className="text-lg font-bold" style={{ color: '#050505' }}>
                                    {match.skor_b}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-sm px-3 py-1 rounded-full" style={{ 
                              backgroundColor: 'rgba(192, 192, 192, 0.2)', 
                              color: '#6b7280' 
                            }}>
                              🥈 Free draw (Silver Medal)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Leaderboard */}
              <div className="lg:sticky lg:top-6 lg:self-start">
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
                    {/* Gold Medals */}
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

                    {/* Silver Medals */}
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
                                <Medal size={20} style={{ color: '#C0C0C0' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BYE (Free Draw) */}
                    {leaderboard && leaderboard.bye.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
                            <span className="text-lg">🎁</span>
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: '#050505' }}>
                            FREE DRAW (Silver)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {leaderboard.bye.map((participant) => (
                            <div key={participant.id} className="p-3 rounded-lg border" style={{ 
                              backgroundColor: 'rgba(107, 114, 128, 0.1)', 
                              borderColor: '#6b7280' 
                            }}>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <p className="font-bold text-sm" style={{ color: '#050505' }}>
                                    {participant.name}
                                  </p>
                                  <p className="text-xs uppercase" style={{ color: '#050505', opacity: 0.6 }}>
                                    {participant.dojo}
                                  </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full" style={{ 
                                  backgroundColor: '#C0C0C0', 
                                  color: 'white' 
                                }}>
                                  🥈 Auto Silver
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {leaderboard && leaderboard.gold.length === 0 && leaderboard.silver.length === 0 && (
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
          ) : (
            /* ========== PRESTASI LAYOUT (EXISTING) ========== */
            <div className="overflow-x-auto">
              <div className="inline-flex gap-8 min-w-full">
                {Array.from({ length: totalRounds }, (_, roundIndex) => {
                  const round = roundIndex + 1;
                  const roundMatches = getMatchesByRound(round);
                  
                  return (
                    <div key={round} className="flex flex-col min-w-[300px]">
                      {/* ... EXISTING PRESTASI RENDERING ... */}
                      {/* COPY PASTE dari code yang sekarang ada */}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Bracket State */
        <div className="p-6">
          <div className="text-center py-16">
            <Trophy size={64} style={{ color: '#990D35', opacity: 0.4 }} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#050505' }}>
              {approvedParticipants.length < 2 ? 'Insufficient Participants' : 'Tournament Bracket Not Generated'}
            </h3>
            <p className="text-base mb-6" style={{ color: '#050505', opacity: 0.6 }}>
              {approvedParticipants.length < 2 
                ? `Need at least 2 approved participants. Currently have ${approvedParticipants.length}.`
                : 'Click "Generate Bracket" to create the tournament bracket'
              }
            </p>
            {approvedParticipants.length >= 2 && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => generateBracket(true)}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#6366F1', color: '#F5FBEF' }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Shuffling & Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shuffle size={16} />
                      <span>Shuffle & Generate Bracket</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => generateBracket(false)}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Sequential Bracket'
                  )}
                </button>
              </div>
            )}
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
              {editingMatch.peserta_a && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                    {getParticipantName(editingMatch.peserta_a)} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Score"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                    defaultValue={editingMatch.skor_a}
                    id="scoreA"
                  />
                </div>
              )}
              
              {editingMatch.peserta_b && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                    {getParticipantName(editingMatch.peserta_b)} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Score"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                    defaultValue={editingMatch.skor_b}
                    id="scoreB"
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#990D35' }}>
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium transition-all"
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
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;