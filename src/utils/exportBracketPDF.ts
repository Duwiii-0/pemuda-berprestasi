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

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 10; // ✅ Reduced
const MARGIN_LEFT = 10;   // ✅ Reduced from 15
const MARGIN_RIGHT = 10;  // ✅ Reduced from 15
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

// =================================================================================================
// HEADER & FOOTER
// =================================================================================================

const addHeaderAndFooter = (
  doc: jsPDF,
  config: ExportConfig,
  pageNumber: number,
  totalPages: number
) => {
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
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH / 2, footerY, { align: 'center' });
};

// =================================================================================================
// COVER PAGE
// =================================================================================================

const addCoverPage = (doc: jsPDF, config: ExportConfig, totalPages: number) => {
  doc.setFillColor(THEME.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setFillColor(THEME.primary);
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(THEME.white);
  doc.text(config.eventName.toUpperCase(), PAGE_WIDTH / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Competition Bracket', PAGE_WIDTH / 2, 35, { align: 'center' });

  const boxX = PAGE_WIDTH / 2 - 100;
  const boxY = 70;
  const boxWidth = 200;
  const boxHeight = 60;

  doc.setDrawColor(THEME.border);
  doc.setFillColor(THEME.white);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, 'FD');

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
// DOM-TO-IMAGE: CLEAN BRACKET CAPTURE (ONLY BRACKET, NO LEADERBOARD)
// =================================================================================================

const convertElementToImage = async (element: HTMLElement): Promise<HTMLImageElement> => {
  console.log('🎯 Starting bracket capture...');
  console.log('📦 Original element:', element);
  
  // ✅ STEP 1: Find the ACTUAL bracket visual area (with SVG and cards)
  // Look for the div with 'relative' class that contains SVG and positioned cards
  let bracketVisual = element.querySelector('.relative') as HTMLElement;
  
  // If not found in direct children, search deeper
  if (!bracketVisual) {
    const allRelatives = element.querySelectorAll('.relative');
    // Find the one with SVG inside (that's the bracket)
    for (const rel of allRelatives) {
      if (rel.querySelector('svg')) {
        bracketVisual = rel as HTMLElement;
        break;
      }
    }
  }
  
  if (!bracketVisual) {
    console.error('❌ Bracket visual container not found!');
    throw new Error('Bracket visual container with SVG not found');
  }
  
  console.log('✅ Found bracket visual container');
  console.log('📏 Bracket dimensions:', {
    scrollWidth: bracketVisual.scrollWidth,
    offsetWidth: bracketVisual.offsetWidth,
    scrollHeight: bracketVisual.scrollHeight,
    offsetHeight: bracketVisual.offsetHeight,
    clientWidth: bracketVisual.clientWidth,
    clientHeight: bracketVisual.clientHeight
  });

  // ✅ STEP 2: Hide unwanted elements in the ORIGINAL DOM
  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  // Hide leaderboard sections
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

  // Hide buttons OUTSIDE the bracket
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    const htmlBtn = btn as HTMLElement;
    // Only hide if NOT inside the bracket visual
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

  // ✅ STEP 3: Wait a bit for render
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get actual dimensions
  const width = Math.max(bracketVisual.scrollWidth, bracketVisual.offsetWidth, 2000);
  const height = Math.max(bracketVisual.scrollHeight, bracketVisual.offsetHeight, 1000);

  console.log('📐 Final dimensions for capture:', { width, height });

  // ✅ STEP 4: Capture directly (no clone to preserve positioning)
  console.log('📸 Capturing image...');
  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 1,
    pixelRatio: 2,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      margin: '0',
      padding: '20px'
    },
    filter: (node) => {
      // Filter out buttons inside bracket
      if (node.nodeName === 'BUTTON') {
        return false;
      }
      // Filter out sticky headers
      if ((node as HTMLElement).classList?.contains('sticky')) {
        return false;
      }
      return true;
    }
  });

  // ✅ STEP 5: Restore hidden elements
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
// ADD IMAGE TO PAGE (STRETCHED TO FIT)
// =================================================================================================

