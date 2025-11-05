import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

// =================================================================================================
// CONFIGURATION & CONSTANTS
// =================================================================================================

interface ExportConfig {
  eventName: string;
  categoryName: string;
  location: string;
  dateRange: string;
  totalParticipants: number;
  logoPBTI?: string;
  logoEvent?: string;
}

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 8;
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const HEADER_HEIGHT = 28;
const FOOTER_HEIGHT = 8;

const THEME = {
  primary: '#990D35',
  background: '#F5FBEF',
  text: '#050505',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

const getScaleFactor = (participantCount: number): number => {
  if (participantCount > 16) return 1.65;
  else if (participantCount > 8) return 1.75;
  else if (participantCount > 4) return 1.80;
  else return 2.00;
};

// =================================================================================================
// LOAD IMAGE HELPER
// =================================================================================================

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// =================================================================================================
// ✅ NEW: IMAGE COMPRESSION (PNG → JPEG)
// =================================================================================================

const compressImage = async (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // ✅ Convert to JPEG with 85% quality (sweet spot)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const compressedImg = new Image();
      compressedImg.onload = () => resolve(compressedImg);
      compressedImg.onerror = reject;
      compressedImg.src = compressedDataUrl;
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// =================================================================================================
// HEADER & FOOTER
// =================================================================================================

const addHeaderAndFooter = async (
  doc: jsPDF,
  config: ExportConfig
) => {
  const headerY = MARGIN_TOP;
  const logoSize = 20;
  const logoY = headerY + 2;

  // Logo PBTI (Kiri)
  if (config.logoPBTI) {
    try {
      const pbtiImg = await loadImage(config.logoPBTI);
      doc.addImage(pbtiImg, 'PNG', MARGIN_LEFT + 2, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.warn('⚠️ Failed to load PBTI logo:', error);
    }
  }

  // Logo Event (Kanan)
  if (config.logoEvent) {
    try {
      const eventImg = await loadImage(config.logoEvent);
      doc.addImage(eventImg, 'PNG', PAGE_WIDTH - MARGIN_RIGHT - logoSize - 2, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.warn('⚠️ Failed to load Event logo:', error);
    }
  }

  // TEXT INFO (Tengah)
  const centerX = PAGE_WIDTH / 2;
  let textY = headerY + 6;

  // Nama Event
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(THEME.primary);
  doc.text(config.eventName, centerX, textY, { align: 'center' });
  textY += 6;

  // Kategori
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(THEME.text);
  doc.text(config.categoryName, centerX, textY, { align: 'center' });
  textY += 5;

  // ✅ Tanggal (NO prefix)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.dateRange, centerX, textY, { align: 'center' });
  textY += 4;

  // Lokasi & Kompetitor
  doc.setFontSize(9);
  doc.text(`${config.location}  •  ${config.totalParticipants} Kompetitor`, centerX, textY, { align: 'center' });
};

// =================================================================================================
// ✅ OPTIMIZED: DOM-TO-IMAGE CAPTURE
// =================================================================================================

const convertElementToImage = async (
  element: HTMLElement,
  scaleFactor: number
): Promise<HTMLImageElement> => {
  console.log('🎯 Starting bracket capture...');
  
  let bracketVisual: HTMLElement | null = null;
  let bracketType: 'PRESTASI' | 'PEMULA' | 'UNKNOWN' = 'UNKNOWN';
  
  // Find bracket container
  if (element.classList.contains('tournament-layout')) {
    bracketVisual = element;
    bracketType = 'PEMULA';
  }
  
  if (!bracketVisual) {
    bracketVisual = element.querySelector('.tournament-layout') as HTMLElement;
    if (bracketVisual) bracketType = 'PEMULA';
  }
  
  if (!bracketVisual) {
    const relativeContainer = element.querySelector('.relative') as HTMLElement;
    if (relativeContainer && relativeContainer.querySelector('svg')) {
      bracketVisual = relativeContainer;
      bracketType = 'PRESTASI';
    }
  }
  
  if (!bracketVisual) {
    const allRelatives = element.querySelectorAll('.relative');
    for (const rel of allRelatives) {
      if (rel.querySelector('svg')) {
        bracketVisual = rel as HTMLElement;
        bracketType = 'PRESTASI';
        break;
      }
    }
  }
  
  if (!bracketVisual && element.children.length > 0) {
    bracketVisual = element;
    if (element.querySelector('svg')) bracketType = 'PRESTASI';
    else if (element.querySelector('.bg-white.rounded-lg')) bracketType = 'PEMULA';
  }
  
  if (!bracketVisual) {
    throw new Error('Bracket visual container not found');
  }
  
  console.log(`✅ Found bracket (${bracketType})`);

  // Hide unwanted elements
  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  // Hide leaderboards
  const leaderboards = document.querySelectorAll(
    '#prestasi-leaderboard, #pemula-leaderboard, [id$="-leaderboard"], ' +
    '[class*="leaderboard"], .lg\\:sticky'
  );
  leaderboards.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (!bracketVisual!.contains(htmlEl)) {
      hiddenElements.push({
        el: htmlEl,
        originalDisplay: htmlEl.style.display,
        originalVisibility: htmlEl.style.visibility
      });
      htmlEl.style.display = 'none';
      htmlEl.style.visibility = 'hidden';
    }
  });

  // Hide header with logos
  const headerWithLogos = element.querySelector('.flex.items-start.justify-between.gap-4.mb-3') as HTMLElement;
  if (headerWithLogos) {
    hiddenElements.push({
      el: headerWithLogos,
      originalDisplay: headerWithLogos.style.display,
      originalVisibility: headerWithLogos.style.visibility
    });
    headerWithLogos.style.display = 'none';
    headerWithLogos.style.visibility = 'hidden';
  }

  // Hide all buttons outside bracket
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    const htmlBtn = btn as HTMLElement;
    if (!bracketVisual!.contains(htmlBtn)) {
      hiddenElements.push({
        el: htmlBtn,
        originalDisplay: htmlBtn.style.display,
        originalVisibility: htmlBtn.style.visibility
      });
      htmlBtn.style.display = 'none';
    }
  });

  // Hide edit buttons inside bracket (PEMULA)
  if (bracketType === 'PEMULA') {
    const editButtons = bracketVisual.querySelectorAll('button');
    editButtons.forEach(btn => {
      const htmlBtn = btn as HTMLElement;
      hiddenElements.push({
        el: htmlBtn,
        originalDisplay: htmlBtn.style.display,
        originalVisibility: htmlBtn.style.visibility
      });
      htmlBtn.style.display = 'none';
    });
  }

  console.log(`🙈 Hidden ${hiddenElements.length} elements`);

  await new Promise(resolve => setTimeout(resolve, 100));

  // Get dimensions
  const width = Math.max(bracketVisual.scrollWidth, bracketVisual.offsetWidth);
  const height = Math.max(bracketVisual.scrollHeight, bracketVisual.offsetHeight);

  console.log('📐 Dimensions:', { width, height });

  // ✅ OPTIMIZED: Fixed pixel ratio (bukan 3 * scaleFactor)
  const pixelRatio = 2;

  console.log('📸 Capturing with pixelRatio:', pixelRatio);
  
  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 0.92, // ✅ Reduced dari 1.0
    pixelRatio: pixelRatio, // ✅ Fixed 2x
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    skipFonts: true, // ✅ Faster rendering
    style: {
      transform: 'scale(1.0)',
      transformOrigin: 'center center',
      margin: '0',
    },
    filter: (node) => {
      if (node.nodeName === 'BUTTON') return false;
      if ((node as HTMLElement).classList?.contains('sticky')) return false;
      if ((node as HTMLElement).tagName === 'svg' && 
          (node as HTMLElement).parentElement?.tagName === 'BUTTON') return false;
      return true;
    }
  });

  // Restore hidden elements
  hiddenElements.forEach(({ el, originalDisplay, originalVisibility }) => {
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
  });

  console.log('✅ Image captured, compressing...');

  // ✅ COMPRESS: PNG → JPEG
  const compressedImg = await compressImage(dataUrl);
  console.log('✅ Compressed:', { width: compressedImg.width, height: compressedImg.height });
  
  return compressedImg;
};

