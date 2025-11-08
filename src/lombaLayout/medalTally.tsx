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
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!idKompetisi) return;
    fetchMedalData();
  }, [idKompetisi]);

const fetchMedalData = async () => {
  if (!idKompetisi) return;

  try {
    setLoading(true);
    
    console.log('Fetching medal data for kompetisi:', idKompetisi);
    
    // Fetch dari PUBLIC endpoint (NO AUTH!)
    const response = await fetch(`/api/public/kompetisi/${idKompetisi}/medal-tally`);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch medal data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Medal data response:', result);
    
    if (!result.success) {
      throw new Error('Failed to fetch medal data');
    }

    // Set kompetisi info
    if (result.data.kompetisi) {
      setKompetisi(result.data.kompetisi);
    }

    // Process kelas data dengan bracket
    const kelasWithLeaderboard = result.data.kelas
      .filter((kelas: any) => kelas.bracket && kelas.bracket.matches.length > 0)
      .map((kelas: any) => {
        console.log(`Processing kelas: ${kelas.id_kelas_kejuaraan}`);
        
        // Detect kategori (PEMULA atau PRESTASI)
        const isPemula = kelas.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
        
        console.log(`Type: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);
        console.log(`Total matches: ${kelas.bracket.matches.length}`);
        
        // Transform leaderboard
        const leaderboard = transformLeaderboard(kelas.bracket.matches, isPemula);
        
        console.log(`Leaderboard:`, leaderboard);
        
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

    console.log(`Total kelas dengan medali: ${kelasWithLeaderboard.length}`);
    setKelasList(kelasWithLeaderboard);

  } catch (err: any) {
    console.error('Error fetching medal data:', err);
    setError(err.message || 'Gagal memuat data perolehan medali');
  } finally {
    setLoading(false);
  }
};

  /**
   * Transform bracket data menjadi leaderboard
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
   * Transform PEMULA leaderboard
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

  console.log(`Round 1: ${round1Matches.length}, Round 2: ${round2Matches.length}`);

  if (!hasAdditionalMatch) {
    // GENAP SCENARIO
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
    // GANJIL SCENARIO
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
   * Transform PRESTASI leaderboard
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
   * Aggregate semua leaderboard jadi satu
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

  const handleViewChange = (newView: 'overall' | number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedView(newView);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden py-8 md:py-12 pt-32 sm:pt-36 md:pt-40" style={{ backgroundColor: '#F5FBEF' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
          <div className="hidden lg:inline-block group">
            <span className="font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 pl-3 sm:pl-4 md:pl-6 relative" style={{ color: '#990D35', borderColor: '#990D35' }}>
              Perolehan Medali
              <div className="absolute -left-1 top-0 bottom-0 w-1 transition-colors duration-300" style={{ backgroundColor: 'rgba(153, 13, 53, 0.2)' }}></div>
            </span>
          </div>

          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent" style={{ color: '#990D35' }}>
                MEDAL TALLY
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 rounded-full" style={{ background: 'linear-gradient(to right, #990D35, rgba(153, 13, 53, 0.6))' }}></div>
          </div>

          {/* Event Info Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border-2 p-4 sm:p-6" style={{ borderColor: '#990D35' }}>
            <h2 className="text-xl sm:text-2xl font-bebas mb-3 sm:mb-4" style={{ color: '#990D35' }}>
              {kompetisi.nama_event}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm" style={{ color: '#050505', opacity: 0.7 }}>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">
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
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{kompetisi.lokasi}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <Award size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{kelasList.length} Kelas</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Selector - Dropdown Style */}
        <div className="mb-6 sm:mb-8 max-w-4xl mx-auto">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#990D35' }}>
            Pilih Kategori Lomba:
          </label>
          <div className="relative">
            <select
              value={selectedView}
              onChange={(e) => handleViewChange(e.target.value === 'overall' ? 'overall' : Number(e.target.value))}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium text-sm sm:text-base appearance-none cursor-pointer shadow-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: '#990D35',
                color: '#F5FBEF',
                border: '2px solid #990D35',
              }}
            >
              <option value="overall">Overall - Semua Kelas (Total Medali Keseluruhan)</option>
              {kelasList.map((kelas) => (
                <option key={kelas.id_kelas_kejuaraan} value={kelas.id_kelas_kejuaraan}>
                  {generateNamaKelas(kelas)} - Emas: {kelas.leaderboard.gold.length}, Perak: {kelas.leaderboard.silver.length}, Perunggu: {kelas.leaderboard.bronze.length}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="#F5FBEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Medal Table with Animation */}
        {currentLeaderboard && (
          <div 
            className={`max-w-5xl mx-auto mb-12 transition-all duration-300 ${
              isTransitioning 
                ? 'opacity-0 transform scale-95' 
                : 'opacity-100 transform scale-100'
            }`}
          >
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