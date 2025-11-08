import React, { useEffect, useState } from 'react';
import { Loader, Trophy, Medal, Calendar, MapPin, Award } from 'lucide-react';
import DojangMedalTable from '../components/DojangMedalTable';
import { useAuth } from '../context/authContext';

interface Kompetisi {
  id_kompetisi: number;
  nama_event: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  lokasi: string;
  status: 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI';
}

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  nama_kelas: string;
  cabang: string;
  kategori_event: {
    nama_kategori: string;
  };
  kelompok?: {
    nama_kelompok: string;
  };
  kelas_berat?: {
    nama_kelas: string;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  };
  poomsae?: {
    nama_kelas: string;
  };
  leaderboard: {
    gold: Array<{ id: number; name: string; dojo: string }>;
    silver: Array<{ id: number; name: string; dojo: string }>;
    bronze: Array<{ id: number; name: string; dojo: string }>;
  };
}

interface AggregatedLeaderboard {
  gold: Array<{ id: number; name: string; dojo: string; kelasName: string }>;
  silver: Array<{ id: number; name: string; dojo: string; kelasName: string }>;
  bronze: Array<{ id: number; name: string; dojo: string; kelasName: string }>;
}

const MedalTallyPage: React.FC<{ idKompetisi?: number }> = ({ idKompetisi }) => {
  const { token } = useAuth();
  const [kompetisi, setKompetisi] = useState<Kompetisi | null>(null);
  const [kelasList, setKelasList] = useState<KelasKejuaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState<'overall' | number>('overall');

  useEffect(() => {
    if (!idKompetisi) return;
    fetchMedalData();
  }, [idKompetisi]);

const fetchMedalData = async () => {
  if (!idKompetisi) return;

  try {
    setLoading(true);
    
    console.log('🔍 Fetching medal data for kompetisi:', idKompetisi);
    
    // ✅ STEP 1: Fetch dari PUBLIC endpoint (NO AUTH!)
    const response = await fetch(`/api/public/kompetisi/${idKompetisi}/medal-tally`);
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch medal data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📊 Medal data response:', result);
    
    if (!result.success) {
      throw new Error('Failed to fetch medal data');
    }

    // ✅ STEP 2: Set kompetisi info
    if (result.data.kompetisi) {
      setKompetisi(result.data.kompetisi);
    }

    // ✅ STEP 3: Process kelas data dengan bracket
    const kelasWithLeaderboard = result.data.kelas
      .filter((kelas: any) => kelas.bracket && kelas.bracket.matches.length > 0) // Filter hanya yang ada bracket
      .map((kelas: any) => {
        console.log(`\n📋 Processing kelas: ${kelas.id_kelas_kejuaraan}`);
        
        // Detect kategori (PEMULA atau PRESTASI)
        const isPemula = kelas.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
        
        console.log(`   Type: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);
        console.log(`   Total matches: ${kelas.bracket.matches.length}`);
        
        // Transform leaderboard
        const leaderboard = transformLeaderboard(kelas.bracket.matches, isPemula);
        
        console.log(`   Leaderboard:`, leaderboard);
        
        return {
          id_kelas_kejuaraan: kelas.id_kelas_kejuaraan,
          nama_kelas: kelas.nama_kelas,
          cabang: kelas.cabang,
          kategori_event: kelas.kategori_event,
          kelompok: kelas.kelompok,
          kelas_berat: kelas.kelas_berat,
          poomsae: kelas.poomsae,
          leaderboard
        };
      });

    console.log(`\n✅ Total kelas dengan medali: ${kelasWithLeaderboard.length}`);
    setKelasList(kelasWithLeaderboard);

  } catch (err: any) {
    console.error('❌ Error fetching medal data:', err);
    setError(err.message || 'Gagal memuat data perolehan medali');
  } finally {
    setLoading(false);
  }
};

  /**
   * 🔄 Transform bracket data menjadi leaderboard
   */
const transformLeaderboard = (matches: any[], isPemula: boolean) => {
  const leaderboard = {
    gold: [] as Array<{ id: number; name: string; dojo: string }>,
    silver: [] as Array<{ id: number; name: string; dojo: string }>,
    bronze: [] as Array<{ id: number; name: string; dojo: string }>
  };

  if (!matches || matches.length === 0) {
    return leaderboard;
  }

  if (isPemula) {
    return transformPemulaLeaderboard(matches);
  } else {
    return transformPrestasiLeaderboard(matches);
  }
};
  /**
   * 🥋 Transform PEMULA leaderboard
   */
const transformPemulaLeaderboard = (matches: any[]) => {
  const leaderboard = {
    gold: [] as Array<{ id: number; name: string; dojo: string }>,
    silver: [] as Array<{ id: number; name: string; dojo: string }>,
    bronze: [] as Array<{ id: number; name: string; dojo: string }>
  };

  const processedGold = new Set<number>();
  const processedSilver = new Set<number>();
  const processedBronze = new Set<number>();

  const round1Matches = matches.filter(m => m.round === 1);
  const round2Matches = matches.filter(m => m.round === 2);
  const hasAdditionalMatch = round2Matches.length > 0;

  console.log(`   Round 1: ${round1Matches.length}, Round 2: ${round2Matches.length}`);

  if (!hasAdditionalMatch) {
    // ⭐ GENAP SCENARIO
    round1Matches.forEach(match => {
      if ((match.scoreA > 0 || match.scoreB > 0) && match.participant1 && match.participant2) {
        const winner = match.scoreA > match.scoreB ? match.participant1 : match.participant2;
        const loser = match.scoreA > match.scoreB ? match.participant2 : match.participant1;

        if (!processedGold.has(winner.id)) {
          leaderboard.gold.push({
            id: winner.id,
            name: winner.name,
            dojo: winner.dojo || ''
          });
          processedGold.add(winner.id);
        }

        if (!processedSilver.has(loser.id)) {
          leaderboard.silver.push({
            id: loser.id,
            name: loser.name,
            dojo: loser.dojo || ''
          });
          processedSilver.add(loser.id);
        }
      }
    });
  } else {
    // ⭐ GANJIL SCENARIO
    const additionalMatch = round2Matches[0];
    const lastRound1Match = round1Matches[round1Matches.length - 1];

    // Additional match
    if (additionalMatch && (additionalMatch.scoreA > 0 || additionalMatch.scoreB > 0)) {
      const winner = additionalMatch.scoreA > additionalMatch.scoreB 
        ? additionalMatch.participant1 
        : additionalMatch.participant2;
      const loser = additionalMatch.scoreA > additionalMatch.scoreB 
        ? additionalMatch.participant2 
        : additionalMatch.participant1;

      if (winner) {
        leaderboard.gold.push({
          id: winner.id,
          name: winner.name,
          dojo: winner.dojo || ''
        });
        processedGold.add(winner.id);
      }

      if (loser) {
        leaderboard.silver.push({
          id: loser.id,
          name: loser.name,
          dojo: loser.dojo || ''
        });
        processedSilver.add(loser.id);
      }
    }

    // Round 1 matches
    round1Matches.forEach(match => {
      const isLastMatch = match.id === lastRound1Match?.id;
      const hasScore = match.scoreA > 0 || match.scoreB > 0;

      if (hasScore && match.participant1 && match.participant2) {
        const winner = match.scoreA > match.scoreB ? match.participant1 : match.participant2;
        const loser = match.scoreA > match.scoreB ? match.participant2 : match.participant1;

        if (isLastMatch) {
          // Last match loser = BRONZE
          if (!processedBronze.has(loser.id)) {
            leaderboard.bronze.push({
              id: loser.id,
              name: loser.name,
              dojo: loser.dojo || ''
            });
            processedBronze.add(loser.id);
          }
        } else {
          // Other matches
          if (!processedGold.has(winner.id)) {
            leaderboard.gold.push({
              id: winner.id,
              name: winner.name,
              dojo: winner.dojo || ''
            });
            processedGold.add(winner.id);
          }

          if (!processedSilver.has(loser.id)) {
            leaderboard.silver.push({
              id: loser.id,
              name: loser.name,
              dojo: loser.dojo || ''
            });
            processedSilver.add(loser.id);
          }
        }
      }
    });
  }

  return leaderboard;
};

  /**
   * 🏆 Transform PRESTASI leaderboard
   */
const transformPrestasiLeaderboard = (matches: any[]) => {
  const leaderboard = {
    gold: [] as Array<{ id: number; name: string; dojo: string }>,
    silver: [] as Array<{ id: number; name: string; dojo: string }>,
    bronze: [] as Array<{ id: number; name: string; dojo: string }>
  };

  const totalRounds = Math.max(...matches.map(m => m.round));
  const finalMatch = matches.find(m => m.round === totalRounds);

  // Final match winner = GOLD, loser = SILVER
  if (finalMatch && (finalMatch.scoreA > 0 || finalMatch.scoreB > 0)) {
    const winner = finalMatch.scoreA > finalMatch.scoreB 
      ? finalMatch.participant1 
      : finalMatch.participant2;
    const loser = finalMatch.scoreA > finalMatch.scoreB 
      ? finalMatch.participant2 
      : finalMatch.participant1;

    if (winner) {
      leaderboard.gold.push({
        id: winner.id,
        name: winner.name,
        dojo: winner.dojo || ''
      });
    }

    if (loser) {
      leaderboard.silver.push({
        id: loser.id,
        name: loser.name,
        dojo: loser.dojo || ''
      });
    }
  }

  // Semi-final losers = BRONZE
  const semiRound = totalRounds - 1;
  const semiMatches = matches.filter(m => m.round === semiRound);

  semiMatches.forEach(match => {
    if ((match.scoreA > 0 || match.scoreB > 0) && match.participant1 && match.participant2) {
      const loser = match.scoreA > match.scoreB ? match.participant2 : match.participant1;

      if (loser && !leaderboard.bronze.find(p => p.id === loser.id)) {
        leaderboard.bronze.push({
          id: loser.id,
          name: loser.name,
          dojo: loser.dojo || ''
        });
      }
    }
  });

  return leaderboard;
};

  /**
   * 📊 Aggregate semua leaderboard jadi satu
   */
  const getAggregatedLeaderboard = (): AggregatedLeaderboard => {
    const aggregated: AggregatedLeaderboard = {
      gold: [],
      silver: [],
      bronze: []
    };

    kelasList.forEach(kelas => {
      const kelasName = generateNamaKelas(kelas);

      // Add gold medals
      kelas.leaderboard.gold.forEach(participant => {
        aggregated.gold.push({ ...participant, kelasName });
      });

      // Add silver medals
      kelas.leaderboard.silver.forEach(participant => {
        aggregated.silver.push({ ...participant, kelasName });
      });

      // Add bronze medals
      kelas.leaderboard.bronze.forEach(participant => {
        aggregated.bronze.push({ ...participant, kelasName });
      });
    });

    return aggregated;
  };

  const generateNamaKelas = (kelas: KelasKejuaraan) => {
    const parts = [];
    
    if (kelas.cabang) parts.push(kelas.cabang);
    if (kelas.kategori_event?.nama_kategori) parts.push(kelas.kategori_event.nama_kategori);
    
    const isPoomsaePemula = 
      kelas.cabang === 'POOMSAE' && 
      kelas.kategori_event?.nama_kategori === 'Pemula';
    
    if (kelas.kelompok?.nama_kelompok && !isPoomsaePemula) {
      parts.push(kelas.kelompok.nama_kelompok);
    }
    
    if (kelas.kelas_berat) {
      const gender = kelas.kelas_berat.jenis_kelamin === 'LAKI_LAKI' ? 'Putra' : 'Putri';
      parts.push(gender);
    }
    
    if (kelas.kelas_berat?.nama_kelas) parts.push(kelas.kelas_berat.nama_kelas);
    if (kelas.poomsae?.nama_kelas) parts.push(kelas.poomsae.nama_kelas);
    
    return parts.length > 0 ? parts.join(' - ') : 'Kelas Tidak Lengkap';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} style={{ color: '#990D35' }} />
          <p className="text-lg font-medium" style={{ color: '#990D35' }}>
            Memuat data perolehan medali...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="text-center p-8 rounded-xl border" style={{ borderColor: '#dc2626', backgroundColor: 'white' }}>
          <Trophy size={64} style={{ color: '#dc2626', opacity: 0.5 }} className="mx-auto mb-4" />
          <p className="text-red-600 font-medium text-lg mb-2">Gagal Memuat Data</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!kompetisi || kelasList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="text-center p-12 rounded-xl" style={{ backgroundColor: 'white' }}>
          <Medal size={64} style={{ color: '#990D35', opacity: 0.3 }} className="mx-auto mb-4" />
          <p className="text-lg font-medium mb-2" style={{ color: '#050505' }}>
            Belum Ada Data Perolehan Medali
          </p>
          <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
            Hasil pertandingan belum tersedia atau belum ada kelas yang selesai
          </p>
        </div>
      </div>
    );
  }

  const currentLeaderboard = selectedView === 'overall' 
    ? getAggregatedLeaderboard()
    : kelasList.find(k => k.id_kelas_kejuaraan === selectedView)?.leaderboard;

  const currentEventName = selectedView === 'overall'
    ? `${kompetisi.nama_event} - Overall`
    : `${kompetisi.nama_event} - ${generateNamaKelas(kelasList.find(k => k.id_kelas_kejuaraan === selectedView)!)}`;

  return (
    <section className="relative w-full min-h-screen overflow-hidden py-12 md:py-16 pt-24 sm:pt-28 md:pt-32 lg:pt-36" style={{ backgroundColor: '#F5FBEF' }}>
      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 mb-12">
          <div className="hidden lg:inline-block group">
            <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 sm:pl-4 md:pl-6 relative">
              Perolehan Medali
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
            </span>
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                Medal Tally
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>

          {/* Event Info Card */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border-2 p-6" style={{ borderColor: '#990D35' }}>
            <h2 className="text-2xl font-bebas mb-4" style={{ color: '#990D35' }}>
              {kompetisi.nama_event}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {new Date(kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {' - '}
                  {new Date(kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{kompetisi.lokasi}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>{kelasList.length} Kelas</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {/* Overall Tab */}
            <button
              onClick={() => setSelectedView('overall')}
              className={`px-6 py-4 rounded-xl font-medium transition-all whitespace-nowrap ${
                selectedView === 'overall'
                  ? 'shadow-lg transform scale-105'
                  : 'opacity-60 hover:opacity-100 hover:transform hover:scale-102'
              }`}
              style={{
                backgroundColor: selectedView === 'overall' ? '#990D35' : '#fff',
                color: selectedView === 'overall' ? '#F5FBEF' : '#990D35',
                border: `2px solid ${selectedView === 'overall' ? '#990D35' : 'rgba(153, 13, 53, 0.2)'}`,
              }}
            >
              <div className="text-base font-semibold mb-1">
                📊 Overall - Semua Kelas
              </div>
              <div className="text-xs opacity-80">
                Total Medali Keseluruhan
              </div>
            </button>

            {/* Per-Kelas Tabs */}
            {kelasList.map((kelas) => (
              <button
                key={kelas.id_kelas_kejuaraan}
                onClick={() => setSelectedView(kelas.id_kelas_kejuaraan)}
                className={`px-6 py-4 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedView === kelas.id_kelas_kejuaraan
                    ? 'shadow-lg transform scale-105'
                    : 'opacity-60 hover:opacity-100 hover:transform hover:scale-102'
                }`}
                style={{
                  backgroundColor: selectedView === kelas.id_kelas_kejuaraan ? '#990D35' : '#fff',
                  color: selectedView === kelas.id_kelas_kejuaraan ? '#F5FBEF' : '#990D35',
                  border: `2px solid ${selectedView === kelas.id_kelas_kejuaraan ? '#990D35' : 'rgba(153, 13, 53, 0.2)'}`,
                }}
              >
                <div className="text-base font-semibold mb-1">
                  {generateNamaKelas(kelas)}
                </div>
                <div className="text-xs opacity-80">
                  🥇 {kelas.leaderboard.gold.length} · 
                  🥈 {kelas.leaderboard.silver.length} · 
                  🥉 {kelas.leaderboard.bronze.length}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Medal Table */}
        {currentLeaderboard && (
          <div className="max-w-6xl mx-auto">
            <DojangMedalTable
              leaderboard={currentLeaderboard}
              eventName={currentEventName}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default MedalTallyPage;