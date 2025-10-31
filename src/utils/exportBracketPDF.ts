
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

const convertElementToImage = async (element: HTMLElement): Promise<HTMLImageElement> => {
  // 🔹 cari container bagan yang sebenarnya
  const bracketOnly = element.querySelector('.bracket-container') as HTMLElement || element;

  // 🔹 sembunyikan elemen non-bracket (leaderboard, toolbar, dsb)
  const toHide = element.querySelectorAll('.leaderboard, .toolbar, .header, .round-labels');
  const hiddenEls: HTMLElement[] = [];
  toHide.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = 'none';
    hiddenEls.push(htmlEl);
  });

  // 🔹 ukur pakai scrollWidth & scrollHeight agar proporsional
  // Fallback to offsetWidth/height or getBoundingClientRect to avoid zero dimensions
  const rect = bracketOnly.getBoundingClientRect();
  const width = Math.max(bracketOnly.scrollWidth, rect.width, bracketOnly.offsetWidth);
  const height = Math.max(bracketOnly.scrollHeight, rect.height, bracketOnly.offsetHeight);

  // If dimensions are still zero, throw an error.
  if (width === 0 || height === 0) {
    // Restore hidden elements before throwing
    hiddenEls.forEach(el => (el.style.display = ''));
    throw new Error(`Failed to calculate bracket dimensions (width or height is 0). Element might be hidden or empty.`);
  }

  // 🔹 clone biar layout-nya utuh dan tidak scrollable
  const clone = bracketOnly.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';
  clone.style.left = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  clone.style.background = '#FFFFFF';
  document.body.appendChild(clone);

  // 🔹 render image dari clone dengan ukuran penuh
  const dataUrl = await htmlToImage.toPng(clone, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    width,
    height,
  });

  // 🔹 bersihkan setelah render
  document.body.removeChild(clone);
  hiddenEls.forEach(el => (el.style.display = ''));

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => (img.onload = resolve));
  return img;
};

// =================================================================================================
// Add image into PDF (split vertically)
// =================================================================================================
const addImageToPage = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: ExportConfig,
  yStart: number,
  scale: number,
  pageNumber: number,
  totalPages: number
) => {
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const viewHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);

  // crop (slice) portion
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  const cropHeight = viewHeight / scale;
  const cropY = yStart / scale;
  canvas.height = Math.min(cropHeight, img.height - cropY);
  ctx.drawImage(img, 0, cropY, img.width, canvas.height, 0, 0, img.width, canvas.height);

  const sliced = canvas.toDataURL('image/jpeg', 1);

  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  addHeaderAndFooter(doc, config, pageNumber, totalPages);

  // center horizontally
  const displayWidth = PAGE_WIDTH - 2 * MARGIN_LEFT;
  const displayHeight = (canvas.height * displayWidth) / img.width;
  const x = MARGIN_LEFT;
  const y = HEADER_HEIGHT + 5;

  doc.addImage(sliced, 'JPEG', x, y, displayWidth, displayHeight);
};

// =================================================================================================
// MAIN EXPORT FUNCTION (auto split if tall)
// =================================================================================================
export const exportBracketToPDF = async (
  config: ExportConfig,
  bracketElement: HTMLElement,
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  doc.deletePage(1);

  const bracketImg = await convertElementToImage(bracketElement);

  // scale sedikit biar pas (1.5x – 1.8x)
  const scale = 1.6;
  const totalHeight = bracketImg.height * scale;
  const viewHeight = PAGE_HEIGHT - (HEADER_HEIGHT + FOOTER_HEIGHT + 20);

  const totalSlices = Math.ceil(totalHeight / viewHeight);
  const totalPages = totalSlices + 1; // +1 cover

  // page 1: cover
  doc.addPage();
  addCoverPage(doc, config, totalPages);

  // page 2+: split vertically
  let yStart = 0;
  for (let i = 0; i < totalSlices; i++) {
    doc.addPage();
    addImageToPage(doc, bracketImg, config, yStart, scale, i + 2, totalPages);
    yStart += viewHeight;
  }

  // save
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedEventName = config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `Bracket_${sanitizedEventName}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
  doc.save(filename);
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
