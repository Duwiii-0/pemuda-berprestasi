import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

// =================================================================================================
// TYPES & CONFIGURATION
// =================================================================================================

/**
 * Configuration untuk export PDF
 */
export interface ExportConfig {
  eventName: string;
  categoryName: string;
  location: string;
  dateRange: string;
  totalParticipants: number;
}

/**
 * Format halaman A4 Landscape (dalam mm)
 */
const PAGE_CONFIG = {
  WIDTH: 297,
  HEIGHT: 210,
  MARGIN: {
    TOP: 0,
    BOTTOM: 0,
    LEFT: 0,
    RIGHT: 0,
  },
  HEADER_HEIGHT: 25,
  FOOTER_HEIGHT: 0,
} as const;

// =================================================================================================
// HELPER: TRANSFORM DATA
// =================================================================================================

/**
 * Transform data dari API ke format ExportConfig
 */
export const transformBracketData = (kelasData: any): ExportConfig => {
  const approvedParticipants = kelasData.peserta_kompetisi.filter(
    (p: any) => p.status === 'APPROVED'
  );

  const gender = kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female';
  const className = kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || '';
  const groupName = kelasData.kelompok?.nama_kelompok || '';

  return {
    eventName: kelasData.kompetisi.nama_event,
    categoryName: `${groupName} ${gender} ${className}`.trim(),
    location: kelasData.kompetisi.lokasi,
    dateRange: `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    totalParticipants: approvedParticipants.length,
  };
};

// =================================================================================================
// HEADER & FOOTER
// =================================================================================================

/**
 * Render header di setiap halaman PDF
 */
const renderHeader = (doc: jsPDF, config: ExportConfig): void => {
  const centerX = PAGE_CONFIG.WIDTH / 2;
  const baseY = PAGE_CONFIG.MARGIN.TOP;

  try {
    // Event name (bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(5, 5, 5); // RGB: #050505
    doc.text(config.eventName, centerX, baseY + 5, { align: 'center' });

    // Category name (normal)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // RGB: #6B7280
    doc.text(config.categoryName, centerX, baseY + 12, { align: 'center' });

    // Garis pemisah header
    doc.setDrawColor(229, 231, 235); // RGB: #E5E7EB
    doc.setLineWidth(0.3);
    doc.line(
      PAGE_CONFIG.MARGIN.LEFT,
      baseY + 16,
      PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN.RIGHT,
      baseY + 16
    );
  } catch (error) {
    console.error('❌ Error rendering header:', error);
  }
};

/**
 * Render footer di setiap halaman PDF
 */
const renderFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
  const footerY = PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN.BOTTOM + 2;

  try {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // RGB: #6B7280

    // Page number di tengah
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      PAGE_CONFIG.WIDTH / 2,
      footerY,
      { align: 'center' }
    );

    // Tanggal export di kiri
    const exportDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.text(exportDate, PAGE_CONFIG.MARGIN.LEFT, footerY);
  } catch (error) {
    console.error('❌ Error rendering footer:', error);
  }
};

// =================================================================================================
// CORE: CAPTURE BRACKET AS IMAGE
// =================================================================================================

/**
 * Capture bracket element sebagai PNG dengan resolusi tinggi
 * PENTING: Tidak memperbesar canvas, hanya capture sesuai ukuran asli
 */
const captureBracketImage = async (bracketElement: HTMLElement): Promise<HTMLImageElement> => {
  console.log('📸 Starting bracket capture...');

  // ✅ STEP 1: Temukan container bracket yang tepat
  const bracketVisual = findBracketVisual(bracketElement);
  if (!bracketVisual) {
    throw new Error('❌ Bracket visual container not found');
  }

  console.log('✅ Bracket container found');
  console.log('📏 Original dimensions:', {
    width: bracketVisual.scrollWidth,
    height: bracketVisual.scrollHeight,
  });

  // ✅ STEP 2: Hide unwanted elements (leaderboard, buttons)
  const hiddenElements = hideUnwantedElements(bracketVisual);
  console.log(`🙈 Hidden ${hiddenElements.length} elements`);

  // ✅ STEP 3: Wait for render
  await new Promise(resolve => setTimeout(resolve, 150));

  // ✅ STEP 4: Capture dengan ukuran ASLI (tidak diperbesar)
  const actualWidth = bracketVisual.scrollWidth;
  const actualHeight = bracketVisual.scrollHeight;

  console.log('📸 Capturing with actual size:', { actualWidth, actualHeight });

  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 1,
    pixelRatio: 2, // ✅ Resolusi tinggi tapi tidak berlebihan
    width: actualWidth,
    height: actualHeight,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
    filter: (node) => {
      // Filter out buttons dan sticky elements
      if (node.nodeName === 'BUTTON') return false;
      if ((node as HTMLElement).classList?.contains('sticky')) return false;
      return true;
    },
  });

  // ✅ STEP 5: Restore hidden elements
  restoreHiddenElements(hiddenElements);
  console.log('✅ Elements restored');

  // =================================================================================================
// HELPER: SCALE DOWN CARDS
// =================================================================================================

/**
 * Scale down cards untuk prestasi agar final lebih terlihat
 */
const scaleDownCards = (
  bracketVisual: HTMLElement
): Array<{ el: HTMLElement; originalTransform: string }> => {
  const scaledCards: Array<{ el: HTMLElement; originalTransform: string }> = [];

  // Cari semua card di bracket
  const cards = bracketVisual.querySelectorAll('[class*="absolute"]');
  
  cards.forEach((card) => {
    const htmlCard = card as HTMLElement;
    // Hanya scale card yang berisi participant info (bukan SVG lines)
    if (htmlCard.querySelector('[class*="bg-white"], [class*="border"]')) {
      scaledCards.push({
        el: htmlCard,
        originalTransform: htmlCard.style.transform,
      });
      htmlCard.style.transform = `${htmlCard.style.transform || ''} scale(0.85)`;
      htmlCard.style.transformOrigin = 'center';
    }
  });

  return scaledCards;
};

/**
 * Restore cards ke ukuran semula
 */
const restoreCards = (
  scaledCards: Array<{ el: HTMLElement; originalTransform: string }>
): void => {
  scaledCards.forEach(({ el, originalTransform }) => {
    el.style.transform = originalTransform;
  });
};

  // ✅ STEP 6: Load image
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => (img.onload = resolve));

  console.log('🖼️ Image loaded:', { width: img.width, height: img.height });

  return img;
};

/**
 * Temukan container bracket visual yang benar
 */
const findBracketVisual = (element: HTMLElement): HTMLElement | null => {
  console.log('🔍 Searching for bracket visual container...');
  console.log('📦 Root element:', element);
  
  // Strategy 1: Langsung return element jika sudah SVG container
  if (element.querySelector('svg')) {
    console.log('✅ Root element has SVG, using it directly');
    return element;
  }
  
  // Strategy 2: Cari div dengan SVG dan cards
  const allRelatives = element.querySelectorAll('.relative');
  console.log(`📋 Found ${allRelatives.length} .relative elements`);
  
  for (const rel of allRelatives) {
    const svg = rel.querySelector('svg');
    const cards = rel.querySelectorAll('[class*="absolute"]');

    if (svg && cards.length > 0) {
      console.log(`✅ Found bracket via SVG + ${cards.length} cards`);
      return rel as HTMLElement;
    }
  }

  // Strategy 3: Cari container terbesar dengan SVG
  let maxArea = 0;
  let largest: HTMLElement | null = null;

  for (const rel of allRelatives) {
    if (rel.querySelector('svg')) {
      const htmlRel = rel as HTMLElement;
      const area = htmlRel.offsetWidth * htmlRel.offsetHeight;
      console.log(`📐 Found SVG container: ${area}px area`);
      if (area > maxArea) {
        maxArea = area;
        largest = htmlRel;
      }
    }
  }

  if (largest) {
    console.log('✅ Using largest SVG container');
    return largest;
  }

  // Strategy 4: Fallback - cari semua div dengan overflow
  const allDivs = element.querySelectorAll('div');
  for (const div of allDivs) {
    if (div.querySelector('svg')) {
      console.log('✅ Found SVG in div (fallback)');
      return div as HTMLElement;
    }
  }

  console.error('❌ No bracket visual container found with any strategy');
  return null;
};

/**
 * Hide unwanted elements (leaderboard, external buttons)
 */
const hideUnwantedElements = (
  bracketVisual: HTMLElement
): Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> => {
  const hiddenElements: Array<{
    el: HTMLElement;
    originalDisplay: string;
    originalVisibility: string;
  }> = [];

  // Hide leaderboards
  const leaderboards = document.querySelectorAll(
    '#prestasi-leaderboard, #pemula-leaderboard, [id$="-leaderboard"]'
  );
  leaderboards.forEach((el) => {
    const htmlEl = el as HTMLElement;
    hiddenElements.push({
      el: htmlEl,
      originalDisplay: htmlEl.style.display,
      originalVisibility: htmlEl.style.visibility,
    });
    htmlEl.style.display = 'none';
    htmlEl.style.visibility = 'hidden';
  });

  // Hide buttons outside bracket
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach((btn) => {
    const htmlBtn = btn as HTMLElement;
    if (!bracketVisual.contains(htmlBtn)) {
      hiddenElements.push({
        el: htmlBtn,
        originalDisplay: htmlBtn.style.display,
        originalVisibility: htmlBtn.style.visibility,
      });
      htmlBtn.style.display = 'none';
    }
  });

  return hiddenElements;
};

/**
 * Restore hidden elements
 */
const restoreHiddenElements = (
  hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }>
): void => {
  hiddenElements.forEach(({ el, originalDisplay, originalVisibility }) => {
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
  });
};

// =================================================================================================
// CORE: ADD IMAGE TO PDF WITH PAGINATION
// =================================================================================================

/**
 * Tambahkan image ke PDF dengan pagination otomatis
 */
const addImageToPDF = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: ExportConfig
): void => {
  // ✅ Hitung area konten untuk halaman PERTAMA (ada header)
  const firstPageAvailableHeight =
    PAGE_CONFIG.HEIGHT -
    PAGE_CONFIG.HEADER_HEIGHT -
    PAGE_CONFIG.MARGIN.TOP -
    PAGE_CONFIG.MARGIN.BOTTOM;

  // ✅ Hitung area konten untuk halaman SELANJUTNYA (tanpa margin, full page)
  const nextPagesAvailableHeight = PAGE_CONFIG.HEIGHT;

  const availableWidth = PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN.LEFT - PAGE_CONFIG.MARGIN.RIGHT;

  console.log('📐 Available area:', {
    firstPage: firstPageAvailableHeight,
    nextPages: nextPagesAvailableHeight,
    width: availableWidth,
  });

  // ✅ Hitung scale agar image fit dengan width halaman
  const imageAspectRatio = img.width / img.height;
  const displayWidth = availableWidth;
  const displayHeight = displayWidth / imageAspectRatio;

  console.log('🎨 Display size:', { displayWidth, displayHeight: displayHeight.toFixed(2) });

  // ✅ Hitung berapa banyak halaman yang dibutuhkan
  const remainingHeight = displayHeight - firstPageAvailableHeight;
  const additionalPages = remainingHeight > 0 ? Math.ceil(remainingHeight / nextPagesAvailableHeight) : 0;
  const totalPages = 1 + additionalPages;

  console.log(`📄 Total pages needed: ${totalPages}`);

  // ✅ Buat canvas untuk slicing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;

  let accumulatedDisplayHeight = 0;

  // ✅ Loop untuk setiap halaman
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    console.log(`📄 Processing page ${pageIndex + 1}/${totalPages}`);

    try {
      // Tambah halaman baru (kecuali halaman pertama)
      if (pageIndex > 0) {
        doc.addPage();
      }

      // Background putih
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT, 'F');

      let y: number;
      let currentPageHeight: number;

      if (pageIndex === 0) {
        // ✅ HALAMAN PERTAMA: Ada header dan margin
        renderHeader(doc, config);
        y = PAGE_CONFIG.MARGIN.TOP + PAGE_CONFIG.HEADER_HEIGHT;
        currentPageHeight = firstPageAvailableHeight;
      } else {
        // ✅ HALAMAN SELANJUTNYA: Tanpa margin, full page
        y = 0;
        currentPageHeight = nextPagesAvailableHeight;
      }

      // ✅ Hitung slice untuk halaman ini
      const sourceYStart = (accumulatedDisplayHeight * img.height) / displayHeight;
      const sourceHeight = Math.min(
        (currentPageHeight * img.height) / displayHeight,
        img.height - sourceYStart
      );

      // ✅ Crop image di canvas
      canvas.height = sourceHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, sourceYStart, img.width, sourceHeight, 0, 0, img.width, sourceHeight);

      const slicedDataUrl = canvas.toDataURL('image/png', 1.0);

      // ✅ Hitung tinggi display untuk slice ini
      const sliceDisplayHeight = Math.min(currentPageHeight, displayHeight - accumulatedDisplayHeight);

      const x = pageIndex === 0 ? PAGE_CONFIG.MARGIN.LEFT : 0;
      const imgWidth = pageIndex === 0 ? displayWidth : PAGE_CONFIG.WIDTH;

      console.log(`   ├─ Source: y=${sourceYStart.toFixed(0)}, h=${sourceHeight.toFixed(0)}`);
      console.log(`   └─ Display: x=${x}, y=${y}, h=${sliceDisplayHeight.toFixed(2)}mm`);

      // ✅ Add image ke PDF
      doc.addImage(slicedDataUrl, 'PNG', x, y, imgWidth, sliceDisplayHeight, undefined, 'FAST');

      accumulatedDisplayHeight += sliceDisplayHeight;

      console.log(`   ✅ Page ${pageIndex + 1} rendered successfully`);
    } catch (error) {
      console.error(`   ❌ Error on page ${pageIndex + 1}:`, error);
      throw error;
    }
  }
};

// =================================================================================================
// MAIN EXPORT FUNCTION
// =================================================================================================

/**
 * Export bracket ke PDF dengan format profesional
 * 
 * @param config - Konfigurasi event dan kategori
 * @param bracketElement - HTML element yang berisi bracket visual
 */
export const exportBracketToPDF = async (
  config: ExportConfig,
  bracketElement: HTMLElement
): Promise<void> => {
  console.log('🚀 Starting PDF export...');
  console.log('📋 Config:', config);

  try {
    // ✅ STEP 1: Capture bracket sebagai image
    const bracketImage = await captureBracketImage(bracketElement);

    // ✅ STEP 2: Buat PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // ✅ STEP 3: Tambahkan image ke PDF dengan pagination (halaman pertama sudah ada)
    addImageToPDF(doc, bracketImage, config);

    // ✅ STEP 4: Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedEvent = config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedCategory = config.categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Bracket_${sanitizedEvent}_${sanitizedCategory}_${dateStr}.pdf`;

    // ✅ STEP 5: Save PDF
    doc.save(filename);

    console.log('✅ PDF exported successfully:', filename);
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};

// =================================================================================================
// CONVENIENCE FUNCTION: EXPORT WITH DATA TRANSFORM
// =================================================================================================

/**
 * Export bracket ke PDF langsung dari data API
 * 
 * @param kelasData - Data dari API
 * @param bracketElement - HTML element bracket
 */
export const exportBracketFromData = async (
  kelasData: any,
  bracketElement: HTMLElement
): Promise<void> => {
  const config = transformBracketData(kelasData);
  await exportBracketToPDF(config, bracketElement);
};