const addImageToPage = (
  doc: jsPDF,
  img: HTMLImageElement,
  config: ExportConfig,
  pageNumber: number,
  totalPages: number,
  yOffset: number,
  maxHeight: number
) => {
  // ✅ MAKSIMALKAN AREA UNTUK BRACKET
  const availableHeight = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - 5; // Minimal margin
  const availableWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // Create canvas for current page slice
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const sourceY = yOffset;
  const sourceHeight = Math.min(maxHeight, img.height - yOffset);
  
  canvas.width = img.width;
  canvas.height = sourceHeight;
  
  ctx.drawImage(
    img,
    0, sourceY,           // source x, y
    img.width, sourceHeight, // source width, height
    0, 0,                 // dest x, y
    img.width, sourceHeight  // dest width, height
  );

  const croppedData = canvas.toDataURL('image/jpeg', 0.95);

  // Draw white background
  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  addHeaderAndFooter(doc, config, pageNumber, totalPages);

  // ✅ STRETCH MAKSIMAL - PRIORITASKAN WIDTH
  const aspectRatio = canvas.width / canvas.height;
  
  // Start with full width
  let displayWidth = availableWidth;
  let displayHeight = displayWidth / aspectRatio;

  // If height still too tall, fit to height instead
  if (displayHeight > availableHeight) {
    displayHeight = availableHeight;
    displayWidth = displayHeight * aspectRatio;
    
    // ✅ PAKSA FULL WIDTH jika masih ada space
    if (displayWidth < availableWidth) {
      displayWidth = availableWidth;
      displayHeight = displayWidth / aspectRatio;
      
      // Jika overflow, clamp to available height
      if (displayHeight > availableHeight) {
        displayHeight = availableHeight;
      }
    }
  }

  // ✅ POSISI: Stick to left margin, center vertically
  const x = MARGIN_LEFT;
  const y = HEADER_HEIGHT + ((availableHeight - displayHeight) / 2) + 2;

  console.log(`📄 Adding to PDF - Page ${pageNumber}:`, {
    availableWidth: availableWidth.toFixed(2),
    availableHeight: availableHeight.toFixed(2),
    displayWidth: displayWidth.toFixed(2),
    displayHeight: displayHeight.toFixed(2),
    fillPercentage: ((displayWidth / availableWidth) * 100).toFixed(1) + '%',
    x: x.toFixed(2),
    y: y.toFixed(2)
  });

  doc.addImage(croppedData, 'JPEG', x, y, displayWidth, displayHeight, undefined, 'FAST');
};

// =================================================================================================
// MAIN EXPORT FUNCTION
// =================================================================================================

export const exportBracketToPDF = async (kelasData: any, bracketElement: HTMLElement): Promise<void> => {
  console.log('🚀 Starting PDF export...');
  
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
    totalParticipants: kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED').length,
  };

  try {
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4', 
      compress: true 
    });
    doc.deletePage(1);

    // Capture bracket image
    const bracketImg = await convertElementToImage(bracketElement);

    // Calculate how many pages needed
    const maxHeightPerPage = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - 10;
    const pxPerMm = bracketImg.height / maxHeightPerPage;
    const maxPixelsPerPage = Math.floor(maxHeightPerPage * pxPerMm);
    
    const totalSlices = Math.ceil(bracketImg.height / maxPixelsPerPage);
    const totalPages = totalSlices + 1; // +1 for cover

    console.log('📊 PDF Structure:', {
      imageHeight: bracketImg.height,
      maxPixelsPerPage,
      totalSlices,
      totalPages
    });

    // Add cover page
    doc.addPage();
    addCoverPage(doc, config, totalPages);

    // Add bracket pages
    let yOffset = 0;
    for (let i = 0; i < totalSlices; i++) {
      doc.addPage();
      addImageToPage(
        doc, 
        bracketImg, 
        config, 
        i + 2, // Page number (after cover)
        totalPages,
        yOffset,
        maxPixelsPerPage
      );
      yOffset += maxPixelsPerPage;
    }

    // Save PDF
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${config.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log('✅ PDF saved:', filename);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};