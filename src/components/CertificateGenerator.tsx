import { useState, useEffect } from "react";
import { Download, Eye, Award, AlertCircle } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";

interface Atlet {
  id_atlet?: number;
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
    ranking?: number;
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

interface CertificateGeneratorProps {
  atlet: Atlet;
  isEditing: boolean;
}

// Koordinat dalam MM untuk penempatan teks pada sertifikat
const COORDS_MM = {
  nama: {
    x: 148.5, // center horizontal (A4 = 297mm / 2)
    y: 120,
    fontSize: 24,
  },
  kelas: {
    x: 148.5,
    y: 145,
    fontSize: 14,
  },
  tanggal: {
    x: 148.5,
    y: 220,
    fontSize: 12,
  },
};

export const CertificateGenerator = ({ atlet, isEditing }: CertificateGeneratorProps) => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cachedPdfBlob, setCachedPdfBlob] = useState<Blob | null>(null);

  // Check localStorage saat component mount
  useEffect(() => {
    const storageKey = `certificate_generated_${atlet.id_atlet || atlet.nama_atlet}`;
    const hasGeneratedBefore = localStorage.getItem(storageKey);
    
    if (hasGeneratedBefore === 'true') {
      setHasGenerated(true);
      console.log("✅ Certificate sudah pernah di-generate sebelumnya");
    }
  }, [atlet]);

  // Validasi apakah bisa generate Certificate
  const canGenerateCertificate = (): { canGenerate: boolean; reason: string } => {
    // 1. Cek peserta kompetisi
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      return { 
        canGenerate: false, 
        reason: "Belum terdaftar dalam kompetisi" 
      };
    }

    // 2. Cek apakah ada yang APPROVED dan punya ranking (juara)
    const hasWinner = atlet.peserta_kompetisi.some(
      p => p.status === 'APPROVED' && p.ranking && p.ranking <= 3
    );
    
    if (!hasWinner) {
      return { 
        canGenerate: false, 
        reason: "Atlet belum menjadi juara (ranking 1-3)" 
      };
    }

    return { canGenerate: true, reason: "" };
  };

  const validation = canGenerateCertificate();

  const loadPDFAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${url}`);
    return await response.arrayBuffer();
  };

  const getKelasKejuaraan = (): string => {
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      return "-";
    }

    const winnerPeserta = atlet.peserta_kompetisi.find(
      p => p.status === 'APPROVED' && p.ranking && p.ranking <= 3
    );

    if (!winnerPeserta?.kelas_kejuaraan) {
      return atlet.kelas_berat || "-";
    }

    const kj = winnerPeserta.kelas_kejuaraan;
    const cabang = kj.cabang || "";
    const kelompokUsia = kj.kelompok?.nama_kelompok || "";
    const kategoriEvent = kj.kategori_event?.nama_kategori || "";
    const jenisKelamin = kj.jenis_kelamin || "";
    
    let kelasDetail = "";
    
    if (cabang === "KYORUGI" && kj.kelas_berat?.nama_kelas) {
      kelasDetail = kj.kelas_berat.nama_kelas;
    } else if (cabang === "POOMSAE" && kj.poomsae?.nama_kelas) {
      kelasDetail = kj.poomsae.nama_kelas;
    }
    
    const parts = [];
    if (kategoriEvent) parts.push(kategoriEvent);
    if (cabang) parts.push(cabang);
    if (jenisKelamin) parts.push(jenisKelamin === "LAKI_LAKI" ? "Putra" : "Putri");
    if (kelompokUsia) parts.push(kelompokUsia);
    if (kelasDetail) parts.push(kelasDetail);
    
    return parts.join(" - ") || "-";
  };

  const getRanking = (): number => {
    const winnerPeserta = atlet.peserta_kompetisi?.find(
      p => p.status === 'APPROVED' && p.ranking && p.ranking <= 3
    );
    return winnerPeserta?.ranking || 0;
  };

  const getRankingText = (ranking: number): string => {
    switch(ranking) {
      case 1: return "Juara 1";
      case 2: return "Juara 2";
      case 3: return "Juara 3";
      default: return "-";
    }
  };

  const getCurrentDate = (): string => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const date = new Date();
    return `Palembang, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const generateCertificate = async () => {
    // Validasi sebelum generate
    if (!validation.canGenerate) {
      alert(`Tidak dapat generate Certificate: ${validation.reason}`);
      return;
    }

    setIsGenerating(true);

    console.log("=== DEBUG CERTIFICATE GENERATION ===");
    
    const kelasKejuaraan = getKelasKejuaraan();
    const ranking = getRanking();
    const rankingText = getRankingText(ranking);
    
    console.log("Nama Atlet:", atlet.nama_atlet);
    console.log("Kelas Kejuaraan:", kelasKejuaraan);
    console.log("Ranking:", ranking, "-", rankingText);

    try {
      // Template path - sesuaikan dengan lokasi template Anda
      const templatePath = `/templates/certificate_sriwijaya.pdf`;
      
      console.log("📄 Using template:", templatePath);

      const templateBytes = await loadPDFAsArrayBuffer(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Load fonts
      const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
      const helvetica = await pdfDoc.embedFont('Helvetica');

      const mmToPt = (mm: number) => mm * 2.83465;

      // Warna teks (dark blue/black)
      const textColor = rgb(0.04, 0.13, 0.41);
      const goldColor = rgb(0.85, 0.65, 0.13);

      // Draw Nama Atlet (centered, bold, large)
      const namaWidth = helveticaBold.widthOfTextAtSize(atlet.nama_atlet, COORDS_MM.nama.fontSize);
      firstPage.drawText(atlet.nama_atlet, {
        x: (pageWidth - namaWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM.nama.y),
        size: COORDS_MM.nama.fontSize,
        font: helveticaBold,
        color: textColor,
      });

      // Draw Ranking Text
      const rankingFullText = `${rankingText} - ${kelasKejuaraan}`;
      const kelasWidth = helvetica.widthOfTextAtSize(rankingFullText, COORDS_MM.kelas.fontSize);
      firstPage.drawText(rankingFullText, {
        x: (pageWidth - kelasWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM.kelas.y),
        size: COORDS_MM.kelas.fontSize,
        font: helvetica,
        color: textColor,
      });

      // Draw Date
      const dateText = getCurrentDate();
      const dateWidth = helvetica.widthOfTextAtSize(dateText, COORDS_MM.tanggal.fontSize);
      firstPage.drawText(dateText, {
        x: (pageWidth - dateWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM.tanggal.y),
        size: COORDS_MM.tanggal.fontSize,
        font: helvetica,
        color: textColor,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCachedPdfBlob(blob);
      setPreviewUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${atlet.nama_atlet.replace(/\s/g, "-")}-${rankingText.replace(/\s/g, "-")}.pdf`;
      link.click();

      const storageKey = `certificate_generated_${atlet.id_atlet || atlet.nama_atlet}`;
      localStorage.setItem(storageKey, 'true');

      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Gagal generate Certificate: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!validation.canGenerate) {
      alert(`Tidak dapat melihat preview: ${validation.reason}`);
      return;
    }

    if (cachedPdfBlob) {
      const url = URL.createObjectURL(cachedPdfBlob);
      setPreviewUrl(url);
      setShowPreview(true);
    } else {
      await generateCertificate();
      setShowPreview(true);
    }
  };

  const handleDownloadAgain = async () => {
    if (!validation.canGenerate) {
      alert(`Tidak dapat download: ${validation.reason}`);
      return;
    }

    if (cachedPdfBlob) {
      const url = URL.createObjectURL(cachedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const ranking = getRanking();
      const rankingText = getRankingText(ranking);
      link.download = `Certificate-${atlet.nama_atlet.replace(/\s/g, "-")}-${rankingText.replace(/\s/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      await generateCertificate();
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide">
          SERTIFIKAT KEJUARAAN
        </h3>

        {!isEditing && (
          <div className="flex gap-2 flex-wrap">
            {!hasGenerated ? (
              <button
                onClick={generateCertificate}
                disabled={isGenerating || !validation.canGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title={!validation.canGenerate ? validation.reason : "Generate Certificate"}
              >
                <Award size={18} />
                {isGenerating ? "Generating..." : "Generate Certificate"}
              </button>
            ) : (
              <>
                <button
                  onClick={handlePreview}
                  disabled={isGenerating || !validation.canGenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!validation.canGenerate ? validation.reason : "Lihat Preview"}
                >
                  <Eye size={18} />
                  {isGenerating ? "Generating..." : "Lihat Preview"}
                </button>
                <button
                  onClick={handleDownloadAgain}
                  disabled={isGenerating || !validation.canGenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!validation.canGenerate ? validation.reason : "Download Ulang"}
                >
                  <Download size={18} />
                  {isGenerating ? "Generating..." : "Download Ulang"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {!validation.canGenerate && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-800 font-semibold text-sm mb-1">
                Tidak Dapat Generate Certificate
              </p>
              <p className="text-yellow-700 text-sm">
                {validation.reason}
              </p>
              <ul className="mt-2 text-xs text-yellow-600 space-y-1 list-disc list-inside">
                <li>Peserta kompetisi: {atlet.peserta_kompetisi?.length ? `✅ ${atlet.peserta_kompetisi.length} peserta` : "❌ Belum terdaftar"}</li>
                <li>Status APPROVED: {atlet.peserta_kompetisi?.some(p => p.status === 'APPROVED') ? "✅ Ada" : "❌ Belum ada"}</li>
                <li>Ranking Juara (1-3): {atlet.peserta_kompetisi?.some(p => p.ranking && p.ranking <= 3) ? `✅ Ranking ${getRanking()}` : "❌ Belum juara"}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-semibold text-amber-900 mb-2 text-sm">🏆 Info Kejuaraan:</h4>
        {atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0 && (
          <>
            <p className="text-xs text-amber-800">
              <strong>Kelas:</strong> {getKelasKejuaraan()}
            </p>
            {getRanking() > 0 && (
              <p className="text-xs text-amber-800 mt-1">
                <strong>Peringkat:</strong> {getRankingText(getRanking())}
              </p>
            )}
          </>
        )}
        {(!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) && (
          <p className="text-xs text-amber-600">Belum terdaftar dalam kompetisi</p>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bebas text-2xl text-black/80">Preview Certificate</h4>
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
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateGenerator;