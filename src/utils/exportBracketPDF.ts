import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import ReactDOM from 'react-dom/client';
import React from 'react';
import BracketRenderer from '../components/BracketRenderer';
import { AuthProvider } from '../context/authContext';
import { KompetisiProvider } from '../context/KompetisiContext';
import BracketExportWrapper from '../components/BracketExportWrapper';
import { components } from 'react-select';

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

// ✅ A4 Constants
const PAGE_WIDTH_A4 = 297;
const PAGE_HEIGHT_A4 = 210;

// ✅ A3 Constants (2x A4)
const PAGE_WIDTH_A3 = 420;
const PAGE_HEIGHT_A3 = 297;

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
  if (participantCount > 16) return 3.25;
  else if (participantCount > 8) return 4.00;
  else if (participantCount > 4) return 4.50;
  else return 5.00;
};

// =================================================================================================
// ✅ FIXED: Deteksi PEMULA (Simple & Clear!)
// =================================================================================================

const isPemulaBracket = (kelasData: any): boolean => {
  const kelompokNama = kelasData?.kelompok?.nama_kelompok?.toLowerCase() || '';
  
  // ✅ PEMULA = ada kata "pemula" atau "beginner"
  // Selain itu = PRESTASI (Junior, Senior, Cadet, dll)
  const isPemula = kelompokNama.includes('pemula') || 
                   kelompokNama.includes('beginner');
  
  console.log('🔍 Bracket Type:', {
    kelompok: kelasData?.kelompok?.nama_kelompok,
    result: isPemula ? '🥇 PEMULA' : '🥋 PRESTASI'
  });
  
  return isPemula;
};

// =================================================================================================
// ✅ Deteksi dari DOM (Backup method)
// =================================================================================================

