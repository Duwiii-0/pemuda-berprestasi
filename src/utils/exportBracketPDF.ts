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
const MARGIN_BOTTOM = 15;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
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
  
  // ✅ STEP 1: Find the actual bracket container (overflow-x-auto div)
  const bracketContainer = element.querySelector('.overflow-x-auto') as HTMLElement;
  
  if (!bracketContainer) {
    throw new Error('Bracket container not found');
  }
  
  console.log('📦 Found bracket container:', {
    scrollWidth: bracketContainer.scrollWidth,
    offsetWidth: bracketContainer.offsetWidth,
    scrollHeight: bracketContainer.scrollHeight,
    offsetHeight: bracketContainer.offsetHeight
  });

  // ✅ STEP 2: Hide ALL unwanted elements
  const elementsToHide = [
    // Leaderboard (by ID and class)
    '#prestasi-leaderboard',
    '#pemula-leaderboard',
    '.leaderboard',
    
    // Headers, toolbars, buttons
    'button',
    '.toolbar',
    'header',
    'nav',
    'aside',
    
    // Round labels (sticky headers)
    '.sticky',
    
    // Any grid containers that might contain leaderboard
    '.lg\\:grid-cols-2',
    '.grid-cols-1'
  ];

  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string }> = [];
  
  elementsToHide.forEach(selector => {
    const elements = element.querySelectorAll(selector);
    elements.forEach(el => {
      const htmlEl = el as HTMLElement;
      hiddenElements.push({
        el: htmlEl,
        originalDisplay: htmlEl.style.display
      });
      htmlEl.style.display = 'none';
    });
  });

  console.log(`🙈 Hidden ${hiddenElements.length} elements`);

  // ✅ STEP 3: Get the inner bracket visual container
  const bracketVisual = bracketContainer.querySelector('.relative') as HTMLElement;
  const targetElement = bracketVisual || bracketContainer;

  // Get actual dimensions including scrollable content
  const width = targetElement.scrollWidth || targetElement.offsetWidth;
  const height = targetElement.scrollHeight || targetElement.offsetHeight;

  console.log('📐 Target dimensions:', { width, height });

  // ✅ STEP 4: Clone and prepare for capture
  const clone = targetElement.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.top = '-99999px';
  clone.style.left = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  clone.style.background = '#FFFFFF';
  clone.style.padding = '20px';
  
  // Remove any hidden elements from clone
  clone.querySelectorAll('button, .sticky').forEach(el => el.remove());
  
  document.body.appendChild(clone);

  // ✅ STEP 5: Capture with high quality
  console.log('📸 Capturing image...');
  const dataUrl = await htmlToImage.toPng(clone, {
    quality: 1,
    pixelRatio: 2.5, // Higher quality
    width: width + 40, // Add padding
    height: height + 40,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left'
    }
  });

  // ✅ STEP 6: Cleanup
  document.body.removeChild(clone);
  
  hiddenElements.forEach(({ el, originalDisplay }) => {
    el.style.display = originalDisplay;
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
  const availableHeight = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - 10;
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

  // Calculate aspect ratio and stretch
  const aspectRatio = canvas.width / canvas.height;
  let displayWidth = availableWidth;
  let displayHeight = displayWidth / aspectRatio;

  // If height exceeds available space, scale down
  if (displayHeight > availableHeight) {
    displayHeight = availableHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  // Center the image
  const x = (PAGE_WIDTH - displayWidth) / 2;
  const y = HEADER_HEIGHT + MARGIN_TOP;

  console.log(`📄 Adding to PDF - Page ${pageNumber}:`, {
    displayWidth: displayWidth.toFixed(2),
    displayHeight: displayHeight.toFixed(2),
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