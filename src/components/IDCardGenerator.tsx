import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";

interface Atlet {
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  pas_foto_path?: string;
  dojang_name?: string;
  kelas_berat?: string;
  belt?: string;
  dojang?: {
    id_dojang?: number;
    nama_dojang?: string;
    kota?: string;
    provinsi?: string;
  };
  peserta_kompetisi?: Array<{
    id_peserta_kompetisi?: number;
    status?: string;
    kelas_kejuaraan?: {
      id_kelas_kejuaraan?: number;
      cabang?: string;
      kelompok?: {
        id_kelompok?: number;
        nama_kelompok?: string;
        usia_min?: number;
        usia_max?: number;
      };
      kelas_berat?: {
        nama_kelas?: string;
      };
      poomsae?: {
        nama_kelas?: string;
      };
      kategori_event?: {
        nama_kategori?: string;
      };
      jenis_kelamin?: string;
    };
  }>;
}

interface IDCardGeneratorProps {
  atlet: Atlet;
  isEditing: boolean;
}

// Koordinat untuk overlay (dalam points: 1mm = 2.83465 pt)
const mmToPt = (mm: number) => mm * 2.83465;

const OVERLAY_COORDS = {
  photo: {
    x: mmToPt(25.5),
    y: mmToPt(297 - 95.7 - 108),
    width: mmToPt(77),
    height: mmToPt(108),
    borderRadius: mmToPt(8),
    borderWidth: 3,
    borderColor: rgb(0.85, 0.65, 0.13),
  },
  nama: {
    x: mmToPt(55),
    y: mmToPt(297 - 220),
    fontSize: 11,
  },
  kelas: {
    x: mmToPt(55),
    y: mmToPt(297 - 233),
    fontSize: 9.5,
  },
  kontingen: {
    x: mmToPt(55),
    y: mmToPt(297 - 246),
    fontSize: 11,
  },
};

