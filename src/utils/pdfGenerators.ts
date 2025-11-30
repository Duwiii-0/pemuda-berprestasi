import { PDFDocument, rgb } from "pdf-lib";
import type { Atlet } from "../types";

const COORDS_MM_IDCARD = {
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

const COORDS_MM_CERTIFICATE = {
  nama: {
    y: 140,
    fontSize: 24,
  },
  achievement: {
    y: 158,
    fontSize: 14,
  },
};

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

            const targetWidth = COORDS_MM_IDCARD.photo.width * 11.811;
            const targetHeight = COORDS_MM_IDCARD.photo.height * 11.811;
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

const getKategoriTemplate = (atlet: Atlet): "pemula" | "prestasi" => {
    if (!atlet.peserta_kompetisi || atlet.peserta_kompetisi.length === 0) {
        return "pemula";
    }

    const approvedPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED');
    const targetPeserta = approvedPeserta || atlet.peserta_kompetisi[0];
    
    const namaKategori = targetPeserta?.kelas_kejuaraan?.kategori_event?.nama_kategori;
    const kategoriLower = namaKategori?.toLowerCase();
    
    const isPrestasi = kategoriLower?.includes("prestasi");
    
    return isPrestasi ? "prestasi" : "pemula";
};

export const generateIdCardPdfBytes = async (atlet: Atlet, pesertaList: any[]): Promise<Uint8Array> => {
    const dojangName = atlet.dojang_name || atlet.dojang?.nama_dojang || "-";
    let kelasInfo = "";

    if (atlet.peserta_kompetisi && atlet.peserta_kompetisi.length > 0) {
        const targetPeserta = atlet.peserta_kompetisi.find(p => p.status === 'APPROVED') || atlet.peserta_kompetisi[0];
        let fullPesertaData = null;
        
        if (pesertaList && pesertaList.length > 0) {
            fullPesertaData = pesertaList.find((p: any) => p.id_peserta_kompetisi === targetPeserta?.id_peserta_kompetisi || (p.id_atlet === atlet.id_atlet && p.status === 'APPROVED'));
        }
        
        let kelasData = targetPeserta?.kelas_kejuaraan;
        
        if (fullPesertaData?.kelas_kejuaraan) {
            const hasCompleteRelations = fullPesertaData.kelas_kejuaraan.kelompok || fullPesertaData.kelas_kejuaraan.kelas_berat || fullPesertaData.kelas_kejuaraan.poomsae;
            if (hasCompleteRelations) {
                kelasData = fullPesertaData.kelas_kejuaraan;
            }
        }
        
        if (kelasData) {
            const cabang = kelasData.cabang || "";
            const kelompokUsia = kelasData.kelompok?.nama_kelompok || "";
            const kategoriEvent = kelasData.kategori_event?.nama_kategori || "";
            let kelasDetail = "";
            
            if (cabang === "KYORUGI" && kelasData.kelas_berat?.nama_kelas) {
                kelasDetail = kelasData.kelas_berat.nama_kelas;
            } else if (cabang === "POOMSAE" && kelasData.poomsae?.nama_kelas) {
                kelasDetail = kelasData.poomsae.nama_kelas;
            }
            
            const parts = [];
            if (kategoriEvent) parts.push(kategoriEvent);
            if (cabang) parts.push(cabang);
            if (kelompokUsia && kelompokUsia.toLowerCase() !== 'pemula') {
                parts.push(kelompokUsia);
                if (kelasDetail) {
                    parts.push(kelasDetail);
                }
            } else if (kelasDetail) {
                parts.push(kelasDetail);
            }
            kelasInfo = parts.join(" - ") || "-";
        }
    }
    
    if (!kelasInfo || kelasInfo === "-") {
        kelasInfo = atlet.kelas_berat || "Kategori Tidak Tersedia";
    }

    const kategori = getKategoriTemplate(atlet);
    const templatePath = `/templates/e-idcard_sriwijaya_${kategori}.pdf`;
    
    const templateBytes = await loadPDFAsArrayBuffer(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height: pageHeight } = firstPage.getSize();

    const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold');
    const mmToPt = (mm: number) => mm * 2.83465;

    // FIXED: Use pas_foto (from database) instead of pas_foto_path
    const photoField = (atlet as any).pas_foto || (atlet as any).pas_foto_path;
    
    if (photoField) {
        try {
            const photoUrl = getPhotoUrl(photoField);
            console.log(`📸 Loading photo for ${atlet.nama_atlet}: ${photoUrl}`);
            const roundedImageBase64 = await createRoundedImage(photoUrl, COORDS_MM_IDCARD.photo.borderRadius);
            const imageBytes = base64ToArrayBuffer(roundedImageBase64);
            const image = await pdfDoc.embedPng(imageBytes);

            const x = mmToPt(COORDS_MM_IDCARD.photo.x);
            const y = pageHeight - mmToPt(COORDS_MM_IDCARD.photo.y) - mmToPt(COORDS_MM_IDCARD.photo.height);
            const width = mmToPt(COORDS_MM_IDCARD.photo.width);
            const height = mmToPt(COORDS_MM_IDCARD.photo.height);

            firstPage.drawImage(image, { x, y, width, height });
            console.log(`✅ Photo embedded successfully for ${atlet.nama_atlet}`);
        } catch (error) {
            console.error(`❌ Failed to embed photo for ${atlet.nama_atlet}:`, error);
        }
    } else {
        console.warn(`⚠️ No photo found for ${atlet.nama_atlet}`);
    }

    const textColor = rgb(0.04, 0.13, 0.41);

    firstPage.drawText(atlet.nama_atlet, {
        x: mmToPt(COORDS_MM_IDCARD.nama.x),
        y: pageHeight - mmToPt(COORDS_MM_IDCARD.nama.y),
        size: COORDS_MM_IDCARD.nama.fontSize,
        font: helveticaFont,
        color: textColor,
    });

    firstPage.drawText(kelasInfo, {
        x: mmToPt(COORDS_MM_IDCARD.kelas.x),
        y: pageHeight - mmToPt(COORDS_MM_IDCARD.kelas.y),
        size: COORDS_MM_IDCARD.kelas.fontSize,
        font: helveticaFont,
        color: textColor,
    });

    firstPage.drawText(dojangName, {
        x: mmToPt(COORDS_MM_IDCARD.kontingen.x),
        y: pageHeight - mmToPt(COORDS_MM_IDCARD.kontingen.y),
        size: COORDS_MM_IDCARD.kontingen.fontSize,
        font: helveticaFont,
        color: textColor,
    });

    return await pdfDoc.save();
};

export type MedalStatus = "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT";

const getMedalText = (medalStatus: MedalStatus): string => {
    switch (medalStatus) {
        case "GOLD": return "First Winner";
        case "SILVER": return "Second Winner";
        case "BRONZE": return "Third Winner";
        case "PARTICIPANT": return "Participant";
    }
};

export const getKelasKejuaraan = (peserta: any, pesertaList: any[]): string => {
    if (!peserta.kelas_kejuaraan) return "-";
    
    let kelasData = peserta.kelas_kejuaraan;
    
    if (pesertaList && pesertaList.length > 0) {
      const fullPesertaData = pesertaList.find((p: any) => p.id_peserta_kompetisi === peserta.id_peserta_kompetisi);
      
      if (fullPesertaData?.kelas_kejuaraan) {
        const hasCompleteRelations = 
          fullPesertaData.kelas_kejuaraan.kelompok || 
          fullPesertaData.kelas_kejuaraan.kelas_berat ||
          fullPesertaData.kelas_kejuaraan.poomsae;
        
        if (hasCompleteRelations) {
          kelasData = fullPesertaData.kelas_kejuaraan;
        }
      }
    }

    const cabang = kelasData.cabang || "";
    const kelompokUsia = kelasData.kelompok?.nama_kelompok || "";
    const jenisKelamin = kelasData.jenis_kelamin?.toLowerCase() === 'laki_laki' ? 'Male' : (kelasData.jenis_kelamin?.toLowerCase() === 'perempuan' ? 'Female' : '');
    
    let kelasDetail = "";
    if (cabang === "KYORUGI" && kelasData.kelas_berat?.nama_kelas) {
      kelasDetail = kelasData.kelas_berat.nama_kelas;
    } else if (cabang === "POOMSAE" && kelasData.poomsae?.nama_kelas) {
      kelasDetail = kelasData.poomsae.nama_kelas;
    }
    
    const parts = [];
    if (cabang) parts.push(cabang);
    if (kelompokUsia && kelompokUsia.toLowerCase() !== 'pemula') {
      parts.push(kelompokUsia);
    }
    if (kelasDetail) {
      parts.push(kelasDetail);
    }
    if (jenisKelamin) {
      parts.push(jenisKelamin);
    }
    
    const result = parts.join(" ") || "-";
    return result;
  };

export const generateCertificatePdfBytes = async (atlet: Atlet, medalStatus: MedalStatus, kelasName: string): Promise<Uint8Array> => {
    const templatePath = `/templates/piagam.pdf`;
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
    const helvetica = await pdfDoc.embedFont('Helvetica');
    const mmToPt = (mm: number) => mm * 2.83465;
    const textColor = rgb(0, 0, 0);

    const namaText = atlet.nama_atlet.toUpperCase();
    const namaWidth = helveticaBold.widthOfTextAtSize(namaText, COORDS_MM_CERTIFICATE.nama.fontSize);
    firstPage.drawText(namaText, {
        x: (pageWidth - namaWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM_CERTIFICATE.nama.y),
        size: COORDS_MM_CERTIFICATE.nama.fontSize,
        font: helveticaBold,
        color: textColor,
    });

    const achievementText = `${getMedalText(medalStatus)} ${kelasName}`;
    const achievementWidth = helvetica.widthOfTextAtSize(achievementText, COORDS_MM_CERTIFICATE.achievement.fontSize);
    firstPage.drawText(achievementText, {
        x: (pageWidth - achievementWidth) / 2,
        y: pageHeight - mmToPt(COORDS_MM_CERTIFICATE.achievement.y),
        size: COORDS_MM_CERTIFICATE.achievement.fontSize,
        font: helvetica,
        color: textColor,
    });

    return await pdfDoc.save();
};

/**
 * 🆕 Export Detail Peserta per Kelas Kejuaraan
 * Format: Simple table with participant names and dojang
 */
export const exportPesertaList = async (
  kelasData: any,
  options: {
    namaKejuaraan: string;
    logoPBTI: string;
    logoEvent: string;
  }
) => {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
  const helvetica = await pdfDoc.embedFont('Helvetica');

  // Helper function
  const mmToPt = (mm: number) => mm * 2.83465;

  // Prepare peserta data
  const pesertaList = kelasData.peserta_kompetisi || [];
  
  // Generate nama kelas
  const parts = [];
  if (kelasData.cabang) parts.push(kelasData.cabang);
  if (kelasData.kategori_event?.nama_kategori) parts.push(kelasData.kategori_event.nama_kategori);
  if (kelasData.kelompok?.nama_kelompok) parts.push(kelasData.kelompok.nama_kelompok);
  
  if (kelasData.kelas_berat) {
    const gender = kelasData.kelas_berat.jenis_kelamin === 'LAKI_LAKI' ? 'Putra' : 'Putri';
    parts.push(gender);
  }
  
  if (kelasData.kelas_berat?.nama_kelas) parts.push(kelasData.kelas_berat.nama_kelas);
  if (kelasData.poomsae?.nama_kelas) parts.push(kelasData.poomsae.nama_kelas);
  if (kelasData.poomsae_type) parts.push(kelasData.poomsae_type);
  
  const namaKelas = parts.join(' - ');

  // Add page
  const page = pdfDoc.addPage([mmToPt(210), mmToPt(297)]); // A4
  const { height: pageHeight } = page.getSize();

  let currentY = pageHeight - mmToPt(20);

  // HEADER
  page.drawText(options.namaKejuaraan.toUpperCase(), {
    x: mmToPt(20),
    y: currentY,
    size: 16,
    font: helveticaBold,
    color: rgb(0.6, 0.05, 0.21), // Maroon
  });
  currentY -= mmToPt(7);

  page.drawText('DAFTAR PESERTA', {
    x: mmToPt(20),
    y: currentY,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  currentY -= mmToPt(8);

  // Nama Kelas
  page.drawText(`Kelas: ${namaKelas}`, {
    x: mmToPt(20),
    y: currentY,
    size: 11,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  currentY -= mmToPt(7);

  // Total Peserta
  page.drawText(`Jumlah Peserta: ${pesertaList.length}`, {
    x: mmToPt(20),
    y: currentY,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });
  currentY -= mmToPt(10);

  // TABLE HEADER
  const tableStartX = mmToPt(20);
  const colNo = tableStartX;
  const colNama = colNo + mmToPt(15);
  const colDojang = colNama + mmToPt(80);
  const rowHeight = mmToPt(7);

  // Draw header background
  page.drawRectangle({
    x: tableStartX,
    y: currentY - mmToPt(2),
    width: mmToPt(170),
    height: mmToPt(7),
    color: rgb(0.6, 0.05, 0.21), // Maroon
  });

  // Header text
  page.drawText('No', {
    x: colNo + mmToPt(2),
    y: currentY,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Nama Peserta', {
    x: colNama + mmToPt(2),
    y: currentY,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Dojang', {
    x: colDojang + mmToPt(2),
    y: currentY,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentY -= mmToPt(8);

  // TABLE ROWS
  let currentPage = page;
  
  pesertaList.forEach((peserta: any, index: number) => {
    // Check if need new page
    if (currentY < mmToPt(30)) {
      currentPage = pdfDoc.addPage([mmToPt(210), mmToPt(297)]);
      currentY = currentPage.getHeight() - mmToPt(20);
      
      // Redraw header on new page
      currentPage.drawRectangle({
        x: tableStartX,
        y: currentY - mmToPt(2),
        width: mmToPt(170),
        height: mmToPt(7),
        color: rgb(0.6, 0.05, 0.21),
      });

      currentPage.drawText('No', {
        x: colNo + mmToPt(2),
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      currentPage.drawText('Nama Peserta', {
        x: colNama + mmToPt(2),
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      currentPage.drawText('Dojang', {
        x: colDojang + mmToPt(2),
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      currentY -= mmToPt(8);
    }

    // Alternate row background
    if (index % 2 === 1) {
      currentPage.drawRectangle({
        x: tableStartX,
        y: currentY - mmToPt(1.5),
        width: mmToPt(170),
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    // Row data
    const namaPeserta = peserta.is_team
      ? `Tim ${peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang || 'Unknown'}`
      : peserta.atlet?.nama_atlet || 'Unknown';
    
    const dojangName = peserta.is_team
      ? peserta.anggota_tim?.[0]?.atlet?.dojang?.nama_dojang || '-'
      : peserta.atlet?.dojang?.nama_dojang || '-';

    currentPage.drawText(`${index + 1}`, {
      x: colNo + mmToPt(2),
      y: currentY,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    currentPage.drawText(namaPeserta, {
      x: colNama + mmToPt(2),
      y: currentY,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    currentPage.drawText(dojangName, {
      x: colDojang + mmToPt(2),
      y: currentY,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    currentY -= rowHeight;
  });

  // Footer on last page
  const footerY = mmToPt(15);
  currentPage.drawText(`Generated on ${new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })}`, {
    x: mmToPt(20),
    y: footerY,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save and download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Daftar_Peserta_${namaKelas.replace(/\s+/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
