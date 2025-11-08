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
}

interface IDCardGeneratorProps {
  atlet: Atlet;
  isEditing: boolean;
}

// Koordinat PRESISI untuk overlay pada template
const OVERLAY_COORDS = {
  page: { width: 210, height: 297 },
  
  // Photo box (kotak besar kiri) - koordinat untuk paste foto atlet
  photo: {
    x: 30,
    y: 200,
    width: 100,
    height: 135,
  },
  
  // Data atlet - koordinat untuk text overlay
  nama: {
    x: 75,
    y: 350,
  },
  kelas: {
    x: 75,
    y: 365,
  },
  kontingen: {
    x: 75,
    y: 380,
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

  const loadImageAsBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        } else {
          reject(new Error("Canvas context not available"));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const generateIDCard = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const c = OVERLAY_COORDS;

      // ========== LOAD TEMPLATE BACKGROUND ==========
      try {
        // Load template dari assets
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
          const base64Photo = await loadImageAsBase64(photoUrl);
          
          // Paste foto atlet di koordinat yang sudah ditentukan
          pdf.addImage(
            base64Photo,
            "JPEG",
            c.photo.x,
            c.photo.y,
            c.photo.width,
            c.photo.height,
            undefined,
            "FAST"
          );
        } catch (error) {
          console.error("Failed to load athlete photo:", error);
          // Fallback: kotak abu-abu dengan initial
          pdf.setFillColor(220, 220, 220);
          pdf.rect(c.photo.x, c.photo.y, c.photo.width, c.photo.height, "F");
          pdf.setFontSize(60);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            atlet.nama_atlet.charAt(0).toUpperCase(),
            c.photo.x + c.photo.width / 2,
            c.photo.y + c.photo.height / 2,
            { align: "center" }
          );
        }
      } else {
        // Tidak ada foto - tampilkan placeholder
        pdf.setFillColor(240, 240, 240);
        pdf.rect(c.photo.x, c.photo.y, c.photo.width, c.photo.height, "F");
        pdf.setFontSize(48);
        pdf.setTextColor(180, 180, 180);
        pdf.text(
          atlet.nama_atlet.charAt(0).toUpperCase(),
          c.photo.x + c.photo.width / 2,
          c.photo.y + c.photo.height / 2,
          { align: "center" }
        );
      }

      // ========== OVERLAY DATA ATLET ==========
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0); // Black text

      // Nama
      pdf.text(atlet.nama_atlet, c.nama.x, c.nama.y);

      // Kelas
      pdf.text(atlet.kelas_berat || "-", c.kelas.x, c.kelas.y);

      // Kontingen
      pdf.text(atlet.dojang_name || "-", c.kontingen.x, c.kontingen.y);

      // ========== METADATA untuk ekstraksi ==========
      pdf.setProperties({
        title: `ID-Card-${atlet.nama_atlet}`,
        subject: "ID Card Atlet Sriwijaya Championship 2025",
        author: "Sriwijaya International Taekwondo Championship",
        keywords: JSON.stringify({
          nama: atlet.nama_atlet,
          nama_coords: { x: c.nama.x, y: c.nama.y },
          kelas: atlet.kelas_berat || "",
          kelas_coords: { x: c.kelas.x, y: c.kelas.y },
          kontingen: atlet.dojang_name || "",
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

      {/* Info Struktur Koordinat */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">📍 Koordinat Overlay pada Template:</h4>
        <ul className="text-xs text-blue-800 space-y-1 font-mono">
          <li>• Template: /assets/photos/e-idcard_sriwijaya.jpg</li>
          <li>• Foto Atlet: x={OVERLAY_COORDS.photo.x}mm, y={OVERLAY_COORDS.photo.y}mm ({OVERLAY_COORDS.photo.width}x{OVERLAY_COORDS.photo.height}mm)</li>
          <li>• Nama: x={OVERLAY_COORDS.nama.x}mm, y={OVERLAY_COORDS.nama.y}mm</li>
          <li>• Kelas: x={OVERLAY_COORDS.kelas.x}mm, y={OVERLAY_COORDS.kelas.y}mm</li>
          <li>• Kontingen: x={OVERLAY_COORDS.kontingen.x}mm, y={OVERLAY_COORDS.kontingen.y}mm</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          📄 PDF menggunakan template asli + overlay data atlet
        </p>
        <p className="text-xs text-blue-600">
          🔍 Koordinat tersimpan dalam PDF metadata untuk ekstraksi
        </p>
      </div>

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