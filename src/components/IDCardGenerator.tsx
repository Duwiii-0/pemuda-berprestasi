import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import jsPDF from "jspdf";

interface Atlet {
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  pas_foto_path?: string;
  dojang_name?: string;
  kelas_berat?: string;
  belt?: string;
  // Tambahan struktur nested jika data dari API berbeda
  dojang?: {
    nama_dojang?: string;
    id_dojang?: number;
  };
  kelas_kejuaraan?: {
    kelas_berat?: {
      nama_kelas?: string;
    };
  };
}

interface IDCardGeneratorProps {
  atlet: Atlet;
  isEditing: boolean;
}

// Koordinat PRESISI untuk overlay pada template (disesuaikan dengan template asli)
const OVERLAY_COORDS = {
  page: { width: 210, height: 297 },
  
  // Photo box (kotak besar kiri) - koordinat FIXED berdasarkan template
  photo: {
    x: 25.5,           // Posisi X foto
    y: 95.7,           // Posisi Y foto (dari atas)
    width: 77,       // Lebar foto FIXED
    height: 108,      // Tinggi foto FIXED
  },
  
  nama: {
    x: 55,           // Setelah "Nama :"
    y: 220,          // Baris Nama
  },
  kelas: {
    x: 55,           // Setelah "Kelas :"
    y: 233,          // Baris Kelas
  },
  kontingen: {
    x: 55,           // Setelah "Kontingen :"
    y: 246,          // Baris Kontingen
  },
};

export const IDCardGenerator = ({ atlet, isEditing }: IDCardGeneratorProps) => {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const getPhotoUrl = (filename: string): string => {
    if (!filename) return "";
    return `${process.env.REACT_APP_API_BASE_URL || 'http://cjvmanagementevent.com'}/uploads/atlet/pas_foto/${filename}`;
  };

const loadImageAsBase64 = async (url: string, rounded = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return reject(new Error("Canvas context not available"));

      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;

      if (rounded) {
        const radius = Math.min(w, h) * 0.10; // radius 15% dari ukuran gambar
        ctx.clearRect(0, 0, w, h);

        // 🟢 Buat path rounded dan clip TANPA background putih
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
      }

      // 🖼️ Gambar foto di atas canvas transparan
      ctx.drawImage(img, 0, 0, w, h);

      // 👉 Gunakan PNG biar transparansi tidak hilang
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};


  const generateIDCard = async () => {
    setIsGenerating(true);

    console.log("=== DEBUG ATLET DATA ===");
    console.log("Full atlet object:", atlet);
    console.log("nama_atlet:", atlet.nama_atlet);
    
    // ✅ Ambil kelas_berat dari berbagai kemungkinan struktur data
    const kelasBerat = atlet.kelas_berat || 
                       atlet.kelas_kejuaraan?.kelas_berat?.nama_kelas || 
                       "-";
    
    // ✅ Ambil dojang_name dari berbagai kemungkinan struktur data
    const dojangName = atlet.dojang_name || 
                       atlet.dojang?.nama_dojang || 
                       "-";
    
    console.log("kelas_berat (extracted):", kelasBerat);
    console.log("dojang_name (extracted):", dojangName);
    console.log("========================");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const c = OVERLAY_COORDS;

      // ========== LOAD TEMPLATE BACKGROUND ==========
      try {
        const templateImg = "/templates/e-idcard_sriwijaya.jpg";
        const templateBase64 = await loadImageAsBase64(templateImg);
        
        
        // Paste template sebagai background (full page A4)
        pdf.addImage(
          templateBase64,
          "JPEG",
          0,
          0,
          c.page.width,
          c.page.height,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error("Failed to load template:", error);
        // Fallback: white background jika template gagal load
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, c.page.width, c.page.height, "F");
        
        // Tampilkan error message
        pdf.setFontSize(12);
        pdf.setTextColor(255, 0, 0);
        pdf.text("Error: Template tidak dapat dimuat", 105, 20, { align: "center" });
      }

      // ========== OVERLAY FOTO ATLET ==========
      if (atlet.pas_foto_path) {
        try {
          const photoUrl = getPhotoUrl(atlet.pas_foto_path);
          const base64Photo = await loadImageAsBase64(photoUrl, true); // true => aktifkan rounded

          
          // Paste foto atlet dengan ukuran FIXED di koordinat yang sudah ditentukan
          // Menggunakan "FAST" compression untuk hasil optimal
          pdf.addImage(
            base64Photo,
            "JPEG",
            c.photo.x,
            c.photo.y,
            c.photo.width,    // Fixed width
            c.photo.height,   // Fixed height
            undefined,
            "FAST"
          );
        } catch (error) {
          console.error("Failed to load athlete photo:", error);
          // Fallback: kotak abu-abu dengan initial
          pdf.setFillColor(220, 220, 220);
          pdf.rect(c.photo.x, c.photo.y, c.photo.width, c.photo.height, "F");
          pdf.setFontSize(40);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            atlet.nama_atlet.charAt(0).toUpperCase(),
            c.photo.x + c.photo.width / 2,
            c.photo.y + c.photo.height / 2 + 10,
            { align: "center" }
          );
        }
      } else {
        // Tidak ada foto - tampilkan placeholder
        pdf.setFillColor(240, 240, 240);
        pdf.rect(c.photo.x, c.photo.y, c.photo.width, c.photo.height, "F");
        pdf.setFontSize(36);
        pdf.setTextColor(180, 180, 180);
        pdf.text(
          atlet.nama_atlet.charAt(0).toUpperCase(),
          c.photo.x + c.photo.width / 2,
          c.photo.y + c.photo.height / 2 + 10,
          { align: "center" }
        );
      }

      // ========== OVERLAY DATA ATLET ==========
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);        // Font size disesuaikan dengan template
      pdf.setTextColor(10, 34, 104);

      // Nama
      pdf.text(atlet.nama_atlet, c.nama.x, c.nama.y);

      // Kelas - gunakan variable yang sudah di-extract
      pdf.text(kelasBerat, c.kelas.x, c.kelas.y);

      // Kontingen - gunakan variable yang sudah di-extract
      pdf.text(dojangName, c.kontingen.x, c.kontingen.y);

      // ========== METADATA untuk ekstraksi ==========
      pdf.setProperties({
        title: `ID-Card-${atlet.nama_atlet}`,
        subject: "ID Card Atlet Sriwijaya Championship 2025",
        author: "Sriwijaya International Taekwondo Championship",
        keywords: JSON.stringify({
          nama: atlet.nama_atlet,
          nama_coords: { x: c.nama.x, y: c.nama.y },
          kelas: kelasBerat,
          kelas_coords: { x: c.kelas.x, y: c.kelas.y },
          kontingen: dojangName,
          kontingen_coords: { x: c.kontingen.x, y: c.kontingen.y },
          foto_path: atlet.pas_foto_path || "",
          foto_coords: { x: c.photo.x, y: c.photo.y, w: c.photo.width, h: c.photo.height },
          template: "e-idcard_sriwijaya.jpg",
          version: "3.0"
        }),
        creator: "ID Card Generator v3.0",
      });

      // Preview & Download
      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      pdf.save(`ID-Card-${atlet.nama_atlet.replace(/\s/g, "-")}.pdf`);

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

      {/* Preview Modal */}
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