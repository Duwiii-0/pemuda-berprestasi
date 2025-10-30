
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

// =================================================================================================
// 1. TYPES & CONFIGURATION
// =================================================================================================

interface ExportConfig {
  eventName: string;
  categoryName: string;
  location: string;
  dateRange: string;
  totalParticipants: number;
}

// =================================================================================================
// 2. LAYOUT & THEME CONSTANTS
// =================================================================================================

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;

const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;

const HEADER_HEIGHT = 18;
const FOOTER_HEIGHT = 10;

const THEME = {
  primary: '#990D35',   // Maroon
  background: '#F5FBEF', // Soft Beige/Green
  text: '#050505',       // Almost Black
  textSecondary: '#6B7280', // Gray
  border: '#E5E7EB',     // Light Gray
  white: '#FFFFFF',
};

// =================================================================================================
// 3. PDF HELPER: HEADER & FOOTER
// =================================================================================================

const addHeaderAndFooter = (
  doc: jsPDF,
  config: ExportConfig,
  pageNumber: number,
  totalPages: number
) => {
  // === HEADER ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(THEME.text);
  doc.text(config.eventName, PAGE_WIDTH / 2, MARGIN_TOP + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.categoryName, PAGE_WIDTH / 2, MARGIN_TOP + 11, { align: 'center' });

  // === FOOTER ===
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(THEME.textSecondary);

  // Left: Date
  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(exportDate, MARGIN_LEFT, footerY);

  // Center: Page Number
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH / 2, footerY, { align: 'center' });
};

// =================================================================================================
// 4. PDF HELPER: COVER PAGE
// =================================================================================================

const addCoverPage = (doc: jsPDF, config: ExportConfig, totalPages: number) => {
  // Background
  doc.setFillColor(THEME.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header Banner
  doc.setFillColor(THEME.primary);
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');

  // Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(THEME.white);
  doc.text(config.eventName.toUpperCase(), PAGE_WIDTH / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(THEME.white);
  doc.text('Competition Bracket', PAGE_WIDTH / 2, 35, { align: 'center' });

  // Info Box
  const boxX = PAGE_WIDTH / 2 - 100;
  const boxY = 70;
  const boxWidth = 200;
  const boxHeight = 60;
  
  doc.setDrawColor(THEME.border);
  doc.setFillColor(THEME.white);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, 'FD');

  // Info Text
  const infoItems = [
    { label: 'Category', value: config.categoryName },
    { label: 'Location', value: config.location },
    { label: 'Date', value: config.dateRange },
    { label: 'Participants', value: `${config.totalParticipants} Athletes` },
  ];
  
  let currentY = boxY + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  infoItems.forEach(item => {
    doc.setTextColor(THEME.textSecondary);
    doc.text(item.label, boxX + 15, currentY, { align: 'left' });
    doc.setTextColor(THEME.text);
    doc.text(item.value, boxX + boxWidth - 15, currentY, { align: 'right' });
    currentY += 10;
  });
  
  addHeaderAndFooter(doc, config, 1, totalPages);
};

// =================================================================================================
// 5. PDF HELPER: DOM-TO-IMAGE CONVERSION (COMPUTED-STYLE BAKING)
// =================================================================================================

const convertElementToImage = async (element: HTMLElement): Promise<HTMLImageElement> => {
  const rect = element.getBoundingClientRect();
  const dataUrl = await htmlToImage.toJpeg(element, {
    width: rect.width,
    height: rect.height,
    quality: 1,
    pixelRatio: 2.5,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => (img.onload = resolve));
  return img;
};

// =================================================================================================
// 6. PDF HELPER: ADD IMAGE CONTENT TO PAGE (FIT-TO-PAGE METHOD)
// =================================================================================================

const addImageToPage = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: ExportConfig,
  pageNumber: number,
  totalPages: number
) => {
  doc.setFillColor('#ffffff');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  addHeaderAndFooter(doc, config, pageNumber, totalPages);

  const maxWidth = PAGE_WIDTH - 2 * MARGIN_LEFT;
  const maxHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);

  // zoom in 10–20% biar tidak kecil
  let scale = Math.min(maxWidth / img.width, maxHeight / img.height) * 1.2;
  if (img.height * scale > maxHeight) scale *= 0.95;

  const displayWidth = img.width * scale;
  const displayHeight = img.height * scale;

  // pusatkan dan naikkan sedikit (offsetY = -10)
  const x = (PAGE_WIDTH - displayWidth) / 2;
  const y = HEADER_HEIGHT + 10 + (maxHeight - displayHeight) / 2 - 10;

  doc.addImage(img, 'JPEG', x, y, displayWidth, displayHeight);
};

// =================================================================================================
// 7. MAIN EXPORT FUNCTION
// =================================================================================================

export const exportBracketToPDF = async (
  config: ExportConfig,
  bracketElement: HTMLElement,
): Promise<void> => {
  try {
    // Give browser time to finish rendering before we start
    await new Promise(r => setTimeout(r, 500));

    // Explicitly remove leaderboard elements from the live DOM just in case
    document.querySelectorAll('.leaderboard, #leaderboard').forEach(el => el.remove());

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [330, 210], // lebih lebar dari A4
      compress: true,
    });
    doc.deletePage(1); // Remove default blank page

    // --- RENDER & PREPARE DATA ---
    // 1️⃣ Sebelum render, bersihkan elemen non-bracket
    const tempHidden: HTMLElement[] = [];
    document.querySelectorAll('.header, .round-labels, .bracket-toolbar').forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = 'none';
      tempHidden.push(htmlEl);
    });

    const bracketImg = await convertElementToImage(bracketElement);

    // restore visibility
    tempHidden.forEach(el => (el.style.display = ''));

    const totalPages = 2; // Cover (1) + Bracket (1)

    // --- PAGE GENERATION ---
    // Page 1: Cover
    doc.addPage();
    addCoverPage(doc, config, totalPages);

    // Page 2: Bracket
    doc.addPage();
    addImageToPage(doc, bracketImg, config, 2, totalPages);

    // --- SAVE PDF ---
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedEventName = config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Bracket_${sanitizedEventName}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please check the console for more details.');
  }
};

// =================================================================================================
// 8. DATA TRANSFORM HELPER (Simplified)
// =================================================================================================

export const transformBracketDataForPDF = (
  kelasData: any,
): ExportConfig => {
  const categoryName = `${kelasData.kelompok?.nama_kelompok || ''} ${
    kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
  } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim();

  const dateRange = `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}`;

  return {
    eventName: kelasData.kompetisi.nama_event,
    categoryName: categoryName,
    location: kelasData.kompetisi.lokasi,
    dateRange: dateRange,
    totalParticipants: kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED').length,
  };
};
