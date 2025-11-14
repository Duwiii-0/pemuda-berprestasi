import { useState, useEffect } from "react";
import { Download, Eye, FileText, AlertCircle } from "lucide-react";
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

// Koordinat dalam MM (akan dikonversi saat digunakan)
const COORDS_MM = {
  photo: {
    x: 11,
    y: 42.4,
    width: 35,
    height: 47,
    borderRadius: 3,
  },
  nama: {
    x: 24.5,
    y: 96,
    fontSize: 7,
  },
  kelas: {
    x: 24.5,
    y: 102,
    fontSize: 7,
  },
  kontingen: {
    x: 24.5,
    y: 107,
    fontSize: 7,
  },
};

export const IDCardGenerator = ({ atlet, isEditing }: IDCardGeneratorProps) => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cachedPdfBlob, setCachedPdfBlob] = useState<Blob | null>(null);

  // Check localStorage saat component mount
  useEffect(() => {
    const storageKey = `idcard_generated_${atlet.id_atlet || atlet.nama_atlet}`;
    const hasGeneratedBefore = localStorage.getItem(storageKey);
    
    if (hasGeneratedBefore === 'true') {
      setHasGenerated(true);
      console.log("✅ ID Card sudah pernah di-generate sebelumnya");
    }
  }, [atlet]);

  // Validasi apakah bisa generate ID Card
  const canGenerateIDCard = (): { canGenerate: boolean; reason: string } => {
    // 1. Cek pas foto
    if (!atlet.pas_foto_path) {
      return { 
        canGenerate: false, 
        reason: "Pas foto belum tersedia" 
      };
    }

    // 2. Cek peserta kompetisi
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      return { 
        canGenerate: false, 
        reason: "Belum terdaftar dalam kompetisi" 
      };
    }

    // 3. Cek apakah ada yang APPROVED
    const hasApproved = atlet.peserta_kompetisi.some(p => p.status === 'APPROVED');
    if (!hasApproved) {
      return { 
        canGenerate: false, 
        reason: "Belum ada peserta dengan status APPROVED" 
      };
    }

    return { canGenerate: true, reason: "" };
  };

  const validation = canGenerateIDCard();

  const getPhotoUrl = (filename: string): string => {
    if (!filename) return "";
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://cjvmanagementevent.com';
    return `${baseUrl}/uploads/atlet/pas_foto/${filename}`;
  };

  const createRoundedImage = async (url: string, radiusMM: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        const targetWidth = COORDS_MM.photo.width * 11.811;
        const targetHeight = COORDS_MM.photo.height * 11.811;
        const radius = radiusMM * 11.811;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.clearRect(0, 0, targetWidth, targetHeight);

        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(targetWidth - radius, 0);
        ctx.quadraticCurveTo(targetWidth, 0, targetWidth, radius);
        ctx.lineTo(targetWidth, targetHeight - radius);
        ctx.quadraticCurveTo(targetWidth, targetHeight, targetWidth - radius, targetHeight);
        ctx.lineTo(radius, targetHeight);
        ctx.quadraticCurveTo(0, targetHeight, 0, targetHeight - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const loadPDFAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${url}`);
    return await response.arrayBuffer();
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const getKategoriTemplate = (): "pemula" | "prestasi" => {
    console.log("🔍 === KATEGORI DETECTION DEBUG ===");
    console.log("peserta_kompetisi array:", atlet.peserta_kompetisi);
    
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      console.log("❌ No peserta_kompetisi found, defaulting to PEMULA");
      return "pemula";
    }

    console.log(`📊 Found ${atlet.peserta_kompetisi.length} peserta(s)`);
    
    atlet.peserta_kompetisi.forEach((p, idx) => {
      console.log(`\n--- Peserta ${idx + 1} ---`);
      console.log("  Status:", p.status);
      console.log("  kelas_kejuaraan:", p.kelas_kejuaraan);
      if (p.kelas_kejuaraan) {
        console.log("    kategori_event:", p.kelas_kejuaraan.kategori_event);
        if (p.kelas_kejuaraan.kategori_event) {
          console.log("      nama_kategori:", p.kelas_kejuaraan.kategori_event.nama_kategori);
        }
      }
    });

    const approvedPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED');
    const targetPeserta = approvedPeserta || atlet.peserta_kompetisi[0];
    
    console.log("\n🎯 Selected peserta:", targetPeserta);
    console.log("  Status:", targetPeserta?.status);

    const kategoriObj = targetPeserta?.kelas_kejuaraan?.kategori_event;
    console.log("kategori_event object:", kategoriObj);
    
    const namaKategori = kategoriObj?.nama_kategori;
    console.log("nama_kategori (raw):", namaKategori);
    console.log("nama_kategori (type):", typeof namaKategori);
    
    const kategoriLower = namaKategori?.toLowerCase();
    console.log("nama_kategori (lowercase):", kategoriLower);
    
    const isPrestasi = kategoriLower?.includes("prestasi");
    console.log("Contains 'prestasi'?:", isPrestasi);
    
    const result = isPrestasi ? "prestasi" : "pemula";
    console.log(`\n✅ FINAL RESULT: ${result.toUpperCase()}`);
    console.log("=================================\n");
    
    return result;
  };

const generateIDCard = async () => {
  // Validasi sebelum generate
  if (!validation.canGenerate) {
    alert(`Tidak dapat generate ID Card: ${validation.reason}`);
    return;
  }

  setIsGenerating(true);

  console.log("=== DEBUG ATLET DATA ===");
  
  const dojangName = atlet.dojang_name || atlet.dojang?.nama_dojang || "-";
  
  // ✅ PERBAIKAN: Ambil kelasInfo dengan lengkap seperti di AllPeserta
  let kelasInfo = "";
  
  if (atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0) {
    const targetPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED') || 
                          atlet.peserta_kompetisi[0];
    
    if (targetPeserta?.kelas_kejuaraan) {
      const kj = targetPeserta.kelas_kejuaraan;
      
      // Ambil semua komponen
      const cabang = kj.cabang || "";
      const kategoriEvent = kj.kategori_event?.nama_kategori || "";
      const kelompokUsia = kj.kelompok?.nama_kelompok || "";
      
      // Tentukan kelas detail berdasarkan cabang
      let kelasDetail = "";
      if (cabang === "KYORUGI" && kj.kelas_berat?.nama_kelas) {
        kelasDetail = kj.kelas_berat.nama_kelas;
      } else if (cabang === "POOMSAE" && kj.poomsae?.nama_kelas) {
        kelasDetail = kj.poomsae.nama_kelas;
      }
      
      // ✅ Format lengkap: Kategori - Level - Kelompok Usia - Kelas Berat/Poomsae
      const parts = [];
      
      if (cabang) parts.push(cabang);
      if (kategoriEvent) parts.push(kategoriEvent);
      if (kelompokUsia) parts.push(kelompokUsia);
      if (kelasDetail) parts.push(kelasDetail);
      
      kelasInfo = parts.join(" - ") || "-";
      
      console.log("📋 Kelas Info Components:", {
        cabang,
        kategoriEvent,
        kelompokUsia,
        kelasDetail,
        final: kelasInfo
      });
    }
  }
  
  // Fallback jika masih kosong
  if (!kelasInfo) kelasInfo = atlet.kelas_berat || "-";

  console.log("Dojang:", dojangName);
  console.log("Kelas (Final):", kelasInfo);

  try {
    const kategori = getKategoriTemplate();
    const templatePath = `/templates/e-idcard_sriwijaya_${kategori}.pdf`;
    
    console.log("📄 Using template:", templatePath);

    const templateBytes = await loadPDFAsArrayBuffer(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height: pageHeight } = firstPage.getSize();

    const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold');

    const mmToPt = (mm: number) => mm * 2.83465;

    // Embed Photo
    if (atlet.pas_foto_path) {
      try {
        const photoUrl = getPhotoUrl(atlet.pas_foto_path);
        
        const roundedImageBase64 = await createRoundedImage(photoUrl, COORDS_MM.photo.borderRadius);
        const imageBytes = base64ToArrayBuffer(roundedImageBase64);
        const image = await pdfDoc.embedPng(imageBytes);

        const x = mmToPt(COORDS_MM.photo.x);
        const y = pageHeight - mmToPt(COORDS_MM.photo.y) - mmToPt(COORDS_MM.photo.height);
        const width = mmToPt(COORDS_MM.photo.width);
        const height = mmToPt(COORDS_MM.photo.height);

        console.log("📍 Photo position:", { x, y, width, height, pageHeight });

        firstPage.drawImage(image, { x, y, width, height });

      } catch (error) {
        console.error("Failed to embed photo:", error);
      }
    }

    const textColor = rgb(0.04, 0.13, 0.41);

    // Draw Text - Nama
    firstPage.drawText(atlet.nama_atlet, {
      x: mmToPt(COORDS_MM.nama.x),
      y: pageHeight - mmToPt(COORDS_MM.nama.y),
      size: COORDS_MM.nama.fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // Draw Text - Kelas (FULL INFO)
    console.log("✍️ Drawing kelas text:", kelasInfo);
    firstPage.drawText(kelasInfo, {
      x: mmToPt(COORDS_MM.kelas.x),
      y: pageHeight - mmToPt(COORDS_MM.kelas.y),
      size: COORDS_MM.kelas.fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // Draw Text - Kontingen
    firstPage.drawText(dojangName, {
      x: mmToPt(COORDS_MM.kontingen.x),
      y: pageHeight - mmToPt(COORDS_MM.kontingen.y),
      size: COORDS_MM.kontingen.fontSize,
      font: helveticaFont,
      color: textColor,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    setCachedPdfBlob(blob);
    setPreviewUrl(url);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ID-Card-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`;
    link.click();

    const storageKey = `idcard_generated_${atlet.id_atlet || atlet.nama_atlet}`;
    localStorage.setItem(storageKey, 'true');

    setHasGenerated(true);
  } catch (error) {
    console.error("Error generating ID card:", error);
    alert("Gagal generate ID Card: " + (error as Error).message);
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
      await generateIDCard();
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
      link.download = `ID-Card-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      await generateIDCard();
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
                disabled={isGenerating || !validation.canGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-medium text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title={!validation.canGenerate ? validation.reason : "Generate ID Card"}
              >
                <FileText size={18} />
                {isGenerating ? "Generating..." : "Generate ID Card"}
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
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-semibold text-sm mb-1">
                Tidak Dapat Generate ID Card
              </p>
              <p className="text-red-700 text-sm">
                {validation.reason}
              </p>
              <ul className="mt-2 text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>Pas foto: {atlet.pas_foto_path ? "✅ Tersedia" : "❌ Belum ada"}</li>
                <li>Peserta kompetisi: {atlet.peserta_kompetisi?.length ? `✅ ${atlet.peserta_kompetisi.length} peserta` : "❌ Belum terdaftar"}</li>
                <li>Status APPROVED: {atlet.peserta_kompetisi?.some(p => p.status === 'APPROVED') ? "✅ Ada" : "❌ Belum ada"}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h4 className="font-semibold text-purple-900 mb-2 text-sm">Deteksi Kategori:</h4>
        <p className="text-xs text-purple-800">
          Template otomatis: Pemula / Prestasi
        </p>
        {atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0 && (
          <p className="text-xs text-purple-600 mt-1 font-mono">
            Kategori: {atlet.peserta_kompetisi.find(p => p.status === 'APPROVED')?.kelas_kejuaraan?.kategori_event?.nama_kategori || 
                       atlet.peserta_kompetisi[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori || "N/A"}
          </p>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 Info Kelas Lengkap:</h4>
        {atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0 && (() => {
          const targetPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED') || 
                                atlet.peserta_kompetisi[0];
          const kj = targetPeserta?.kelas_kejuaraan;
          
          return (
            <div className="text-xs text-blue-800 space-y-1">
              <p><span className="font-semibold">Cabang:</span> {kj?.cabang || "-"}</p>
              <p><span className="font-semibold">Kategori Event:</span> {kj?.kategori_event?.nama_kategori || "-"}</p>
              <p><span className="font-semibold">Kelompok Usia:</span> {kj?.kelompok?.nama_kelompok || "-"}</p>
              <p><span className="font-semibold">Kelas Berat:</span> {kj?.kelas_berat?.nama_kelas || "-"}</p>
              <p><span className="font-semibold">Kelas Poomsae:</span> {kj?.poomsae?.nama_kelas || "-"}</p>
            </div>
          );
        })()}
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