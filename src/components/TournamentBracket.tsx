import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, Users, Eye, Edit3, Save, Clock, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

// Types based on your Prisma schema
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
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ kelasData, onBack }) => {
  const [selectedKelas, setSelectedKelas] = useState<KelasKejuaraan | null>(kelasData || null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);

  // Mock data for demonstration - replace with your actual API calls
  useEffect(() => {
    if (!selectedKelas) {
      // Mock data that matches your schema structure
      const mockKelas: KelasKejuaraan = {
        id_kelas_kejuaraan: 1,
        cabang: 'KYORUGI',
        kategori_event: {
          nama_kategori: 'Prestasi'
        },
        kelompok: {
          nama_kelompok: 'Juniors',
          usia_min: 15,
          usia_max: 17
        },
        kelas_berat: {
          nama_kelas: 'Male -63kg',
          batas_min: 59,
          batas_max: 63,
          jenis_kelamin: 'LAKI_LAKI'
        },
        kompetisi: {
          nama_event: 'Kejuaraan Taekwondo Bela Negara Piala Menteri Pertahanan',
          tanggal_mulai: '2025-07-25',
          tanggal_selesai: '2025-07-27',
          lokasi: 'Palembang, Indonesia'
        },
        peserta_kompetisi: [
          {
            id_peserta_kompetisi: 1,
            id_atlet: 1,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 1,
              nama_atlet: 'IQBAL KURNIAWAN',
              dojang: { nama_dojang: 'LAMPUNG TENGAH TAEKWONDO TEAM INA' }
            }
          },
          {
            id_peserta_kompetisi: 2,
            id_atlet: 2,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 2,
              nama_atlet: 'M. ARAPAT',
              dojang: { nama_dojang: 'PENGKAB TI LAMPUNG UTARA INA' }
            }
          },
          {
            id_peserta_kompetisi: 3,
            id_atlet: 3,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 3,
              nama_atlet: 'FIRMAN ABABIL',
              dojang: { nama_dojang: 'TI BENGKULU INA' }
            }
          },
          {
            id_peserta_kompetisi: 4,
            id_atlet: 4,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 4,
              nama_atlet: 'RAFFIE RADITYA',
              dojang: { nama_dojang: 'PAPA CLUB LUBUKLINGGAU INA' }
            }
          },
          {
            id_peserta_kompetisi: 5,
            id_atlet: 5,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 5,
              nama_atlet: 'MUHAMMAD NABHAN SETIAWAN',
              dojang: { nama_dojang: 'JAKABARING CERIA INA' }
            }
          },
          {
            id_peserta_kompetisi: 6,
            id_atlet: 6,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 6,
              nama_atlet: 'ANDHIKA FRANWIJAYA',
              dojang: { nama_dojang: 'CRANIUM INA' }
            }
          },
          {
            id_peserta_kompetisi: 7,
            id_atlet: 7,
            is_team: false,
            status: 'APPROVED',
            atlet: {
              id_atlet: 7,
              nama_atlet: 'MUHAMMAD ALFATH KAYSAN ZULKARNAIN',
              dojang: { nama_dojang: 'X FIGHTER INA' }
            }
          }
        ],
        bagan: []
      };
      setSelectedKelas(mockKelas);
    }
  }, [selectedKelas]);

  // Generate tournament bracket
  const generateBracket = async () => {
    if (!selectedKelas) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const approvedPeserta = selectedKelas.peserta_kompetisi.filter(p => p.status === 'APPROVED');
      const totalParticipants = approvedPeserta.length;
      
      if (totalParticipants < 2) {
        setLoading(false);
        return;
      }

      const rounds = Math.ceil(Math.log2(totalParticipants));
      const generatedMatches: Match[] = [];
      
      // Generate first round matches
      let matchId = 1;
      const firstRoundMatches = Math.ceil(totalParticipants / 2);
      
      for (let i = 0; i < firstRoundMatches; i++) {
        const pesertaA = approvedPeserta[i * 2];
        const pesertaB = approvedPeserta[i * 2 + 1];
        
        generatedMatches.push({
          id_match: matchId++,
          ronde: 1,
          id_peserta_a: pesertaA?.id_peserta_kompetisi,
          id_peserta_b: pesertaB?.id_peserta_kompetisi,
          skor_a: 0,
          skor_b: 0,
          peserta_a: pesertaA,
          peserta_b: pesertaB
        });
      }
      
      // Generate subsequent rounds
      for (let round = 2; round <= rounds; round++) {
        const prevRoundMatches = generatedMatches.filter(m => m.ronde === round - 1);
        const currentRoundMatches = Math.ceil(prevRoundMatches.length / 2);
        
        for (let i = 0; i < currentRoundMatches; i++) {
          generatedMatches.push({
            id_match: matchId++,
            ronde: round,
            skor_a: 0,
            skor_b: 0
          });
        }
      }
      
      setMatches(generatedMatches);
      setBracketGenerated(true);
      setLoading(false);
    }, 1500);
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

  const updateMatchResult = (matchId: number, scoreA: number, scoreB: number) => {
    setMatches(prev => prev.map(match => 
      match.id_match === matchId 
        ? { ...match, skor_a: scoreA, skor_b: scoreB }
        : match
    ));
    setEditingMatch(null);
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
                onClick={generateBracket}
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
                    <span>{bracketGenerated ? 'Regenerate' : 'Generate'} Bracket</span>
                  </>
                )}
              </button>
              
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                <Save size={16} />
                <span>Save</span>
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
          <div className="overflow-x-auto">
            <div className="inline-flex gap-8 min-w-full">
              {Array.from({ length: totalRounds }, (_, roundIndex) => {
                const round = roundIndex + 1;
                const roundMatches = getMatchesByRound(round);
                
                return (
                  <div key={round} className="flex flex-col min-w-[300px]">
                    {/* Round Header */}
                    <div className="mb-6 text-center">
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#990D35' }}>
                        {getRoundName(round, totalRounds)}
                      </h3>
                    </div>

                    {/* Matches */}
                    <div className="space-y-8">
                      {roundMatches.map((match, matchIndex) => (
                        <div
                          key={match.id_match}
                          className="bg-white rounded-lg shadow-sm border overflow-hidden"
                          style={{ borderColor: '#990D35' }}
                        >
                          {/* Match Header */}
                          <div className="px-4 py-2 border-b flex items-center justify-between" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: '#990D35' }}>
                            <span className="text-sm font-medium" style={{ color: '#050505' }}>
                              Match {matchIndex + 1}
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
                                ? 'border-green-500 bg-green-50' 
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
                                    Winner of previous match
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Participant B */}
                            {match.peserta_b && (
                              <div className={`p-3 rounded border-2 transition-all ${
                                match.skor_b > match.skor_a && (match.skor_a > 0 || match.skor_b > 0)
                                  ? 'border-green-500 bg-green-50' 
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
                            )}

                            {/* Free draw/Bye */}
                            {match.peserta_a && !match.peserta_b && (
                              <div className="text-center py-2">
                                <span className="text-sm px-3 py-1 rounded-full" style={{ 
                                  backgroundColor: 'rgba(245, 183, 0, 0.2)', 
                                  color: '#F5B700' 
                                }}>
                                  Free draw
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Winner indication */}
                          {round < totalRounds && (match.skor_a > 0 || match.skor_b > 0) && (
                            <div className="px-4 pb-3">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#059669' }}>
                                  <CheckCircle size={14} />
                                  <span className="text-xs font-medium">
                                    {match.skor_a > match.skor_b ? 'B/' + match.peserta_a?.id_peserta_kompetisi : 'R/' + match.peserta_b?.id_peserta_kompetisi}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Final result */}
                          {round === totalRounds && (match.skor_a > 0 || match.skor_b > 0) && (
                            <div className="px-4 pb-4">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#990D35', color: 'white' }}>
                                  <Trophy size={16} />
                                  <span className="text-sm font-bold">
                                    WINNER: {match.skor_a > match.skor_b ? 
                                      getParticipantName(match.peserta_a) : 
                                      getParticipantName(match.peserta_b)
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
              <button
                onClick={generateBracket}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Generating Bracket...</span>
                  </div>
                ) : (
                  'Generate Tournament Bracket'
                )}
              </button>
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