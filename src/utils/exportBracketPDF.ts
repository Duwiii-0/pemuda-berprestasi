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
  // ✅ TAMBAHAN untuk logo dan info header
  logoPBTI?: string;
  logoEvent?: string;
}

// ✅ FIXED A4 LANDSCAPE
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 8;
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const HEADER_HEIGHT = 28; // ✅ INCREASED dari 18 ke 35 untuk accommodate logo
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
  if (participantCount > 16) {
    return 1.65;
  } else if (participantCount > 8) {
    return 1.75;
  } else if (participantCount > 4) {
    return 1.80;
  } else {
    return 2.00;
  }
};

// =================================================================================================
// ✅ NEW: LOAD IMAGE HELPER
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
// HEADER & FOOTER - WITH LOGOS
// =================================================================================================

const addHeaderAndFooter = async (
  doc: jsPDF,
  config: ExportConfig
) => {
  const headerY = MARGIN_TOP;
  const logoSize = 18; // ✅ Reduced dari 20
  const logoY = headerY + 1; // ✅ Reduced spacing

  // Logo PBTI (Kiri)
  if (config.logoPBTI) {
    try {
      const pbtiImg = await loadImage(config.logoPBTI);
      doc.addImage(pbtiImg, 'PNG', MARGIN_LEFT + 3, logoY, logoSize, logoSize, undefined, 'FAST');
      console.log('✅ Logo PBTI added');
    } catch (error) {
      console.warn('⚠️ Failed to load PBTI logo:', error);
    }
  }

  // Logo Event (Kanan)
  if (config.logoEvent) {
    try {
      const eventImg = await loadImage(config.logoEvent);
      doc.addImage(eventImg, 'PNG', PAGE_WIDTH - MARGIN_RIGHT - logoSize - 3, logoY, logoSize, logoSize, undefined, 'FAST');
      console.log('✅ Logo Event added');
    } catch (error) {
      console.warn('⚠️ Failed to load Event logo:', error);
    }
  }

  // TEXT INFO (Tengah) - Compact
  const centerX = PAGE_WIDTH / 2;
  let textY = headerY + 4; // ✅ Reduced spacing

  // Nama Event
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13); // ✅ Reduced dari 14
  doc.setTextColor(THEME.primary);
  doc.text(config.eventName, centerX, textY, { align: 'center' });
  textY += 5; // ✅ Reduced spacing

  // Kategori
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10); // ✅ Reduced dari 11
  doc.setTextColor(THEME.text);
  doc.text(config.categoryName, centerX, textY, { align: 'center' });
  textY += 4; // ✅ Reduced spacing

  // Tanggal (Single line - dari input manual)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); // ✅ Reduced dari 9
  doc.setTextColor(THEME.textSecondary);
  doc.text(`${config.dateRange}`, centerX, textY, { align: 'center' });
  textY += 3.5; // ✅ Reduced spacing

  // Lokasi & Kompetitor (dalam 1 baris)
  doc.text(`${config.location}  •  ${config.totalParticipants} Kompetitor`, centerX, textY, { align: 'center' });
};

// =================================================================================================
// DOM-TO-IMAGE: CLEAN BRACKET CAPTURE
// =================================================================================================