export const IDCardGenerator = ({ atlet, isEditing }: IDCardGeneratorProps) => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const getPhotoUrl = (filename: string): string => {
    if (!filename) return "";
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://cjvmanagementevent.com';
    return `${baseUrl}/uploads/atlet/pas_foto/${filename}`;
  };

  const loadImageAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
    return await response.arrayBuffer();
  };

  const loadPDFAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${url}`);
    return await response.arrayBuffer();
  };

  const getKategoriTemplate = (): "pemula" | "prestasi" => {
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      return "pemula";
    }

    const approvedPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED');
    const targetPeserta = approvedPeserta || atlet.peserta_kompetisi[0];
    const kategori = targetPeserta?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase();
    
    console.log("🏆 Detected kategori:", kategori);
    
    return kategori?.includes("prestasi") ? "prestasi" : "pemula";
  };

  const generateIDCard = async () => {
    setIsGenerating(true);

    console.log("=== DEBUG ATLET DATA ===");
    console.log("Full atlet object:", atlet);
    
    const dojangName = atlet.dojang_name || atlet.dojang?.nama_dojang || "-";
    
    let kelasInfo = "";
    
    if (atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0) {
      const targetPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED') || 
                            atlet.peserta_kompetisi[0];
      
      if (targetPeserta?.kelas_kejuaraan) {
        const kj = targetPeserta.kelas_kejuaraan;
        const cabang = kj.cabang || "";
        const kelompokUsia = kj.kelompok?.nama_kelompok || "";
        const kategoriEvent = kj.kategori_event?.nama_kategori || "";
        let kelasDetail = "";
        
        if (cabang === "KYORUGI" && kj.kelas_berat?.nama_kelas) {
          kelasDetail = kj.kelas_berat.nama_kelas;
        } else if (cabang === "POOMSAE" && kj.poomsae?.nama_kelas) {
          kelasDetail = kj.poomsae.nama_kelas;
        }
        
        const parts = [];
        if (kategoriEvent) parts.push(kategoriEvent);
        if (cabang) parts.push(cabang);
        if (kelompokUsia && kelompokUsia.toLowerCase() !== 'pemula') {
          parts.push(kelompokUsia);
        } else if (kelasDetail) {
          parts.push(kelasDetail);
        }
        
        kelasInfo = parts.join(" - ") || "-";
      }
    }
    
    if (!kelasInfo) kelasInfo = atlet.kelas_berat || "-";

    console.log("Dojang:", dojangName);
    console.log("Kelas:", kelasInfo);

    try {
      const kategori = getKategoriTemplate();
      const templatePath = `/templates/e-idcard_sriwijaya_${kategori}.pdf`;
      
      console.log("📄 Using template:", templatePath, `(kategori: ${kategori})`);

      const templateBytes = await loadPDFAsArrayBuffer(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold');

      // ========== OVERLAY FOTO ATLET DENGAN BORDER ROUNDED ==========
      if (atlet.pas_foto_path) {
        try {
          const photoUrl = getPhotoUrl(atlet.pas_foto_path);
          const imageBytes = await loadImageAsArrayBuffer(photoUrl);
          
          let image;
          const photoFilename = atlet.pas_foto_path.toLowerCase();
          
          if (photoFilename.endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else if (photoFilename.endsWith('.jpg') || photoFilename.endsWith('.jpeg')) {
            image = await pdfDoc.embedJpg(imageBytes);
          } else {
            throw new Error('Unsupported image format');
          }

          const bx = OVERLAY_COORDS.photo.x;
          const by = OVERLAY_COORDS.photo.y;
          const bw = OVERLAY_COORDS.photo.width;
          const bh = OVERLAY_COORDS.photo.height;
          const br = OVERLAY_COORDS.photo.borderRadius;

          // Draw background border (lebih besar sedikit)
          firstPage.drawRectangle({
            x: bx - 2,
            y: by - 2,
            width: bw + 4,
            height: bh + 4,
            color: OVERLAY_COORDS.photo.borderColor,
            borderRadius: br,
          });

          // Draw white background untuk image
          firstPage.drawRectangle({
            x: bx,
            y: by,
            width: bw,
            height: bh,
            color: rgb(1, 1, 1),
            borderRadius: br - 1,
          });

          // Draw image
          firstPage.drawImage(image, {
            x: bx,
            y: by,
            width: bw,
            height: bh,
          });

          // Draw border foreground (overlay)
          firstPage.drawRectangle({
            x: bx,
            y: by,
            width: bw,
            height: bh,
            borderColor: OVERLAY_COORDS.photo.borderColor,
            borderWidth: OVERLAY_COORDS.photo.borderWidth,
            borderRadius: br,
          });

        } catch (error) {
          console.error("Failed to embed photo:", error);
          firstPage.drawText(atlet.nama_atlet.charAt(0).toUpperCase(), {
            x: OVERLAY_COORDS.photo.x + OVERLAY_COORDS.photo.width / 2 - 20,
            y: OVERLAY_COORDS.photo.y + OVERLAY_COORDS.photo.height / 2,
            size: 48,
            font: helveticaFont,
            color: rgb(0.7, 0.7, 0.7),
          });
        }
      }

      // ========== OVERLAY TEXT DATA ==========
      const textColor = rgb(0.04, 0.13, 0.41);

      firstPage.drawText(atlet.nama_atlet, {
        x: OVERLAY_COORDS.nama.x,
        y: OVERLAY_COORDS.nama.y,
        size: OVERLAY_COORDS.nama.fontSize,
        font: helveticaFont,
        color: textColor,
      });

      firstPage.drawText(kelasInfo, {
        x: OVERLAY_COORDS.kelas.x,
        y: OVERLAY_COORDS.kelas.y,
        size: OVERLAY_COORDS.kelas.fontSize,
        font: helveticaFont,
        color: textColor,
      });

      firstPage.drawText(dojangName, {
        x: OVERLAY_COORDS.kontingen.x,
        y: OVERLAY_COORDS.kontingen.y,
        size: OVERLAY_COORDS.kontingen.fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // ========== SAVE PDF ==========
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `ID-Card-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`;
      link.click();

      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating ID card:", error);
      alert("Gagal generate ID Card: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide">
          ID CARD ATLET
        </h3>

        {!isEditing && (
          <div className="flex gap-2 flex-wrap">
            {!hasGenerated ? (
              <button
                onClick={generateIDCard}
                disabled={isGenerating || !atlet.pas_foto_path}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                {isGenerating ? "Generating..." : "Generate ID Card"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg"
                >
                  <Eye size={18} />
                  Lihat Preview
                </button>
                <button
                  onClick={generateIDCard}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg"
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
          <p className="text-yellow-800 font-medium text-sm">
            ⚠️ Foto atlet belum tersedia. Upload foto terlebih dahulu untuk generate ID Card.
          </p>
        </div>
      )}

      <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h4 className="font-semibold text-purple-900 mb-2 text-sm">🏆 Deteksi Kategori:</h4>
        <p className="text-xs text-purple-800">
          Template akan otomatis dipilih berdasarkan kategori event (Pemula/Prestasi)
        </p>
        {atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0 && (
          <p className="text-xs text-purple-600 mt-1 font-mono">
            Kategori: {atlet.peserta_kompetisi[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori || "N/A"}
          </p>
        )}
      </div>

      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bebas text-2xl text-black/80">Preview ID Card</h4>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="flex justify-center">
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] border-2 border-gray-300 rounded-lg"
                title="ID Card Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;