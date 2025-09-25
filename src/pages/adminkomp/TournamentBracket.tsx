import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, Users, Eye, Edit3, Shuffle, Save, Clock, CheckCircle } from 'lucide-react';

// Types for the tournament data
interface Competitor {
  id: string;
  name: string;
  dojang: string;
  seed?: number;
  isTeam?: boolean;
  members?: string[];
}

interface Match {
  id: string;
  round: number;
  position: number;
  competitor1?: Competitor;
  competitor2?: Competitor;
  winner?: Competitor;
  score1?: number;
  score2?: number;
  status: 'pending' | 'ongoing' | 'completed' | 'bye';
  scheduledTime?: string;
}

interface TournamentCategory {
  id: string;
  name: string;
  category: 'KYORUGI' | 'POOMSAE';
  ageGroup: string;
  weightClass?: string;
  poomsaeClass?: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN' | 'MIXED';
  level: 'pemula' | 'prestasi';
  competitors: Competitor[];
  matches: Match[];
  isGenerated: boolean;
}

const TournamentBracket: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory | null>(null);
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'bracket'>('overview');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockCategories: TournamentCategory[] = [
      {
        id: '1',
        name: 'Kyorugi Putra Senior -68kg Prestasi',
        category: 'KYORUGI',
        ageGroup: 'Senior',
        weightClass: '-68kg',
        gender: 'LAKI_LAKI',
        level: 'prestasi',
        competitors: [
          { id: '1', name: 'Ahmad Rizki', dojang: 'Dojang Sriwijaya', seed: 1 },
          { id: '2', name: 'Budi Santoso', dojang: 'Dojang Palembang', seed: 2 },
          { id: '3', name: 'Chandra Wijaya', dojang: 'Dojang Musi', seed: 3 },
          { id: '4', name: 'Dedy Kurniawan', dojang: 'Dojang Ogan', seed: 4 },
          { id: '5', name: 'Eko Prasetyo', dojang: 'Dojang Komering', seed: 5 },
          { id: '6', name: 'Fadil Rahman', dojang: 'Dojang Ilir', seed: 6 },
          { id: '7', name: 'Gunawan', dojang: 'Dojang Ulu', seed: 7 },
          { id: '8', name: 'Hadi Susanto', dojang: 'Dojang Banyuasin', seed: 8 }
        ],
        matches: [],
        isGenerated: false
      },
      {
        id: '2',
        name: 'Poomsae Tim Putri Cadet Prestasi',
        category: 'POOMSAE',
        ageGroup: 'Cadet',
        poomsaeClass: 'Tim',
        gender: 'PEREMPUAN',
        level: 'prestasi',
        competitors: [
          { 
            id: '1', 
            name: 'Tim Sriwijaya A', 
            dojang: 'Dojang Sriwijaya', 
            isTeam: true,
            members: ['Sari Dewi', 'Tina Maharani', 'Uci Permata'],
            seed: 1
          },
          { 
            id: '2', 
            name: 'Tim Palembang B', 
            dojang: 'Dojang Palembang', 
            isTeam: true,
            members: ['Vina Sari', 'Wulan Dari', 'Xenia Rosa'],
            seed: 2
          },
          { 
            id: '3', 
            name: 'Tim Musi C', 
            dojang: 'Dojang Musi', 
            isTeam: true,
            members: ['Yuni Astuti', 'Zahra Fitri', 'Andi Lestari'],
            seed: 3
          },
          { 
            id: '4', 
            name: 'Tim Ogan D', 
            dojang: 'Dojang Ogan', 
            isTeam: true,
            members: ['Bella Cantika', 'Citra Dewi', 'Dina Sari'],
            seed: 4
          }
        ],
        matches: [],
        isGenerated: false
      }
    ];
    setCategories(mockCategories);
  }, []);

  const generateBracket = (category: TournamentCategory) => {
    setLoading(true);
    setTimeout(() => {
      const competitors = [...category.competitors];
      const totalRounds = Math.ceil(Math.log2(competitors.length));
      const matches: Match[] = [];
      
      let matchId = 1;
      
      // Generate first round matches
      for (let i = 0; i < competitors.length; i += 2) {
        if (competitors[i + 1]) {
          matches.push({
            id: `match-${matchId}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            competitor1: competitors[i],
            competitor2: competitors[i + 1],
            status: 'pending'
          });
        } else {
          // Bye match
          matches.push({
            id: `match-${matchId}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            competitor1: competitors[i],
            winner: competitors[i],
            status: 'bye'
          });
        }
        matchId++;
      }
      
      // Generate subsequent rounds
      for (let round = 2; round <= totalRounds; round++) {
        const prevRoundMatches = matches.filter(m => m.round === round - 1).length;
        const currentRoundMatches = Math.ceil(prevRoundMatches / 2);
        
        for (let i = 0; i < currentRoundMatches; i++) {
          matches.push({
            id: `match-${matchId}`,
            round,
            position: i + 1,
            status: 'pending'
          });
          matchId++;
        }
      }
      
      const updatedCategory = {
        ...category,
        matches,
        isGenerated: true
      };
      
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? updatedCategory : cat
      ));
      setSelectedCategory(updatedCategory);
      setLoading(false);
    }, 1500);
  };

  const updateMatchResult = (matchId: string, winner: Competitor, score1: number, score2: number) => {
    if (!selectedCategory) return;
    
    const updatedMatches = selectedCategory.matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          winner,
          score1,
          score2,
          status: 'completed' as const
        };
      }
      return match;
    });
    
    const updatedCategory = {
      ...selectedCategory,
      matches: updatedMatches
    };
    
    setCategories(prev => prev.map(cat => 
      cat.id === selectedCategory.id ? updatedCategory : cat
    ));
    setSelectedCategory(updatedCategory);
  };

  const getMatchByRoundAndPosition = (round: number, position: number) => {
    if (!selectedCategory) return null;
    return selectedCategory.matches.find(m => m.round === round && m.position === position);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi Final';
    if (round === totalRounds - 2) return 'Perempat Final';
    return `Babak ${round}`;
  };

  const getStatusBadge = (status: Match['status']) => {
    const statusConfig = {
      pending: { bg: 'rgba(245, 183, 0, 0.2)', text: '#F5B700', label: 'Menunggu' },
      ongoing: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', label: 'Berlangsung' },
      completed: { bg: 'rgba(34, 197, 94, 0.2)', text: '#059669', label: 'Selesai' },
      bye: { bg: 'rgba(156, 163, 175, 0.2)', text: '#6b7280', label: 'Bye' }
    };
    
    const config = statusConfig[status];
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    );
  };

  if (viewMode === 'overview') {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#F5FBEF' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Trophy size={32} style={{ color: '#990D35' }} />
            <div>
              <h1 className="text-3xl font-bebas" style={{ color: '#050505' }}>
                DRAWING BAGAN TOURNAMENT
              </h1>
              <p className="text-base" style={{ color: '#050505', opacity: 0.7 }}>
                Kelola bracket tournament untuk setiap kategori Taekwondo
              </p>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const totalRounds = Math.ceil(Math.log2(category.competitors.length));
            const completedMatches = category.matches.filter(m => m.status === 'completed').length;
            const totalMatches = category.matches.length;

            return (
              <div
                key={category.id}
                className="rounded-xl shadow-sm border p-6 hover:shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}
                onClick={() => {
                  setSelectedCategory(category);
                  setViewMode('bracket');
                }}
              >
                {/* Category Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {category.category === 'KYORUGI' ? (
                      <Medal size={24} style={{ color: '#990D35' }} />
                    ) : (
                      <Trophy size={24} style={{ color: '#F5B700' }} />
                    )}
                    <div>
                      <h3 className="font-bold text-lg leading-tight" style={{ color: '#050505' }}>
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm px-2 py-1 rounded-full" style={{ 
                          backgroundColor: category.category === 'KYORUGI' ? 'rgba(153, 13, 53, 0.1)' : 'rgba(245, 183, 0, 0.1)',
                          color: category.category === 'KYORUGI' ? '#990D35' : '#F5B700'
                        }}>
                          {category.category}
                        </span>
                        <span className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                          {category.level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {category.isGenerated && (
                    <CheckCircle size={20} style={{ color: '#22c55e' }} />
                  )}
                </div>

                {/* Category Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                      Kelompok Usia
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#050505' }}>
                      {category.ageGroup}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                      Jenis Kelamin
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#050505' }}>
                      {category.gender === 'LAKI_LAKI' ? 'Putra' : category.gender === 'PEREMPUAN' ? 'Putri' : 'Campuran'}
                    </p>
                  </div>
                  {category.weightClass && (
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                        Kelas Berat
                      </p>
                      <p className="text-sm font-semibold" style={{ color: '#050505' }}>
                        {category.weightClass}
                      </p>
                    </div>
                  )}
                  {category.poomsaeClass && (
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                        Kelas Poomsae
                      </p>
                      <p className="text-sm font-semibold" style={{ color: '#050505' }}>
                        {category.poomsaeClass}
                      </p>
                    </div>
                  )}
                </div>

                {/* Competitors Count */}
                <div className="flex items-center gap-2 mb-4">
                  {category.competitors[0]?.isTeam ? (
                    <Users size={16} style={{ color: '#050505', opacity: 0.7 }} />
                  ) : (
                    <User size={16} style={{ color: '#050505', opacity: 0.7 }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: '#050505' }}>
                    {category.competitors.length} {category.competitors[0]?.isTeam ? 'Tim' : 'Peserta'}
                  </span>
                </div>

                {/* Progress */}
                {category.isGenerated ? (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#050505', opacity: 0.7 }}>Progress Tournament</span>
                      <span style={{ color: '#050505' }}>
                        {completedMatches}/{totalMatches}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: '#22c55e',
                          width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 183, 0, 0.1)' }}>
                    <p className="text-sm text-center" style={{ color: '#F5B700' }}>
                      Bracket belum dibuat
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!category.isGenerated) {
                      generateBracket(category);
                    } else {
                      setSelectedCategory(category);
                      setViewMode('bracket');
                    }
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: category.isGenerated ? '#990D35' : '#F5B700',
                    color: '#F5FBEF'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Membuat Bracket...</span>
                    </>
                  ) : category.isGenerated ? (
                    <>
                      <Eye size={16} />
                      <span>Lihat Bracket</span>
                    </>
                  ) : (
                    <>
                      <Shuffle size={16} />
                      <span>Buat Bracket</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16" style={{ color: '#050505', opacity: 0.4 }}>
            <Trophy size={64} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tidak ada kategori tersedia</h3>
            <p className="text-base">Tunggu hingga periode pendaftaran selesai untuk membuat bracket</p>
          </div>
        )}
      </div>
    );
  }

  // Bracket View
  if (!selectedCategory) return null;

  const totalRounds = Math.ceil(Math.log2(selectedCategory.competitors.length));
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('overview')}
              className="p-2 rounded-lg border hover:shadow-sm transition-all"
              style={{ borderColor: '#990D35', color: '#990D35' }}
            >
              <Trophy size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bebas" style={{ color: '#050505' }}>
                {selectedCategory.name}
              </h1>
              <p className="text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                {selectedCategory.competitors.length} {selectedCategory.competitors[0]?.isTeam ? 'Tim' : 'Peserta'} • {totalRounds} Babak
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => generateBracket(selectedCategory)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: '#F5B700', color: '#F5FBEF' }}
            >
              <Shuffle size={16} />
              <span>Regenerate</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
            >
              <Save size={16} />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Bracket */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-8 min-w-full p-4">
          {Array.from({ length: totalRounds }, (_, roundIndex) => {
            const round = roundIndex + 1;
            const roundMatches = selectedCategory.matches.filter(m => m.round === round);
            
            return (
              <div key={round} className="flex flex-col min-w-[280px]">
                {/* Round Header */}
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold" style={{ color: '#990D35' }}>
                    {getRoundName(round, totalRounds)}
                  </h3>
                  <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                    {roundMatches.length} Pertandingan
                  </p>
                </div>

                {/* Matches */}
                <div className="space-y-4 flex-1">
                  {roundMatches.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className="rounded-xl border shadow-sm overflow-hidden"
                      style={{ 
                        backgroundColor: '#F5FBEF', 
                        borderColor: match.status === 'completed' ? '#22c55e' : '#990D35'
                      }}
                    >
                      {/* Match Header */}
                      <div 
                        className="px-4 py-2 flex items-center justify-between"
                        style={{ 
                          backgroundColor: match.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(153, 13, 53, 0.1)'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: '#050505' }}>
                            Match {match.position}
                          </span>
                          {match.scheduledTime && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} style={{ color: '#050505', opacity: 0.6 }} />
                              <span className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                                {match.scheduledTime}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(match.status)}
                          <button
                            onClick={() => setEditingMatch(match)}
                            className="p-1 rounded hover:bg-black/5"
                          >
                            <Edit3 size={14} style={{ color: '#050505', opacity: 0.6 }} />
                          </button>
                        </div>
                      </div>

                      {/* Competitors */}
                      <div className="p-4 space-y-3">
                        {/* Competitor 1 */}
                        <div 
                          className={`p-3 rounded-lg border-2 transition-all ${
                            match.winner?.id === match.competitor1?.id 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          {match.competitor1 ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: '#050505' }}>
                                  {match.competitor1.name}
                                </p>
                                <p className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                                  {match.competitor1.dojang}
                                </p>
                                {match.competitor1.isTeam && match.competitor1.members && (
                                  <p className="text-xs mt-1" style={{ color: '#990D35' }}>
                                    {match.competitor1.members.join(', ')}
                                  </p>
                                )}
                              </div>
                              {match.status === 'completed' && (
                                <div className="text-right">
                                  <span className="text-lg font-bold" style={{ color: '#050505' }}>
                                    {match.score1 || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <span className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                                Menunggu pemenang babak sebelumnya
                              </span>
                            </div>
                          )}
                        </div>

                        {/* VS */}
                        {match.status !== 'bye' && (
                          <div className="text-center">
                            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ 
                              backgroundColor: '#990D35', 
                              color: '#F5FBEF' 
                            }}>
                              VS
                            </span>
                          </div>
                        )}

                        {/* Competitor 2 */}
                        {match.status !== 'bye' && (
                          <div 
                            className={`p-3 rounded-lg border-2 transition-all ${
                              match.winner?.id === match.competitor2?.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            {match.competitor2 ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm" style={{ color: '#050505' }}>
                                    {match.competitor2.name}
                                  </p>
                                  <p className="text-xs" style={{ color: '#050505', opacity: 0.6 }}>
                                    {match.competitor2.dojang}
                                  </p>
                                  {match.competitor2.isTeam && match.competitor2.members && (
                                    <p className="text-xs mt-1" style={{ color: '#990D35' }}>
                                      {match.competitor2.members.join(', ')}
                                    </p>
                                  )}
                                </div>
                                {match.status === 'completed' && (
                                  <div className="text-right">
                                    <span className="text-lg font-bold" style={{ color: '#050505' }}>
                                      {match.score2 || 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <span className="text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                                  Menunggu pemenang babak sebelumnya
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-xl max-w-md w-full" style={{ backgroundColor: '#F5FBEF' }}>
            <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
              <h3 className="text-xl font-bold" style={{ color: '#050505' }}>
                Edit Match {editingMatch.position}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {editingMatch.competitor1 && editingMatch.competitor2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                      {editingMatch.competitor1.name}
                    </label>
                    <input
                      type="number"
                      placeholder="Skor"
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                      defaultValue={editingMatch.score1 || ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#050505' }}>
                      {editingMatch.competitor2.name}
                    </label>
                    <input
                      type="number"
                      placeholder="Skor"
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                      defaultValue={editingMatch.score2 || ''}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#990D35' }}>
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2 px-4 rounded-lg border font-medium transition-all"
                style={{ borderColor: '#990D35', color: '#990D35' }}
              >
                Batal
              </button>
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#990D35', color: '#F5FBEF' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;