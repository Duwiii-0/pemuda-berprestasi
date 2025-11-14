import { useState, useEffect } from "react";
import { Download, Eye, FileText, AlertCircle } from "lucide-react";
import { useKompetisi } from "../context/KompetisiContext";
import { useAuth } from "../context/authContext"; // ✅ TAMBAHKAN INI
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
      jenis_kelamin?: string;
      kelompok?: {
        id_kelompok?: number;
        nama_kelompok?: string;
        usia_min?: number;
        usia_max?: number;
      };
      kelas_berat?: {
        id_kelas_berat?: number;
        nama_kelas?: string;
      };
      poomsae?: {
        id_poomsae?: number;
        nama_kelas?: string;
      };
      kategori_event?: {
        id_kategori_event?: number;
        nama_kategori?: string;
      };
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
  // ✅ Destructure dari context
  const { pesertaList, fetchAtletByKompetisi } = useKompetisi();
  const { user } = useAuth();
  
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cachedPdfBlob, setCachedPdfBlob] = useState<Blob | null>(null);

  // ✅ Auto-fetch pesertaList jika belum ada
  useEffect(() => {
    const kompetisiId = user?.admin_kompetisi?.id_kompetisi;
    
    if (kompetisiId && (!pesertaList || pesertaList.length === 0)) {
      console.log("🔄 Auto-fetching pesertaList for ID Card...");
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [user, pesertaList]);

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
    if (!atlet.pas_foto_path) {
      return { canGenerate: false, reason: "Pas foto belum tersedia" };
    }

    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
      return { canGenerate: false, reason: "Belum terdaftar dalam kompetisi" };
    }

    const hasApproved = atlet.peserta_kompetisi.some(p => p.status === 'APPROVED');
    if (!hasApproved) {
      return { canGenerate: false, reason: "Belum ada peserta dengan status APPROVED" };
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

  // ✅ ✅ ✅ FUNGSI UTAMA GENERATE ID CARD - FULLY FIXED ✅ ✅ ✅
  const generateIDCard = async () => {
    if (!validation.canGenerate) {
      alert(`Tidak dapat generate ID Card: ${validation.reason}`);
      return;
    }

    setIsGenerating(true);

    console.log("=== 🎯 DEBUG ATLET DATA (FULL) ===");
    console.log("1️⃣ Full atlet object:", atlet);
    console.log("2️⃣ peserta_kompetisi from atlet:", atlet.peserta_kompetisi);
    console.log("3️⃣ pesertaList from context:", pesertaList);
    console.log("4️⃣ pesertaList length:", pesertaList?.length || 0);
    
    const dojangName = atlet.dojang_name || atlet.dojang?.nama_dojang || "-";
    
    let kelasInfo = "";
    
    if (atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0) {
      // Pilih peserta APPROVED
      const targetPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED') || 
                            atlet.peserta_kompetisi[0];
      
      console.log("🎯 Target Peserta (from atlet):", targetPeserta);
      console.log("   - id_peserta_kompetisi:", targetPeserta?.id_peserta_kompetisi);
      console.log("   - kelas_kejuaraan:", targetPeserta?.kelas_kejuaraan);
      
      // ✅ CARI DATA LENGKAP DARI CONTEXT pesertaList
      let fullPesertaData = null;
      
      if (pesertaList && pesertaList.length > 0) {
        fullPesertaData = pesertaList.find((p: any) => {
          // Match by id_peserta_kompetisi
          const match1 = p.id_peserta_kompetisi === targetPeserta?.id_peserta_kompetisi;
          // Or match by id_atlet and status
          const match2 = p.id_atlet === atlet.id_atlet && p.status === 'APPROVED';
          return match1 || match2;
        });
        
        console.log("🔍 Search result from pesertaList:", fullPesertaData);
      } else {
        console.warn("⚠️ pesertaList is empty or undefined");
      }
      
      // ✅ Gunakan data dari context jika ada dan lengkap
      let kelasData = targetPeserta?.kelas_kejuaraan;
      
      if (fullPesertaData?.kelas_kejuaraan) {
        const hasCompleteRelations = 
          fullPesertaData.kelas_kejuaraan.kelompok || 
          fullPesertaData.kelas_kejuaraan.kelas_berat ||
          fullPesertaData.kelas_kejuaraan.poomsae;
        
        if (hasCompleteRelations) {
          console.log("✅ Using COMPLETE data from pesertaList context");
          kelasData = fullPesertaData.kelas_kejuaraan;
        } else {
          console.log("⚠️ Context data incomplete, using atlet data");
        }
      } else {
        console.log("⚠️ No matching data in pesertaList, using atlet data");
      }
      
      console.log("📚 Final kelas data to use:", kelasData);
      
      if (kelasData) {
        const cabang = kelasData.cabang || "";
        const kelompokUsia = kelasData.kelompok?.nama_kelompok || "";
        const kategoriEvent = kelasData.kategori_event?.nama_kategori || "";
        
        console.log("📋 Extracted data:", {
          cabang,
          kelompokUsia,
          kategoriEvent,
          hasKelompok: !!kelasData.kelompok,
          hasKelasBerat: !!kelasData.kelas_berat,
          hasPoomsae: !!kelasData.poomsae
        });
        
        let kelasDetail = "";
        
        if (cabang === "KYORUGI" && kelasData.kelas_berat?.nama_kelas) {
          kelasDetail = kelasData.kelas_berat.nama_kelas;
          console.log("✅ KYORUGI - Kelas Berat:", kelasDetail);
        } else if (cabang === "POOMSAE" && kelasData.poomsae?.nama_kelas) {
          kelasDetail = kelasData.poomsae.nama_kelas;
          console.log("✅ POOMSAE - Kelas Poomsae:", kelasDetail);
        } else {
          console.log("⚠️ No detail class found");
        }
        
        // ✅ BUILD FORMAT: Kategori - Cabang - Kelompok Usia - Kelas Detail
        const parts = [];
        if (kategoriEvent) parts.push(kategoriEvent);
        if (cabang) parts.push(cabang);
        
        // ✅ TAMPILKAN KEDUANYA jika ada
        if (kelompokUsia && kelompokUsia.toLowerCase() !== 'pemula') {
          parts.push(kelompokUsia);
          // Tambahkan kelas detail juga jika ada
          if (kelasDetail) {
            parts.push(kelasDetail);
          }
        } else if (kelasDetail) {
          // Jika kelompok = pemula atau kosong, pakai kelas detail saja
          parts.push(kelasDetail);
        }
        
        kelasInfo = parts.join(" - ") || "-";
        
        console.log("📋 Final Breakdown:", {
          cabang,
          kategoriEvent,
          kelompokUsia,
          kelasDetail,
          parts,
          result: kelasInfo
        });
      } else {
        console.error("❌ No kelas data available at all!");
      }
    } else {
      console.error("❌ No peserta_kompetisi found in atlet data!");
    }
    
    // Fallback
    if (!kelasInfo || kelasInfo === "-") {
      kelasInfo = atlet.kelas_berat || "Kategori Tidak Tersedia";
      console.log("⚠️ Using fallback:", kelasInfo);
    }

    console.log("✅ FINAL Kelas Info:", kelasInfo);
    console.log("✅ FINAL Dojang:", dojangName);
    console.log("=================================\n");

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

          firstPage.drawImage(image, { x, y, width, height });
        } catch (error) {
          console.error("Failed to embed photo:", error);
        }
      }

      const textColor = rgb(0.04, 0.13, 0.41);

      // Draw Nama
      firstPage.drawText(atlet.nama_atlet, {
        x: mmToPt(COORDS_MM.nama.x),
        y: pageHeight - mmToPt(COORDS_MM.nama.y),
        size: COORDS_MM.nama.fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Draw Kelas
      console.log("✍️ Writing to PDF - Kelas:", kelasInfo);
      firstPage.drawText(kelasInfo, {
        x: mmToPt(COORDS_MM.kelas.x),
        y: pageHeight - mmToPt(COORDS_MM.kelas.y),
        size: COORDS_MM.kelas.fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Draw Kontingen
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
      
      console.log("✅ PDF Generated successfully!");
    } catch (error) {
      console.error("❌ Error generating ID card:", error);
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