const convertElementToImage = async (
  element: HTMLElement,
  scaleFactor: number
): Promise<HTMLImageElement> => {
  console.log('🎯 Starting bracket capture...');
  console.log('📊 Scale factor:', scaleFactor);
  
  let bracketVisual: HTMLElement | null = null;
  let bracketType: 'PRESTASI' | 'PEMULA' | 'UNKNOWN' = 'UNKNOWN';
  
  // ============================================
  // ✅ STEP 1: Check if element itself has class
  // ============================================
  if (element.classList.contains('tournament-layout')) {
    console.log('✅ Element itself is tournament-layout (PEMULA style)');
    bracketVisual = element;
    bracketType = 'PEMULA';
  }
  
  // ============================================
  // ✅ STEP 2: Try to find tournament-layout inside
  // ============================================
  if (!bracketVisual) {
    bracketVisual = element.querySelector('.tournament-layout') as HTMLElement;
    if (bracketVisual) {
      console.log('✅ Found tournament-layout inside element (PEMULA style)');
      bracketType = 'PEMULA';
    }
  }
  
  // ============================================
  // ✅ STEP 3: Look for PRESTASI bracket (has .relative with SVG)
  // ============================================
  if (!bracketVisual) {
    const relativeContainer = element.querySelector('.relative') as HTMLElement;
    if (relativeContainer && relativeContainer.querySelector('svg')) {
      console.log('✅ Found .relative with SVG (PRESTASI style)');
      bracketVisual = relativeContainer;
      bracketType = 'PRESTASI';
    }
  }
  
  // ============================================
  // ✅ STEP 4: Alternative search for PRESTASI
  // ============================================
  if (!bracketVisual) {
    const allRelatives = element.querySelectorAll('.relative');
    for (const rel of allRelatives) {
      if (rel.querySelector('svg')) {
        bracketVisual = rel as HTMLElement;
        bracketType = 'PRESTASI';
        console.log('✅ Found .relative with SVG (alternative search)');
        break;
      }
    }
  }
  
  // ============================================
  // ✅ STEP 5: Fallback - use element directly if has content
  // ============================================
  if (!bracketVisual && element.children.length > 0) {
    console.log('⚠️ Using element directly as fallback');
    bracketVisual = element;
    
    // Detect type based on content
    if (element.querySelector('svg')) {
      bracketType = 'PRESTASI';
    } else if (element.querySelector('.bg-white.rounded-lg')) {
      bracketType = 'PEMULA';
    }
  }
  
  // ============================================
  // ❌ ERROR: Nothing found
  // ============================================
  if (!bracketVisual) {
    console.error('❌ Bracket visual container not found!');
    console.error('Element details:', {
      tagName: element.tagName,
      classList: Array.from(element.classList),
      childrenCount: element.children.length,
      hasContent: element.innerHTML.length > 0
    });
    throw new Error('Bracket visual container not found');
  }
  
  console.log(`✅ Found bracket visual container (${bracketType}):`, {
    tagName: bracketVisual.tagName,
    classList: Array.from(bracketVisual.classList),
    childrenCount: bracketVisual.children.length
  });

  // ============================================
  // Hide unwanted elements
  // ============================================
  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  // ✅ HIDE: Leaderboard (both types)
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

  // ✅ HIDE: Header section with logo (if exists)
  const headerWithLogos = element.querySelector('.flex.items-center.justify-between.gap-6.mb-4') as HTMLElement;
  if (headerWithLogos && headerWithLogos.querySelector('img')) {
    hiddenElements.push({
      el: headerWithLogos,
      originalDisplay: headerWithLogos.style.display,
      originalVisibility: headerWithLogos.style.visibility
    });
    headerWithLogos.style.display = 'none';
    headerWithLogos.style.visibility = 'hidden';
  }

  // ✅ HIDE: All buttons outside bracket
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

  // ✅ HIDE: Edit buttons inside bracket cards (for PEMULA)
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

  console.log(`🙈 Hidden ${hiddenElements.length} elements (Type: ${bracketType})`);

  await new Promise(resolve => setTimeout(resolve, 100));

  // ============================================
  // Capture dimensions
  // ============================================
  const width = Math.max(bracketVisual.scrollWidth, bracketVisual.offsetWidth);
  const height = Math.max(bracketVisual.scrollHeight, bracketVisual.offsetHeight);

  console.log('📐 Original dimensions:', { width, height, type: bracketType });
  console.log('🔍 Applying scale:', scaleFactor);

  // ============================================
  // Capture image with html-to-image
  // ============================================
  console.log('📸 Capturing image...');
  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 1,
    pixelRatio: 3 * scaleFactor,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      transform: `scale(${1.0})`,
      transformOrigin: 'center center',
      margin: '0',
    },
    filter: (node) => {
      // Filter out buttons
      if (node.nodeName === 'BUTTON') {
        return false;
      }
      // Filter out sticky elements
      if ((node as HTMLElement).classList?.contains('sticky')) {
        return false;
      }
      // Filter out edit icons
      if ((node as HTMLElement).tagName === 'svg' && 
          (node as HTMLElement).parentElement?.tagName === 'BUTTON') {
        return false;
      }
      return true;
    }
  });

  // ============================================
  // Restore hidden elements
  // ============================================
  hiddenElements.forEach(({ el, originalDisplay, originalVisibility }) => {
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
  });

  console.log('✅ Image captured successfully');

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => (img.onload = resolve));
  
  console.log('🖼️ Image loaded:', { width: img.width, height: img.height });
  
  return img;
};

