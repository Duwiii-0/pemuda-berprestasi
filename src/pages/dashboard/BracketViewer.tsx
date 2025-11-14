import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { Loader, AlertTriangle, ArrowLeft } from 'lucide-react';
import TournamentBracketPemula from '../../components/TournamentBracketPemula';
import TournamentBracketPrestasi from '../../components/TournamentBracketPrestasi';

const BracketViewer: React.FC = () => {
  const { kelasId } = useParams<{ kelasId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [kelasData, setKelasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kelasId || !token) return;

    const fetchKelasData = async () => {
      try {
        setLoading(true);
        
        // Ambil ID kompetisi dari user pelatih
        const kompetisiId = user?.pelatih?.dojang?.id_kompetisi;
        
        if (!kompetisiId) {
          throw new Error('Kompetisi tidak ditemukan untuk dojang Anda');
        }

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
        
        // Transform data sesuai format yang dibutuhkan
        if (result.data) {
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
            peserta_kompetisi: result.data.participants || [],
            bagan: []
          };
          
          setKelasData(transformedData);
        }
      } catch (err: any) {
        console.error('Error fetching bracket:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKelasData();
  }, [kelasId, token, user]);

  const handleBack = () => {
    navigate('/dashboard/bracket-viewer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat bracket...</p>
        </div>
      </div>
    );
  }

  if (error || !kelasData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="rounded-xl shadow-sm border p-6 max-w-md w-full text-center" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
          <AlertTriangle size={48} style={{ color: '#990D35', opacity: 0.5 }} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#050505' }}>
            Gagal Memuat Bracket
          </h3>
          <p className="text-sm mb-4" style={{ color: '#050505', opacity: 0.6 }}>
            {error || 'Bracket tidak ditemukan'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)', color: 'white' }}
          >
            <div className="flex items-center gap-2 justify-center">
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isPemula = kelasData.kategori_event?.nama_kategori?.toLowerCase().includes('pemula');

  return isPemula ? (
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
  );
};

export default BracketViewer;