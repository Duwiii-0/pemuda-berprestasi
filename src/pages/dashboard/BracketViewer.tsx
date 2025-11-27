import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { Loader, AlertTriangle, ArrowLeft, Menu } from 'lucide-react';
import TournamentBracketPemula from '../../components/TournamentBracketPemula';
import TournamentBracketPrestasi from '../../components/TournamentBracketPrestasi';
import NavbarDashboard from '../../components/navbar/navbarDashboard';

// ✅ TAMBAHKAN TYPE DEFINITIONS (sama seperti BracketList)
interface Dojang {
  id_dojang: number;
  nama_dojang: string;
  id_kompetisi?: number;
}

interface Pelatih {
  id_pelatih: number;
  nama_pelatih: string;
  id_dojang: number;
  no_telp: string;
  kota: string;
  provinsi: string;
  alamat: string;
  tanggal_lahir: string;
  nik: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN" | null;
  dojang?: Dojang;
  id_kompetisi?: number;
}

interface User {
  id_akun: number;
  username: string;
  role: string;
  pelatih?: Pelatih;
}

const BracketViewer: React.FC = () => {
  const { kelasId } = useParams<{ kelasId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [kelasData, setKelasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

useEffect(() => {
  if (!kelasId || !token) return;

  const fetchKelasData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const getKompetisiId = async (): Promise<number | null> => {
        const currentUser = user as User | null;
        
        if (!currentUser?.pelatih) {
          console.warn('⚠️ No pelatih data in user');
          return null;
        }

        if (currentUser.pelatih.dojang?.id_kompetisi) {
          return currentUser.pelatih.dojang.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_kompetisi) {
          return currentUser.pelatih.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_dojang) {
          try {
            const dojangResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/dojang/${currentUser.pelatih.id_dojang}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (dojangResponse.ok) {
              const dojangData = await dojangResponse.json();
              const kompetisiId = dojangData.data?.id_kompetisi || dojangData.id_kompetisi;
              if (kompetisiId) return kompetisiId;
            }
          } catch (err) {
            console.error('❌ Error fetching dojang:', err);
          }
        }
        
        try {
          const kompetisiResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/kompetisi`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (kompetisiResponse.ok) {
            const kompetisiList = await kompetisiResponse.json();
            const activeKompetisi = kompetisiList.data?.find(
              (k: any) => k.status === 'SEDANG_DIMULAI' || k.status === 'AKAN_DIMULAI'
            );
            
            if (activeKompetisi) return activeKompetisi.id_kompetisi;
          }
        } catch (err) {
          console.error('❌ Error fetching kompetisi list:', err);
        }
        
        return null;
      };

      const kompetisiId = await getKompetisiId();
      
      if (!kompetisiId) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      // ✅ FETCH BRACKET DATA
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kompetisi/${kompetisiId}/brackets/${kelasId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bracket belum dibuat untuk kelas ini');
        }
        throw new Error('Gagal memuat data bracket');
      }

      const result = await response.json();
      console.log('📊 Raw bracket response:', result);

      if (!result.data) {
        throw new Error('Data bracket tidak valid');
      }

      // ✅ TRANSFORM PARTICIPANTS dari response bracket
      const transformedParticipants = (result.data.participants || []).map((p: any) => {
        // Handle team
        if (p.isTeam) {
          return {
            id_peserta_kompetisi: p.id,
            id_atlet: null,
            is_team: true,
            status: 'APPROVED',
            anggota_tim: (p.teamMembers || []).map((name: string, idx: number) => ({
              atlet: {
                id_atlet: idx,
                nama_atlet: name,
                dojang: { nama_dojang: p.dojang || '' }
              }
            }))
          };
        }
        
        // Handle individual
        return {
          id_peserta_kompetisi: p.id,
          id_atlet: p.atletId,
          is_team: false,
          status: 'APPROVED',
          atlet: {
            id_atlet: p.atletId || 0,
            nama_atlet: p.name || '',
            dojang: { nama_dojang: p.dojang || '' }
          }
        };
      });

      // ✅ TRANSFORM MATCHES (bagan) dari response bracket
      const transformedMatches = (result.data.matches || []).map((match: any) => ({
        id_bagan: match.id,
        round: match.round,
        match_number: match.matchNumber,
        peserta1_id: match.participant1Id,
        peserta2_id: match.participant2Id,
        pemenang_id: match.winnerId,
        skor_peserta1: match.score1,
        skor_peserta2: match.score2,
        status: match.status || 'BELUM_DIMULAI',
        next_match_id: match.nextMatchId
      }));

      const transformedData = {
        id_kelas_kejuaraan: parseInt(kelasId),
        cabang: result.data.cabang || 'KYORUGI',
        kategori_event: result.data.kategori_event || { nama_kategori: 'PEMULA' },
        kelompok: result.data.kelompok || { nama_kelompok: '', usia_min: 0, usia_max: 0 },
        kelas_berat: result.data.kelas_berat,
        poomsae: result.data.poomsae,
        jenis_kelamin: result.data.jenis_kelamin || 'LAKI_LAKI',
        kompetisi: result.data.kompetisi || {
          id_kompetisi: kompetisiId,
          nama_event: "Tournament",
          tanggal_mulai: new Date().toISOString(),
          tanggal_selesai: new Date().toISOString(),
          lokasi: "",
          status: "SEDANG_DIMULAI"
        },
        peserta_kompetisi: transformedParticipants,
        bagan: transformedMatches
      };
      
      console.log('✅ Transformed kelasData:', transformedData);
      console.log('✅ Participants:', transformedParticipants.length);
      console.log('✅ Matches:', transformedMatches.length);
      
      setKelasData(transformedData);
      
    } catch (err: any) {
      console.error('❌ Error fetching bracket:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchKelasData();
}, [kelasId, token, user]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

const handleBack = () => {
  const currentUser = user as User | null;
  const userRole = currentUser?.role?.toUpperCase();

  console.log('🔙 Back button clicked, role:', userRole);

  // ✅ FORCE REDIRECT dengan window.location untuk pelatih
  if (userRole === 'PELATIH') {
    window.location.href = '/dashboard/bracket-viewer';
  } else if (userRole === 'ADMIN' || userRole === 'ADMIN_KOMPETISI') {
    window.location.href = '/admin-kompetisi/drawing-bagan';
  } else {
    // Default fallback
    window.location.href = '/dashboard/bracket-viewer';
  }
};

  if (loading) {
// Di BracketViewer.tsx, HAPUS handleBack function dan langsung pass undefined:

const BracketViewer: React.FC = () => {
  const { kelasId } = useParams<{ kelasId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [kelasData, setKelasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ HAPUS handleBack function - tidak dibutuhkan lagi

  // ... useEffect code ...

  // Di render:
  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />

      <div className="lg:ml-72 min-h-screen">
        {isPemula ? (
          <TournamentBracketPemula
            kelasData={kelasData}
            onBack={undefined} // ✅ PASS undefined - tidak ada back button
            viewOnly={true}
            apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          />
        ) : (
          <TournamentBracketPrestasi
            kelasData={kelasData}
            onBack={undefined} // ✅ PASS undefined - tidak ada back button
            viewOnly={true}
            apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          />
        )}
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};
  }

if (error || !kelasData) {
  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />
      
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-red" />
            </button>
          </div>

          {/* Error Content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 lg:p-8 max-w-md w-full text-center">
              <AlertTriangle size={48} className="text-red mx-auto mb-4 opacity-50" />
              <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 mb-2">
                GAGAL MEMUAT BRACKET
              </h3>
              <p className="font-plex text-sm lg:text-base text-black/60 mb-6">
                {error || 'Bracket tidak ditemukan'}
              </p>
              {/* ✅ PERBAIKAN: onClick langsung ke handleBack */}
              <button
                onClick={handleBack}
                className="font-plex font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex justify-center items-center cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg gap-2 mx-auto"
              >
                <ArrowLeft size={18} />
                <span>Kembali</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

  const isPemula = kelasData.kategori_event?.nama_kategori?.toLowerCase().includes('pemula');

  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content - No padding/margin, let bracket component handle it */}
      <div className="lg:ml-72 min-h-screen">
        {isPemula ? (
          <TournamentBracketPemula
            kelasData={kelasData}
            onBack={handleBack}
            viewOnly={true}
            apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          />
        ) : (
          <TournamentBracketPrestasi
            kelasData={kelasData}
            onBack={handleBack}
            viewOnly={true}
            apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          />
        )}
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default BracketViewer;