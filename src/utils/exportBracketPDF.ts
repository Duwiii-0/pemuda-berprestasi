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
}

// ✅ FIXED A4 LANDSCAPE
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const HEADER_HEIGHT = 18;
const FOOTER_HEIGHT = 10;

const THEME = {
  primary: '#990D35',
  background: '#F5FBEF',
  text: '#050505',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

// ✅ DYNAMIC SCALE based on participant count
const getScaleFactor = (participantCount: number): number => {
  if (participantCount > 16) {
    return 0.55; // Sangat kecil untuk banyak peserta
  } else if (participantCount > 8) {
    return 0.65; // Sedang
  } else if (participantCount > 4) {
    return 0.75; // Agak besar
  } else {
    return 0.85; // Besar untuk sedikit peserta
  }
};

// =================================================================================================
// HEADER & FOOTER
// =================================================================================================

const addHeaderAndFooter = (
  doc: jsPDF,
  config: ExportConfig
) => {
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(THEME.text);
  doc.text(config.eventName, PAGE_WIDTH / 2, MARGIN_TOP + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.categoryName, PAGE_WIDTH / 2, MARGIN_TOP + 11, { align: 'center' });

  // Footer
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(THEME.textSecondary);
  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(exportDate, MARGIN_LEFT, footerY);
  doc.text('Tournament Bracket - Prestasi Category', PAGE_WIDTH / 2, footerY, { align: 'center' });
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
  
  let bracketVisual = element.querySelector('.tournament-layout') as HTMLElement;
  
  if (!bracketVisual) {
    bracketVisual = element.querySelector('.relative') as HTMLElement;
  }
  
  if (!bracketVisual) {
    const allRelatives = element.querySelectorAll('.relative');
    for (const rel of allRelatives) {
      if (rel.querySelector('svg')) {
        bracketVisual = rel as HTMLElement;
        break;
      }
    }
  }
  
  if (!bracketVisual) {
    console.error('❌ Bracket visual container not found!');
    throw new Error('Bracket visual container not found');
  }
  
  console.log('✅ Found bracket visual container');

  // Hide unwanted elements
  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  const leaderboards = document.querySelectorAll('#prestasi-leaderboard, #pemula-leaderboard, [id$="-leaderboard"]');
  leaderboards.forEach(el => {
    const htmlEl = el as HTMLElement;
    hiddenElements.push({
      el: htmlEl,
      originalDisplay: htmlEl.style.display,
      originalVisibility: htmlEl.style.visibility
    });
    htmlEl.style.display = 'none';
    htmlEl.style.visibility = 'hidden';
  });

  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    const htmlBtn = btn as HTMLElement;
    if (!bracketVisual.contains(htmlBtn)) {
      hiddenElements.push({
        el: htmlBtn,
        originalDisplay: htmlBtn.style.display,
        originalVisibility: htmlBtn.style.visibility
      });
      htmlBtn.style.display = 'none';
    }
  });

  console.log(`🙈 Hidden ${hiddenElements.length} elements`);

  await new Promise(resolve => setTimeout(resolve, 100));

  const width = Math.max(bracketVisual.scrollWidth, bracketVisual.offsetWidth);
  const height = Math.max(bracketVisual.scrollHeight, bracketVisual.offsetHeight);

  console.log('📐 Original dimensions:', { width, height });
  console.log('🔍 Applying scale:', scaleFactor);

  // ✅ CAPTURE dengan scale yang sudah disesuaikan
  console.log('📸 Capturing image...');
  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 1,
    pixelRatio: 2,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
      margin: '0',
    },
    filter: (node) => {
      if (node.nodeName === 'BUTTON') {
        return false;
      }
      if ((node as HTMLElement).classList?.contains('sticky')) {
        return false;
      }
      return true;
    }
  });

  // Restore hidden elements
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
// MAIN EXPORT FUNCTION - SINGLE A4 PAGE
// =================================================================================================

export const exportBracketFromData = async (
  kelasData: any, 
  bracketElement: HTMLElement
): Promise<void> => {
  console.log('🚀 Starting PDF export (A4 Single Page)...');
  
  const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
  const participantCount = approvedParticipants.length;
  
  // ✅ Get dynamic scale based on participant count
  const scaleFactor = getScaleFactor(participantCount);
  
  console.log(`📄 Format: A4 Landscape (${PAGE_WIDTH}x${PAGE_HEIGHT}mm)`);
  console.log(`👥 Participants: ${participantCount}`);
  console.log(`📏 Scale factor: ${scaleFactor}`);
  
  const config: ExportConfig = {
    eventName: kelasData.kompetisi.nama_event,
    categoryName: `${kelasData.kelompok?.nama_kelompok || ''} ${
      kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
    } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim(),
    location: kelasData.kompetisi.lokasi,
    dateRange: `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}`,
    totalParticipants: participantCount,
  };

  try {
    // ✅ Create A4 Landscape PDF
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4',
      compress: true 
    });

    // ✅ Capture bracket with dynamic scale
    const bracketImg = await convertElementToImage(bracketElement, scaleFactor);

    // ✅ Calculate available space
    const availableWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const availableHeight = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - 10;

    console.log('📐 Available space:', { 
      width: availableWidth, 
      height: availableHeight 
    });

    // ✅ Add header and footer
    addHeaderAndFooter(doc, config);

    // ✅ Calculate image dimensions to fit and center
    const imgAspectRatio = bracketImg.width / bracketImg.height;
    
    let displayWidth = availableWidth;
    let displayHeight = displayWidth / imgAspectRatio;

    // If height exceeds available space, scale down
    if (displayHeight > availableHeight) {
      displayHeight = availableHeight;
      displayWidth = displayHeight * imgAspectRatio;
    }

    // ✅ CENTER the bracket
    const x = MARGIN_LEFT + (availableWidth - displayWidth) / 2;
    const y = HEADER_HEIGHT + 5 + (availableHeight - displayHeight) / 2;

    console.log('🎯 Final placement:', {
      x: x.toFixed(2),
      y: y.toFixed(2),
      width: displayWidth.toFixed(2),
      height: displayHeight.toFixed(2),
      centered: true
    });

    // ✅ Add bracket image to PDF (centered)
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

    // ✅ Save PDF
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_A4_${config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log(`✅ PDF saved: ${filename}`);
    console.log(`📏 Format: A4 Landscape - Scale: ${scaleFactor} for ${participantCount} participants!`);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};