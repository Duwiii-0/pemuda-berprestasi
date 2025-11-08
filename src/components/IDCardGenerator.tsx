// src/components/IDCardGenerator.tsx
import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import type { Atlet } from "../context/AtlitContext";

interface IDCardGeneratorProps {
  atlet: Atlet & {
    pas_foto_path?: string;
    dojang_name?: string;
    kelas_berat?: string;
  };
  isEditing: boolean;
}

export const IDCardGenerator = ({ atlet, isEditing }: IDCardGeneratorProps) => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getPhotoUrl = (filename: string): string => {
    if (!filename) return "";
    return `${process.env.REACT_APP_API_BASE_URL || 'http://cjvmanagementevent.com'}/uploads/atlet/pas_foto/${filename}`;
  };

  const generateIDCard = async () => {
    setIsGenerating(true);
    try {
      // Tunggu sebentar untuk memastikan preview di-render
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById('id-card-preview');
      if (!element) {
        throw new Error('ID Card element not found');
      }

      // Generate canvas dari element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Convert ke blob dan download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ID-Card-${atlet.nama_atlet.replace(/\s/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          setHasGenerated(true);
          setShowPreview(false);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Gagal generate ID Card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewIDCard = () => {
    setShowPreview(true);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide">
          ID CARD ATLET
        </h3>
        
        {!isEditing && (
          <div className="flex gap-2">
            {!hasGenerated ? (
              <button
                onClick={generateIDCard}
                disabled={isGenerating || !atlet.pas_foto_path}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 text-white rounded-xl font-plex text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                {isGenerating ? "Generating..." : "Generate ID Card"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleViewIDCard}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-plex text-sm lg:text-base transition-all duration-300 shadow-lg"
                >
                  <Eye size={18} />
                  Lihat ID Card
                </button>
                <button
                  onClick={generateIDCard}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-plex text-sm lg:text-base transition-all duration-300 shadow-lg"
                >
                  <Download size={18} />
                  Download Ulang
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!atlet.pas_foto_path && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 font-plex text-sm">
            ⚠️ Foto atlet belum tersedia. Upload foto terlebih dahulu untuk generate ID Card.
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bebas text-2xl text-black/80">Preview ID Card</h4>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="flex justify-center">
              <IDCardPreview atlet={atlet} getPhotoUrl={getPhotoUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden preview for canvas generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <IDCardPreview atlet={atlet} getPhotoUrl={getPhotoUrl} />
      </div>
    </div>
  );
};

// Komponen terpisah untuk preview ID Card
interface IDCardPreviewProps {
  atlet: Atlet & {
    pas_foto_path?: string;
    dojang_name?: string;
    kelas_berat?: string;
  };
  getPhotoUrl: (filename: string) => string;
}

const IDCardPreview = ({ atlet, getPhotoUrl }: IDCardPreviewProps) => {
  return (
    <div
      id="id-card-preview"
      className="relative bg-gradient-to-br from-yellow-50 to-orange-50"
      style={{
        width: '744px',
        height: '1052px',
        padding: '40px',
      }}
    >
      {/* Header with Logos */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-4">
          {/* Logo placeholders - ganti dengan logo asli */}
          <div className="w-16 h-16 bg-red-600 rounded-full"></div>
          <div className="w-16 h-16 bg-green-600 rounded-full"></div>
          <div className="w-16 h-16 bg-blue-600 rounded-full"></div>
        </div>
        <div className="w-24 h-16 bg-blue-500 rounded"></div>
      </div>

      {/* Crown Image */}
      <div className="flex justify-center mb-4">
        <div className="w-32 h-32 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full"></div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-bebas text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 tracking-wider mb-2">
          SRIWIJAYA
        </h1>
        <p className="font-bebas text-2xl text-gray-700 tracking-wide">
          INTERNATIONAL TAEKWONDO
        </p>
        <p className="font-bebas text-2xl text-gray-700 tracking-wide">
          CHAMPIONSHIP 2025
        </p>
      </div>

      {/* Main Content */}
      <div className="flex gap-8 mb-8">
        {/* Photo */}
        <div className="w-80 h-96 border-4 border-yellow-600 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
          {atlet.pas_foto_path ? (
            <img
              src={getPhotoUrl(atlet.pas_foto_path)}
              alt={atlet.nama_atlet}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-6xl text-gray-400 font-bebas">
                {atlet.nama_atlet.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* No. Partai & Color Boxes */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="bg-yellow-400 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bebas text-gray-800">1</div>
            <div className="text-xl font-plex text-gray-700">No. Partai</div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-center">
            <div className="text-5xl font-bebas text-white">2</div>
            <div className="text-xl font-plex text-white">Biru / Merah</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 border-4 border-yellow-600 rounded-xl bg-white"></div>
            <div className="h-24 border-4 border-yellow-600 rounded-xl bg-white"></div>
          </div>
        </div>
      </div>

      {/* Athlete Info */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-4">
          <span className="font-bebas text-2xl text-blue-800 w-32">Nama</span>
          <span className="font-bebas text-2xl text-blue-800">:</span>
          <div className="flex-1 border-b-2 border-gray-400 pb-1">
            <span className="font-plex text-xl text-gray-800">{atlet.nama_atlet}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="font-bebas text-2xl text-blue-800 w-32">Kelas</span>
          <span className="font-bebas text-2xl text-blue-800">:</span>
          <div className="flex-1 border-b-2 border-gray-400 pb-1">
            <span className="font-plex text-xl text-gray-800">{atlet.kelas_berat || '-'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="font-bebas text-2xl text-blue-800 w-32">Kontingen</span>
          <span className="font-bebas text-2xl text-blue-800">:</span>
          <div className="flex-1 border-b-2 border-gray-400 pb-1">
            <span className="font-plex text-xl text-gray-800">{atlet.dojang_name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div className="flex gap-4">
          <div className="w-20 h-24 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-full"></div>
          <div className="w-20 h-24 bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-full"></div>
          <div className="w-20 h-24 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-t-full"></div>
        </div>
        
        <div className="text-right">
          <div className="font-bebas text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            ATLET
          </div>
          <div className="flex items-center gap-2 justify-end mt-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-600 font-plex mt-1">Ruang Pemanasan</div>
          <div className="text-sm text-gray-600 font-plex">Arena Pertandingan</div>
        </div>
      </div>
    </div>
  );
};

export default IDCardGenerator;