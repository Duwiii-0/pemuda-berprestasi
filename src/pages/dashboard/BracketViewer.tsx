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
      
      // ✅ HELPER FUNCTION dengan proper typing
      const getKompetisiId = async (): Promise<number | null> => {
        const currentUser = user as User | null;
        
        if (!currentUser?.pelatih) {
          console.warn('⚠️ No pelatih data in user');
          return null;
        }

        if (currentUser.pelatih.dojang?.id_kompetisi) {
          console.log('✅ Found from user.pelatih.dojang:', currentUser.pelatih.dojang.id_kompetisi);
          return currentUser.pelatih.dojang.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_kompetisi) {
          console.log('✅ Found from user.pelatih:', currentUser.pelatih.id_kompetisi);
          return currentUser.pelatih.id_kompetisi;
        }
        
        if (currentUser.pelatih.id_dojang) {
          console.log('⚠️ Fetching dojang data for kompetisi ID...');
          try {
            const dojangResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/dojang/${currentUser.pelatih.id_dojang}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (dojangResponse.ok) {
              const dojangData = await dojangResponse.json();
              const kompetisiId = dojangData.data?.id_kompetisi || dojangData.id_kompetisi;
              if (kompetisiId) {
                console.log('✅ Found from dojang API:', kompetisiId);
                return kompetisiId;
              }
            }
          } catch (err) {
            console.error('❌ Error fetching dojang:', err);
          }
        }
        
        console.warn('⚠️ No kompetisi in user data, fetching active competition...');
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
            
            if (activeKompetisi) {
              console.log('✅ Using active kompetisi:', activeKompetisi.id_kompetisi);
              return activeKompetisi.id_kompetisi;
            }
          }
        } catch (err) {
          console.error('❌ Error fetching kompetisi list:', err);
        }
        
        return null;
      };

      const kompetisiId = await getKompetisiId();
      
      if (!kompetisiId) {
        throw new Error('Kompetisi tidak ditemukan. Pastikan dojang sudah terdaftar dalam kompetisi aktif.');
      }

      console.log('🔍 Fetching bracket for kompetisi:', kompetisiId, 'kelas:', kelasId);

      // Fetch data bracket
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kompetisi/${kompetisiId}/brackets/${kelasId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bracket belum dibuat untuk kelas ini');
        }
        throw new Error('Gagal memuat data bracket');
      }

      const result = await response.json();
      console.log('📊 Bracket data received:', result);
      console.log('📊 Raw participants from API:', result.data?.participants); // ⭐ LOG
      console.log('📊 Participants count:', result.data?.participants?.length || 0); // ⭐ LOG
      
      // ✅ Transform data dengan PROPER PARTICIPANT MAPPING
      if (result.data) {
        // ⭐ MAP participants ke format peserta_kompetisi yang expected
        const pesertaKompetisi = (result.data.participants || []).map((p: any) => ({
          id_peserta_kompetisi: p.id,
          id_atlet: p.atletId,
          is_team: p.isTeam || false,
          status: 'APPROVED', // Peserta di bracket pasti approved
          atlet: p.isTeam ? undefined : {
            id_atlet: p.atletId || 0,
            nama_atlet: p.name || '',
            dojang: {
              nama_dojang: p.dojang || ''
            }
          },
          anggota_tim: p.isTeam && p.teamMembers ? p.teamMembers.map((name: string) => ({
            atlet: {
              nama_atlet: name,
              dojang: { nama_dojang: p.dojang || '' }
            }
          })) : undefined
        }));

        console.log(`✅ Transformed ${pesertaKompetisi.length} participants`); // ⭐ LOG

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
          peserta_kompetisi: pesertaKompetisi, // ⭐ GUNAKAN ARRAY YANG SUDAH DI-MAP
          bagan: []
        };
        
        console.log('✅ Final kelasData:', transformedData); // ⭐ LOG
        console.log('✅ peserta_kompetisi count:', transformedData.peserta_kompetisi.length); // ⭐ LOG
        
        setKelasData(transformedData);
      }
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
    navigate('/dashboard/bracket-viewer');
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
            <p className="font-plex text-black/60">Memuat bracket...</p>
          </div>
        </div>
      </div>
    );
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