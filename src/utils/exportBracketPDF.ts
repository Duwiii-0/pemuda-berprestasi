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

// ✅ NEW: Dynamic page dimensions
interface PageDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerHeight: number;
  footerHeight: number;
}

// ✅ NEW: Page configurations
const PAGE_CONFIGS = {
  A4: {
    width: 297,
    height: 210,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 10,
    marginRight: 10,
    headerHeight: 28,
    footerHeight: 8,
  },
  A3: {
    width: 420,
    height: 297,
    marginTop: 12,
    marginBottom: 10,
    marginLeft: 12,
    marginRight: 12,
    headerHeight: 32,
    footerHeight: 10,
  }
};

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
// ✅ FIXED: HEADER & FOOTER with Dynamic Dimensions
// =================================================================================================

const addHeaderAndFooter = async (
  doc: jsPDF,
  config: ExportConfig,
  pageDims: PageDimensions // ✅ NEW: Accept dynamic dimensions
) => {
  const headerY = pageDims.marginTop;
  const logoSize = 20;
  const logoY = headerY + 2;

  // Logo PBTI (Kiri)
  if (config.logoPBTI) {
    try {
      const pbtiImg = await loadImage(config.logoPBTI);
      doc.addImage(pbtiImg, 'PNG', pageDims.marginLeft + 2, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.warn('⚠️ Failed to load PBTI logo:', error);
    }
  }

  // Logo Event (Kanan)
  if (config.logoEvent) {
    try {
      const eventImg = await loadImage(config.logoEvent);
      doc.addImage(eventImg, 'PNG', pageDims.width - pageDims.marginRight - logoSize - 2, logoY, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.warn('⚠️ Failed to load Event logo:', error);
    }
  }

  // TEXT INFO (Tengah)
  const centerX = pageDims.width / 2;
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

  // Tanggal
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
// ✅ FIXED: DOM-TO-IMAGE CAPTURE with Bracket Type Parameter
// =================================================================================================

const convertElementToImage = async (
  element: HTMLElement,
  scaleFactor: number,
  bracketType: 'PRESTASI' | 'PEMULA' // ✅ NEW: Explicit parameter (no more detection)
): Promise<HTMLImageElement> => {
  console.log(`🎯 Starting bracket capture for ${bracketType}...`);
  
  let bracketVisual: HTMLElement | null = null;
  
  // ✅ FIXED: Use parameter instead of detection
  if (bracketType === 'PEMULA') {
    // Find PEMULA bracket (tournament-layout)
    if (element.classList.contains('tournament-layout')) {
      bracketVisual = element;
    } else {
      bracketVisual = element.querySelector('.tournament-layout') as HTMLElement;
    }
  } else {
    // Find PRESTASI bracket (SVG container)
    const relativeContainer = element.querySelector('.relative') as HTMLElement;
    if (relativeContainer && relativeContainer.querySelector('svg')) {
      bracketVisual = relativeContainer;
    } else {
      const allRelatives = element.querySelectorAll('.relative');
      for (const rel of allRelatives) {
        if (rel.querySelector('svg')) {
          bracketVisual = rel as HTMLElement;
          break;
        }
      }
    }
  }
  
  if (!bracketVisual && element.children.length > 0) {
    bracketVisual = element;
  }
  
  if (!bracketVisual) {
    throw new Error('Bracket visual container not found');
  }
  
  console.log(`✅ Found bracket (${bracketType})`);

  // Hide unwanted elements
  const hiddenElements: Array<{ el: HTMLElement; originalDisplay: string; originalVisibility: string }> = [];
  
  // Hide leaderboards
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

  // Restore hidden elements
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
// ✅ FIXED: MAIN EXPORT with A3 Support & Fixed Bracket Detection
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
  },
  customZoom?: number // ✅ NEW: Optional manual zoom override
): Promise<void> => {
  console.log('🚀 Starting PDF export with A3 support...');
  
  const approvedParticipants = kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED');
  const participantCount = approvedParticipants.length;
  const scaleFactor = getScaleFactor(participantCount);
  
  console.log(`👥 Participants: ${participantCount}, Scale: ${scaleFactor}`);
  
  // ✅ FIXED: Detect from DATA, not DOM
  const isPemula = !kelasData?.kategori_event?.nama_kategori?.toLowerCase().includes('prestasi');
  const bracketType: 'PRESTASI' | 'PEMULA' = isPemula ? 'PEMULA' : 'PRESTASI';
  
  // ✅ NEW: A3 for Prestasi > 32 participants
  const useA3 = !isPemula && participantCount > 32;
  const pageDims = useA3 ? PAGE_CONFIGS.A3 : PAGE_CONFIGS.A4;
  
  console.log(`📄 Format: ${useA3 ? 'A3' : 'A4'} (Bracket Type: ${bracketType})`);
  
  // Config dengan prioritas metadata
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
      format: useA3 ? 'a3' : 'a4', // ✅ FIXED: Dynamic format
      compress: true 
    });

    // ✅ MULTI-PAGE LOGIC untuk Pemula
    if (isPemula && participantCount > 70) {
      console.log('📄 Multi-page export untuk Pemula...');
      
      const allMatchCards = bracketElement.querySelectorAll('.bg-white.rounded-lg.shadow-md.border');
      const totalMatches = allMatchCards.length;
      const matchesPerPage = 50;
      const totalPages = Math.ceil(totalMatches / (matchesPerPage / 2));
      
      console.log(`📊 Total matches: ${totalMatches}, Pages needed: ${totalPages}`);
      
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          doc.addPage();
        }
        
        console.log(`📄 Processing page ${pageNum + 1}/${totalPages}...`);
        
        const clonedBracket = bracketElement.cloneNode(true) as HTMLElement;
        
        const clonedCards = clonedBracket.querySelectorAll('.bg-white.rounded-lg.shadow-md.border');
        clonedCards.forEach((card: any) => {
          card.style.display = 'none';
        });
        
        const startIdx = pageNum * (matchesPerPage / 2);
        const endIdx = Math.min(startIdx + (matchesPerPage / 2), totalMatches);
        
        for (let i = startIdx; i < endIdx; i++) {
          if (clonedCards[i]) {
            (clonedCards[i] as HTMLElement).style.display = 'block';
          }
        }
        
        clonedBracket.style.position = 'absolute';
        clonedBracket.style.left = '-9999px';
        document.body.appendChild(clonedBracket);
        
        try {
          // ✅ FIXED: Pass bracketType
          const bracketImg = await convertElementToImage(clonedBracket, scaleFactor, bracketType);
          
          // ✅ FIXED: Pass pageDims
          await addHeaderAndFooter(doc, config, pageDims);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(THEME.primary);
          doc.text(
            `Halaman ${pageNum + 1} dari ${totalPages}`, 
            pageDims.width - pageDims.marginRight - 30, 
            pageDims.headerHeight + 5, 
            { align: 'right' }
          );

          const contentStartY = pageDims.headerHeight + pageDims.marginTop;
          const contentEndY = pageDims.height - pageDims.footerHeight - pageDims.marginBottom;
          const maxWidth = pageDims.width - pageDims.marginLeft - pageDims.marginRight;
          const maxHeight = contentEndY - contentStartY;

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

          const x = (pageDims.width - displayWidth) / 2;
          const y = pageDims.headerHeight + HEADER_MARGIN_BOTTOM;

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
          
          console.log(`✅ Page ${pageNum + 1} added (matches ${startIdx + 1}-${endIdx})`);
          
        } finally {
          if (document.body.contains(clonedBracket)) {
            document.body.removeChild(clonedBracket);
          }
        }
      }
      
    } else {
      // ✅ SINGLE PAGE (Prestasi atau Pemula < 70 peserta)
      console.log('📄 Single-page export...');
      
      // ✅ FIXED: Pass bracketType
      const bracketImg = await convertElementToImage(bracketElement, scaleFactor, bracketType);
      
      // ✅ FIXED: Pass pageDims
      await addHeaderAndFooter(doc, config, pageDims);

      // Calculate layout
      const contentStartY = pageDims.headerHeight + pageDims.marginTop;
      const contentEndY = pageDims.height - pageDims.footerHeight - pageDims.marginBottom;
      const maxWidth = pageDims.width - pageDims.marginLeft - pageDims.marginRight;
      const maxHeight = contentEndY - contentStartY;

      const imgAspectRatio = bracketImg.width / bracketImg.height;
      let displayWidth = maxWidth;
      let displayHeight = displayWidth / imgAspectRatio;

      const totalPeserta = kelasData?.peserta_kompetisi?.length || 0;

      // ✅ FIXED: Zoom logic with A3 support
      let zoom = customZoom || 1.0; // ✅ Use custom zoom if provided
      
      if (!customZoom) { // Only use auto-zoom if no custom zoom
        if (isPemula) {
          // PEMULA zoom (A4 only)
          if (totalPeserta <= 8) zoom = 1.1;
          else if (totalPeserta <= 16) zoom = 1.05;
          else if (totalPeserta <= 32) zoom = 1;
          else zoom = 0.95;
        } else {
          // ✅ NEW: PRESTASI zoom with A3 support
          if (useA3) {
            // A3 for >32 participants - ✅ ADJUST THIS VALUE
            zoom = 0.82; // ← Kamu bisa ganti sesuai kebutuhan
            console.log(`🔍 Using A3 zoom: ${zoom}`);
          } else {
            // A4 for ≤32 participants
            if (totalPeserta <= 8) zoom = 0.35;
            else if (totalPeserta <= 16) zoom = 0.25;
            else if (totalPeserta <= 32) zoom = 0.15;
          }
        }
      }
      
      console.log(`🔍 Final zoom: ${zoom} (Custom: ${customZoom ? 'YES' : 'NO'})`);

      const HEADER_MARGIN_BOTTOM = 5;
      displayWidth *= zoom;
      displayHeight *= zoom;

      const x = (pageDims.width - displayWidth) / 2;
      const y = pageDims.headerHeight + HEADER_MARGIN_BOTTOM;

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
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${config.eventName.replace(/[^a-z0-9]/gi, '_')}_${config.categoryName.replace(/ /g, '_')}_${dateStr}.pdf`;
    
    doc.save(filename);
    console.log(`✅ PDF saved: ${filename} (Format: ${useA3 ? 'A3' : 'A4'})`);

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
};

// ✅ FIXED: Bulk export dengan A3 support
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
  
  // ✅ FIXED: Dynamic format based on largest bracket
  const maxParticipants = Math.max(...brackets.map(b => 
    b.kelasData.peserta_kompetisi?.filter((p: any) => p.status === 'APPROVED').length || 0
  ));
  const hasPrestasiOver32 = brackets.some(b => 
    !b.isPemula && (b.kelasData.peserta_kompetisi?.filter((p: any) => p.status === 'APPROVED').length || 0) > 32
  );
  
  const useA3 = hasPrestasiOver32;
  const pageDims = useA3 ? PAGE_CONFIGS.A3 : PAGE_CONFIGS.A4;
  
  console.log(`📄 Bulk export format: ${useA3 ? 'A3' : 'A4'}`);
  
  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: useA3 ? 'a3' : 'a4',
    compress: true
  });

  // Group by lapangan
  const bracketsByLapangan = brackets.reduce((acc, bracket) => {
    if (!acc[bracket.lapanganNama]) {
      acc[bracket.lapanganNama] = [];
    }
    acc[bracket.lapanganNama].push(bracket);
    return acc;
  }, {} as Record<string, typeof brackets>);

  let pageIndex = 0;

  for (const [lapanganNama, lapanganBrackets] of Object.entries(bracketsByLapangan)) {
    console.log(`\n📍 Processing Lapangan ${lapanganNama} (${lapanganBrackets.length} brackets)...`);

    for (let i = 0; i < lapanganBrackets.length; i++) {
      const { kelasData, isPemula, tanggal, namaKelas } = lapanganBrackets[i];
      
      console.log(`  📄 Bracket ${i + 1}/${lapanganBrackets.length}: ${namaKelas}`);
      
      if (pageIndex > 0) {
        doc.addPage();
      }
      pageIndex++;

      const tempContainer = document.createElement('div');
      tempContainer.id = `bracket-container-${pageIndex}`;
      document.body.appendChild(tempContainer);

      try {
        // ✅ FIXED: Determine bracket type from data
        const bracketType: 'PRESTASI' | 'PEMULA' = isPemula ? 'PEMULA' : 'PRESTASI';
        
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

          setTimeout(() => {
            reject(new Error('Render timeout'));
          }, 10000);
        });
        
        console.log('  📸 Capturing bracket screenshot...');

        const approvedParticipants = kelasData.peserta_kompetisi?.filter((p: any) => p.status === 'APPROVED') || [];
        const participantCount = approvedParticipants.length;
        const scaleFactor = getScaleFactor(participantCount);

        // Config for PDF header
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

        // ✅ FIXED: Pass bracketType
        const bracketImg = await convertElementToImage(bracketElement, scaleFactor, bracketType);
        
        // ✅ FIXED: Pass pageDims
        await addHeaderAndFooter(doc, config, pageDims);

        // Add Lapangan indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(THEME.primary);
        doc.text(`Lapangan ${lapanganNama}`, pageDims.width - pageDims.marginRight - 25, pageDims.headerHeight + 5, { align: 'right' });

        // Calculate positioning
        const contentStartY = pageDims.headerHeight + pageDims.marginTop;
        const contentEndY = pageDims.height - pageDims.footerHeight - pageDims.marginBottom;
        const maxWidth = pageDims.width - pageDims.marginLeft - pageDims.marginRight;
        const maxHeight = contentEndY - contentStartY;

        const imgAspectRatio = bracketImg.width / bracketImg.height;
        let displayWidth = maxWidth;
        let displayHeight = displayWidth / imgAspectRatio;

        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = displayHeight * imgAspectRatio;
        }

        const centerX = pageDims.marginLeft + (maxWidth / 2);
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

        console.log(`  ✅ Added to PDF`);

      } catch (error) {
        console.error(`  ❌ Error rendering bracket:`, error);
        throw error;
      } finally {
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }
    }
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Brackets_Lapangan_${eventMetadata.namaKejuaraan.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.pdf`;
  
  doc.save(filename);
  console.log(`\n✅ PDF saved: ${filename} (${pageIndex} pages, Format: ${useA3 ? 'A3' : 'A4'})`);
};