// =================================================================================================
// ✅ MAIN EXPORT FUNCTION - WITH METADATA SUPPORT
// =================================================================================================

export const exportBracketFromData = async (
  kelasData: any, 
  bracketElement: HTMLElement,
  metadata?: {  // ✅ Parameter ketiga (optional)
    logoPBTI?: string;
    logoEvent?: string;
    namaKejuaraan?: string;
    kelas?: string;
    tanggalTanding?: string;
    jumlahKompetitor?: number;
    lokasi?: string;
  }
): Promise<void> => {
  console.log('🚀 Starting PDF export (A4 Single Page with Logos)...');
  
  const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
  const participantCount = approvedParticipants.length;
  
  const scaleFactor = getScaleFactor(participantCount);
  
  console.log(`📄 Format: A4 Landscape (${PAGE_WIDTH}x${PAGE_HEIGHT}mm)`);
  console.log(`👥 Participants: ${participantCount}`);
  console.log(`📏 Scale factor: ${scaleFactor}`);
  
  // ✅ Use metadata if provided, otherwise use kelasData
  const config: ExportConfig = {
    eventName: metadata?.namaKejuaraan || kelasData.kompetisi.nama_event,
    categoryName: metadata?.kelas || `${kelasData.kelompok?.nama_kelompok || ''} ${
      kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
    } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim(),
    location: metadata?.lokasi || kelasData.kompetisi.lokasi,
    dateRange: metadata?.tanggalTanding || `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}`,
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

    // ✅ Capture bracket FIRST
    const bracketImg = await convertElementToImage(bracketElement, scaleFactor);

    // ✅ Add header with logos AFTER capture (async function now)
    await addHeaderAndFooter(doc, config);

    // ✅ Calculate available space (adjusted for larger header)
    const contentStartY = HEADER_HEIGHT + MARGIN_TOP; // +2 for spacing
    const contentEndY = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
    const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const maxHeight = contentEndY - contentStartY;

    console.log('📐 Maximum available space:', { 
      width: maxWidth.toFixed(2), 
      height: maxHeight.toFixed(2),
      startY: contentStartY.toFixed(2),
      endY: contentEndY.toFixed(2)
    });

    // Calculate image dimensions
    const imgAspectRatio = bracketImg.width / bracketImg.height;
    
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / imgAspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * imgAspectRatio;
    }

    console.log('📏 Image sizing:', {
      originalAspectRatio: imgAspectRatio.toFixed(3),
      calculatedWidth: displayWidth.toFixed(2),
      calculatedHeight: displayHeight.toFixed(2),
      widthUsage: `${((displayWidth / maxWidth) * 100).toFixed(1)}%`,
      heightUsage: `${((displayHeight / maxHeight) * 100).toFixed(1)}%`
    });

    // Perfect center calculation
    const centerX = MARGIN_LEFT + (maxWidth / 2);
    const centerY = contentStartY + (maxHeight / 2);

    const x = centerX - (displayWidth / 2);
    const y = centerY - (displayHeight / 2);

    console.log('🎯 Perfect centering:', {
      pageCenter: { x: centerX.toFixed(2), y: centerY.toFixed(2) },
      imageTopLeft: { x: x.toFixed(2), y: y.toFixed(2) }
    });

    // Add bracket image to PDF
    doc.addImage(
      bracketImg.src, 
      'PNG', 
      x, 
      y, 
      displayWidth, 
      displayHeight, 
      undefined, 
      'FAST'
    );

    // Save PDF
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_A4_${config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log(`✅ PDF saved: ${filename}`);
    console.log(`📏 Final: Scale ${scaleFactor}x for ${participantCount} participants with LOGOS!`);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};