// =================================================================================================
// ✅ MAIN: SINGLE BRACKET EXPORT
// =================================================================================================

export const exportBracketFromData = async (
  kelasData: any, 
  bracketElement: HTMLElement,
  metadata?: {
    logoPBTI?: string;
    logoEvent?: string;
    namaKejuaraan?: string;
    kelas?: string;
    tanggalTanding?: string; // ✅ Format: "5 November 2025" (manual input)
    jumlahKompetitor?: number;
    lokasi?: string;
  }
): Promise<void> => {
  console.log('🚀 Starting PDF export (Optimized)...');
  
  const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
  const participantCount = approvedParticipants.length;
  const scaleFactor = getScaleFactor(participantCount);
  
  console.log(`👥 Participants: ${participantCount}, Scale: ${scaleFactor}`);
  
  // ✅ Config dengan prioritas metadata
  const config: ExportConfig = {
    eventName: metadata?.namaKejuaraan || kelasData.kompetisi.nama_event,
    categoryName: metadata?.kelas || `${kelasData.kelompok?.nama_kelompok || ''} ${
      kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
    } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim(),
    location: metadata?.lokasi || kelasData.kompetisi.lokasi,
    dateRange: metadata?.tanggalTanding || new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    totalParticipants: metadata?.jumlahKompetitor || participantCount,
    logoPBTI: metadata?.logoPBTI,
    logoEvent: metadata?.logoEvent,
  };

  try {
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4',
      compress: true 
    });

    const bracketImg = await convertElementToImage(bracketElement, scaleFactor);
    await addHeaderAndFooter(doc, config);

    // Calculate layout
    const contentStartY = HEADER_HEIGHT + MARGIN_TOP;
    const contentEndY = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
    const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const maxHeight = contentEndY - contentStartY;

    const imgAspectRatio = bracketImg.width / bracketImg.height;
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / imgAspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * imgAspectRatio;
    }

    const centerX = MARGIN_LEFT + (maxWidth / 2);
    const centerY = contentStartY + (maxHeight / 2);
    const x = centerX - (displayWidth / 2);
    const y = centerY - (displayHeight / 2);

    // ✅ Add as JPEG (smaller size)
    doc.addImage(
      bracketImg.src, 
      'JPEG', 
      x, 
      y, 
      displayWidth, 
      displayHeight, 
      undefined, 
      'FAST'
    );

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${config.eventName.replace(/[^a-z0-9]/gi, '_')}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log(`✅ PDF saved: ${filename}`);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};

// =================================================================================================
// ✅ NEW: EXPORT MULTIPLE BRACKETS (LAPANGAN)
// =================================================================================================

export const exportMultipleBrackets = async (
  brackets: Array<{
    kelasData: any;
    element: HTMLElement;
    metadata?: {
      kelas?: string;
      tanggalTanding?: string;
      jumlahKompetitor?: number;
      lokasi?: string;
    };
  }>,
  eventMetadata: {
    logoPBTI?: string;
    logoEvent?: string;
    namaKejuaraan: string;
  }
): Promise<void> => {
  console.log(`🚀 Exporting ${brackets.length} brackets...`);
  
  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: 'a4',
    compress: true
  });

  for (let i = 0; i < brackets.length; i++) {
    const { kelasData, element, metadata } = brackets[i];
    
    console.log(`📄 Processing bracket ${i + 1}/${brackets.length}...`);
    
    if (i > 0) {
      doc.addPage();
    }

    const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
    const participantCount = approvedParticipants.length;
    const scaleFactor = getScaleFactor(participantCount);

    const config: ExportConfig = {
      eventName: eventMetadata.namaKejuaraan,
      categoryName: metadata?.kelas || `${kelasData.kelompok?.nama_kelompok || ''} ${
        kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
      } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim(),
      location: metadata?.lokasi || kelasData.kompetisi.lokasi,
      dateRange: metadata?.tanggalTanding || new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      totalParticipants: metadata?.jumlahKompetitor || participantCount,
      logoPBTI: eventMetadata.logoPBTI,
      logoEvent: eventMetadata.logoEvent,
    };

    const bracketImg = await convertElementToImage(element, scaleFactor);
    await addHeaderAndFooter(doc, config);

    const contentStartY = HEADER_HEIGHT + MARGIN_TOP;
    const contentEndY = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
    const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const maxHeight = contentEndY - contentStartY;

    const imgAspectRatio = bracketImg.width / bracketImg.height;
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / imgAspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * imgAspectRatio;
    }

    const centerX = MARGIN_LEFT + (maxWidth / 2);
    const centerY = contentStartY + (maxHeight / 2);
    const x = centerX - (displayWidth / 2);
    const y = centerY - (displayHeight / 2);

    doc.addImage(
      bracketImg.src, 
      'JPEG', 
      x, 
      y, 
      displayWidth, 
      displayHeight, 
      undefined, 
      'FAST'
    );

    console.log(`✅ Bracket ${i + 1} added`);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Brackets_${eventMetadata.namaKejuaraan.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.pdf`;
  
  doc.save(filename);
  console.log(`✅ Saved ${brackets.length} brackets: ${filename}`);
};