const detectBracketTypeFromElement = (bracketElement: HTMLElement): 'PRESTASI' | 'PEMULA' => {
  const hasSVG = bracketElement.querySelector('svg') !== null;
  const hasTournamentLayout = bracketElement.querySelector('.tournament-layout') !== null ||
                              bracketElement.classList.contains('tournament-layout');
  
  // SVG lines = PRESTASI bracket
  // Tournament layout cards = PEMULA bracket
  return (hasSVG && !hasTournamentLayout) ? 'PRESTASI' : 'PEMULA';
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
// IMAGE COMPRESSION (PNG → JPEG)
// =================================================================================================

const compressImage = async (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
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
// HEADER & FOOTER (with dynamic page width)
// =================================================================================================

const addHeaderAndFooter = async (
  doc: jsPDF,
  config: ExportConfig,
  pageWidth: number = PAGE_WIDTH_A4
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
      doc.addImage(eventImg, 'PNG', pageWidth - MARGIN_RIGHT - logoSize - 2, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.warn('⚠️ Failed to load Event logo:', error);
    }
  }

  // TEXT INFO (Tengah)
  const centerX = pageWidth / 2;
  let textY = headerY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(THEME.primary);
  doc.text(config.eventName, centerX, textY, { align: 'center' });
  textY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(THEME.text);
  doc.text(config.categoryName, centerX, textY, { align: 'center' });
  textY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(THEME.textSecondary);
  doc.text(config.dateRange, centerX, textY, { align: 'center' });
  textY += 4;

  doc.setFontSize(9);
  doc.text(`${config.location}  •  ${config.totalParticipants} Kompetitor`, centerX, textY, { align: 'center' });
};

// =================================================================================================
// DOM-TO-IMAGE CAPTURE
// =================================================================================================

const convertElementToImage = async (
  element: HTMLElement,
  scaleFactor: number
): Promise<HTMLImageElement> => {
  console.log('🎯 Starting bracket capture...');
  
  const bracketVisual: HTMLElement = element;
  let bracketType: 'PRESTASI' | 'PEMULA' = 'PRESTASI';
  if (element.id === 'pemula-bracket-export-area') {
    bracketType = 'PEMULA';
  }
  
  console.log(`✅ Found bracket (${bracketType}) with ID: ${element.id}`);

  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  const leaderboards = document.querySelectorAll('[id$="-leaderboard"]');
  leaderboards.forEach(el => {
    const htmlEl = el as HTMLElement;
    const isInsideBracket = bracketVisual!.contains(htmlEl);
    const isInsideExportArea = document.getElementById('bracket-export-area')?.contains(htmlEl);
    
    if (!isInsideBracket && !isInsideExportArea) {
      hiddenElements.push({
        el: htmlEl,
        originalDisplay: htmlEl.style.display,
        originalVisibility: htmlEl.style.visibility
      });
      htmlEl.style.display = 'none';
      htmlEl.style.visibility = 'hidden';
    }
  });

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

  const width = Math.max(bracketVisual.scrollWidth, bracketVisual.offsetWidth);
  const height = Math.max(bracketVisual.scrollHeight, bracketVisual.offsetHeight);

  console.log('📐 Dimensions:', { width, height });

  const pixelRatio = 2;

  console.log('📸 Capturing with pixelRatio:', pixelRatio);
  
  const dataUrl = await htmlToImage.toPng(bracketVisual, {
    quality: 0.92,
    pixelRatio: pixelRatio,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    skipFonts: true,
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

  hiddenElements.forEach(({ el, originalDisplay, originalVisibility }) => {
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
  });

  console.log('✅ Image captured, compressing...');

  const compressedImg = await compressImage(dataUrl);
  console.log('✅ Compressed:', { width: compressedImg.width, height: compressedImg.height });
  
  return compressedImg;
};

// =================================================================================================
// ✅ MAIN: SINGLE BRACKET EXPORT (FIXED!)
// =================================================================================================

export const exportBracketFromData = async (
  kelasData: any, 
  bracketElement: HTMLElement,
  metadata?: {
    logoPBTI?: string;
    logoEvent?: string;
    namaKejuaraan?: string;
    kelas?: string;
    tanggalTanding?: string; 
    jumlahKompetitor?: number;
    lokasi?: string;
  }
): Promise<void> => {
  console.log('🚀 Starting PDF export...');
  
  const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
  const participantCount = approvedParticipants.length;
  const scaleFactor = getScaleFactor(participantCount);
  
  console.log(`👥 Participants: ${participantCount}, Scale: ${scaleFactor}`);
  
  // ✅ FIXED: Deteksi isPemula (Simple!)
  const isPemula = isPemulaBracket(kelasData);
  
  // ✅ Determine paper size: A3 for PRESTASI > 32 participants
  const useA3 = !isPemula && participantCount > 32;
  const PAGE_WIDTH = useA3 ? PAGE_WIDTH_A3 : PAGE_WIDTH_A4;
  const PAGE_HEIGHT = useA3 ? PAGE_HEIGHT_A3 : PAGE_HEIGHT_A4;
  
  console.log(`📄 Paper: ${useA3 ? '📋 A3' : '📄 A4'} | Type: ${isPemula ? '🥇 PEMULA' : '🥋 PRESTASI'} | Participants: ${participantCount}`);
  
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
      format: useA3 ? 'a3' : 'a4',
      compress: true 
    });

    // Multi-page untuk Pemula > 70
    if (isPemula && participantCount > 70) {
      console.log('📄 Multi-page export untuk Pemula...');
      
      const allMatchCards = bracketElement.querySelectorAll('.bg-white.rounded-lg.shadow-md.border');
      const totalMatches = allMatchCards.length;
      const matchesPerPage = 50;
      const totalPages = Math.ceil(totalMatches / (matchesPerPage / 2));
      
      console.log(`📊 Total matches: ${totalMatches}, Pages: ${totalPages}`);
      
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) doc.addPage();
        
        console.log(`📄 Page ${pageNum + 1}/${totalPages}...`);
        
        const clonedBracket = bracketElement.cloneNode(true) as HTMLElement;
        const clonedCards = clonedBracket.querySelectorAll('.bg-white.rounded-lg.shadow-md.border');
        
        clonedCards.forEach((card: any) => card.style.display = 'none');
        
        const startIdx = pageNum * (matchesPerPage / 2);
        const endIdx = Math.min(startIdx + (matchesPerPage / 2), totalMatches);
        
        for (let i = startIdx; i < endIdx; i++) {
          if (clonedCards[i]) (clonedCards[i] as HTMLElement).style.display = 'block';
        }
        
        clonedBracket.style.position = 'absolute';
        clonedBracket.style.left = '-9999px';
        document.body.appendChild(clonedBracket);
        
        try {
          const bracketImg = await convertElementToImage(clonedBracket, scaleFactor);
          await addHeaderAndFooter(doc, config, PAGE_WIDTH);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(THEME.primary);
          doc.text(
            `Halaman ${pageNum + 1} dari ${totalPages}`, 
            PAGE_WIDTH - MARGIN_RIGHT - 30, 
            HEADER_HEIGHT + 5, 
            { align: 'right' }
          );

          const contentStartY = HEADER_HEIGHT + MARGIN_TOP;
          const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
          const imgAspectRatio = bracketImg.width / bracketImg.height;
          let displayWidth = maxWidth;
          let displayHeight = displayWidth / imgAspectRatio;

          let zoom = 1.0;
          if (participantCount <= 8) zoom = 1.1;
          else if (participantCount <= 16) zoom = 1.05;
          else if (participantCount <= 32) zoom = 1;
          else zoom = 0.75;

          const HEADER_MARGIN_BOTTOM = 5;
          displayWidth *= zoom;
          displayHeight *= zoom;

          const x = (PAGE_WIDTH - displayWidth) / 2;
          const y = HEADER_HEIGHT + HEADER_MARGIN_BOTTOM;

          doc.addImage(bracketImg.src, 'JPEG', x, y, displayWidth, displayHeight, undefined, 'FAST');
          
          console.log(`✅ Page ${pageNum + 1} added`);
          
        } finally {
          if (document.body.contains(clonedBracket)) {
            document.body.removeChild(clonedBracket);
          }
        }
      }
      
    } else {
      // Single page
      console.log('📄 Single-page export...');
      
      const bracketImg = await convertElementToImage(bracketElement, scaleFactor);
      await addHeaderAndFooter(doc, config, PAGE_WIDTH);

      const contentStartY = HEADER_HEIGHT + MARGIN_TOP;
      const contentEndY = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
      const maxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
      const maxHeight = contentEndY - contentStartY;

      const imgAspectRatio = bracketImg.width / bracketImg.height;
      let displayWidth = maxWidth;
      let displayHeight = displayWidth / imgAspectRatio;

      const totalPeserta = kelasData?.peserta_kompetisi?.length || 0;

      let zoom = 1.0;
      if (isPemula) {
        if (totalPeserta <= 8) zoom = 1.1;
        else if (totalPeserta <= 16) zoom = 1.05;
        else if (totalPeserta <= 32) zoom = 1;
        else zoom = 0.95;
      } else {
        // ✅ Prestasi zoom (adjusted for A3!)
        if (useA3) {
          if (totalPeserta <= 8) zoom = 1.0;
          else if (totalPeserta <= 16) zoom = 0.75;
          else if (totalPeserta <= 32) zoom = 0.45;
          else zoom = 0.35;
        } else {
          if (totalPeserta <= 8) zoom = 0.7;
          else if (totalPeserta <= 16) zoom = 0.5;
          else if (totalPeserta <= 32) zoom = 0.3;
          else zoom = 0.25;
        }
      }

      const HEADER_MARGIN_BOTTOM = 5;
      displayWidth *= zoom;
      displayHeight *= zoom;

      const x = (PAGE_WIDTH - displayWidth) / 2;
      const y = HEADER_HEIGHT + HEADER_MARGIN_BOTTOM;

      doc.addImage(bracketImg.src, 'JPEG', x, y, displayWidth, displayHeight, undefined, 'FAST');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const paperSize = useA3 ? 'A3' : 'A4';
    const filename = `Bracket_${config.eventName.replace(/[^a-z0-9]/gi, '_')}_${config.categoryName.replace(/ /g, '_')}_${paperSize}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log(`✅ PDF saved: ${filename}`);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};

// =================================================================================================
// ✅ BULK EXPORT (FIXED!)
// =================================================================================================

export const exportMultipleBracketsByLapangan = async (
  brackets: Array<{
    kelasData: any;
    bracketData: any;
    lapanganNama: string;
    tanggal: string;
    isPemula: boolean;
    namaKelas: string;
  }>,
  eventMetadata: {
    logoPBTI?: string;
    logoEvent?: string;
    namaKejuaraan: string;
  }
): Promise<void> => {
  console.log(`🚀 Starting bulk export for ${brackets.length} brackets...`);
  
  // ✅ RE-VALIDATE isPemula
  const validatedBrackets = brackets.map(b => ({
    ...b,
    isPemula: isPemulaBracket(b.kelasData)
  }));
  
  const needsA3 = validatedBrackets.some(b => {
    const approvedCount = b.kelasData.peserta_kompetisi?.filter((p: any) => p.status === 'APPROVED').length || 0;
    return !b.isPemula && approvedCount > 32;
  });
  
  const PAGE_WIDTH = needsA3 ? PAGE_WIDTH_A3 : PAGE_WIDTH_A4;
  const PAGE_HEIGHT = needsA3 ? PAGE_HEIGHT_A3 : PAGE_HEIGHT_A4;
  
  console.log(`📄 Bulk export using ${needsA3 ? 'A3' : 'A4'}`);
  
  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: needsA3 ? 'a3' : 'a4',
    compress: true
  });

  const bracketsByLapangan = validatedBrackets.reduce((acc, bracket) => {
    if (!acc[bracket.lapanganNama]) {
      acc[bracket.lapanganNama] = [];
    }
    acc[bracket.lapanganNama].push(bracket);
    return acc;
  }, {} as Record<string, typeof validatedBrackets>);

  let pageIndex = 0;

  for (const [lapanganNama, lapanganBrackets] of Object.entries(bracketsByLapangan)) {
    console.log(`\n📍 Lapangan ${lapanganNama} (${lapanganBrackets.length} brackets)...`);

    for (let i = 0; i < lapanganBrackets.length; i++) {
      const { kelasData, isPemula, tanggal, namaKelas } = lapanganBrackets[i];
      
      console.log(`  📄 Bracket ${i + 1}/${lapanganBrackets.length}: ${namaKelas}`);
      
      if (pageIndex > 0) doc.addPage();
      pageIndex++;

      const tempContainer = document.createElement('div');
      tempContainer.id = `bracket-container-${pageIndex}`;
      document.body.appendChild(tempContainer);

      try {
        const bracketElement = await new Promise<HTMLElement>((resolve, reject) => {
          const root = ReactDOM.createRoot(tempContainer);
          
          const handleRenderComplete = (element: HTMLElement) => {
            console.log('  ✅ Bracket render complete');
            resolve(element);
          };

          root.render(
            React.createElement(BracketExportWrapper, null,
              React.createElement(BracketRenderer, {
                kelasData: kelasData,
                isPemula: isPemula,
                onRenderComplete: handleRenderComplete
              })
            )
          );

          setTimeout(() => reject(new Error('Render timeout')), 10000);
        });

        console.log('  📸 Capturing bracket...');

        const approvedParticipants = kelasData.peserta_kompetisi?.filter((p: any) => p.status === 'APPROVED') || [];
        const participantCount = approvedParticipants.length;
        const scaleFactor = getScaleFactor(participantCount);

        const config: ExportConfig = {
          eventName: eventMetadata.namaKejuaraan,
          categoryName: namaKelas,
          location: kelasData.kompetisi?.lokasi || 'GOR Ranau JSC Palembang',
          dateRange: new Date(tanggal).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
          }),
          totalParticipants: participantCount,
          logoPBTI: eventMetadata.logoPBTI,
          logoEvent: eventMetadata.logoEvent,
        };

        const bracketImg = await convertElementToImage(bracketElement, scaleFactor);
        await addHeaderAndFooter(doc, config, PAGE_WIDTH);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(THEME.primary);
        doc.text(`Lapangan ${lapanganNama}`, PAGE_WIDTH - MARGIN_RIGHT - 25, HEADER_HEIGHT + 5, { align: 'right' });

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

        // Add image to PDF
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

        console.log(`  ✅ Added to PDF`);

      } catch (error) {
        console.error(`  ❌ Error rendering bracket:`, error);
        throw error;
      } finally {
        // ✅ Cleanup
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }
    }
  }

  // Save PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const paperSize = needsA3 ? 'A3' : 'A4';
  const filename = `Brackets_Lapangan_${eventMetadata.namaKejuaraan.replace(/[^a-z0-9]/gi, '_')}_${paperSize}_${dateStr}.pdf`;
  
  doc.save(filename);
  console.log(`\n✅ PDF saved: ${filename} (${pageIndex} pages)`);
};