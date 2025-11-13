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
    '[id$="-leaderboard"]'
  );
  leaderboards.forEach(el => {
    const htmlEl = el as HTMLElement;
    // ✅ HANYA hide jika BENAR-BENAR di luar bracketVisual
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

// Helper: Render React component to DOM element
const renderBracketComponent = async (
  kelasData: any,
  isPemula: boolean,
  containerDiv: HTMLDivElement
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Import React dan ReactDOM
      import('react').then((React) => {
        import('react-dom/client').then((ReactDOM) => {
          // Dynamic import component
          const Component = isPemula 
            ? require('../../components/TournamentBracketPemula').default
            : require('../../components/TournamentBracketPrestasi').default;

          // Render component
          const root = ReactDOM.createRoot(containerDiv);
          root.render(
            React.createElement(Component, {
              kelasData: kelasData,
              apiBaseUrl: import.meta.env.VITE_API_URL || '/api'
            })
          );

          // Wait for render
          setTimeout(() => {
            resolve();
          }, 2000);
        });
      });
    } catch (error) {
      reject(error);
    }
  });
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
    tanggalTanding?: string; 
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

// Hitung total peserta dalam bracket
const totalPeserta = kelasData?.peserta_kompetisi?.length || 0;

// 🔍 DEBUG: Lihat struktur data kelasData
console.log('🔍 DEBUG kelasData:', {
  kelompok: kelasData?.kelompok,
  kelas_berat: kelasData?.kelas_berat,
  poomsae: kelasData?.poomsae,
  kompetisi: kelasData?.kompetisi,
  fullData: kelasData
});

// ✅ Deteksi bracket Prestasi dengan berbagai cara
const isPrestasi = 
  // Cek dari kelompok
  kelasData?.kelompok?.nama_kelompok?.toLowerCase().includes('prestasi') ||
  kelasData?.kelompok?.nama_kelompok?.toLowerCase().includes('poomsae') ||
  // Cek dari kelas_berat
  kelasData?.kelas_berat?.kategori?.toLowerCase().includes('prestasi') ||
  // Cek jika ada data poomsae (berarti prestasi)
  (kelasData?.poomsae !== null && kelasData?.poomsae !== undefined) ||
  // Cek dari kompetisi
  kelasData?.kompetisi?.jenis_kompetisi?.toLowerCase().includes('prestasi') ||
  // Fallback: jika tidak ada kelas_berat tapi ada poomsae
  (!kelasData?.kelas_berat && kelasData?.poomsae);

console.log('✅ isPrestasi:', isPrestasi);

// ✅ ZOOM LOGIC: Hanya zoom in untuk PRESTASI, Pemula diperkecil
let zoom = 1.0;

if (isPrestasi) {
  // Zoom dinamis untuk Pemula (zoom in)
  if (totalPeserta <= 8) zoom = 0.35;
  else if (totalPeserta <= 16) zoom = 0.25;
  else if (totalPeserta <= 32) zoom = 0.15;
  else zoom = 0.10;
  console.log('📏 PRESTASI zoom:', zoom);
} else {
  // ✅ Zoom diperkecil untuk Prestasi (zoom out)
  if (totalPeserta <= 8) zoom = 1.1;
  else if (totalPeserta <= 16) zoom = 1.05;
  else if (totalPeserta <= 32) zoom = 1;
  else zoom = 0.9;
  console.log('📏 PEMULA zoom:', zoom);
}

// Margin bawah header
const HEADER_MARGIN_BOTTOM = 10;

// --- Hitung ulang ukuran gambar ---
displayWidth *= zoom;
displayHeight *= zoom;

// Posisi tengah halaman
const x = (PAGE_WIDTH - displayWidth) / 2;
const y = HEADER_HEIGHT + HEADER_MARGIN_BOTTOM;

// Tambahkan gambar ke PDF
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
  
  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: 'a4',
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

      // ✅ Create container for React component
      const tempContainer = document.createElement('div');
      tempContainer.id = `bracket-container-${pageIndex}`;
      document.body.appendChild(tempContainer);

      try {
        // ✅ Render React component and wait for completion
        const bracketElement = await new Promise<HTMLElement>((resolve, reject) => {
  const root = ReactDOM.createRoot(tempContainer);
  
  const handleRenderComplete = (element: HTMLElement) => {
    console.log('  ✅ Bracket render complete');
    resolve(element);
  };

  // ✅ WRAP dengan BracketExportWrapper
  root.render(
    React.createElement(BracketExportWrapper, null,
      React.createElement(BracketRenderer, {
        kelasData: kelasData,
        isPemula: isPemula,
        onRenderComplete: handleRenderComplete
      })
    )
  );

  // ✅ Timeout diperbesar jadi 15 detik (karena ada banyak context)
  setTimeout(() => {
    reject(new Error('Render timeout'));
  }, 10000); // Dari 10000 jadi 15000
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

        // Capture image
        const bracketImg = await convertElementToImage(bracketElement, scaleFactor);
        
        // Add header
        await addHeaderAndFooter(doc, config);

        // Add Lapangan indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(THEME.primary);
        doc.text(`Lapangan ${lapanganNama}`, PAGE_WIDTH - MARGIN_RIGHT - 25, HEADER_HEIGHT + 5, { align: 'right' });

        // Calculate positioning
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
  const filename = `Brackets_Lapangan_${eventMetadata.namaKejuaraan.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.pdf`;
  
  doc.save(filename);
  console.log(`\n✅ PDF saved: ${filename} (${pageIndex} pages)`);
};

// ✅ Generate simplified bracket HTML
const generateBracketHTML = (bracketData: any, kelasData: any, isPemula: boolean): string => {
  const matches = bracketData.matches || [];
  
  if (matches.length === 0) {
    return `
      <div style="text-align: center; padding: 100px 0;">
        <h2 style="color: #990D35; margin-bottom: 20px;">
          ${isPemula ? 'Bracket Pemula' : 'Bracket Prestasi'}
        </h2>
        <p style="color: #6b7280;">Bracket belum memiliki pertandingan</p>
      </div>
    `;
  }

  // ✅ Group matches by round
  const rounds = matches.reduce((acc: any, match: any) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  const totalRounds = Object.keys(rounds).length;
  
  // ✅ Generate HTML untuk setiap round
  let roundsHTML = '';
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = rounds[round] || [];
    const roundName = getRoundName(round, totalRounds);
    
    let matchesHTML = roundMatches.map((match: any) => {
      const p1Name = match.participant1?.name || 'TBD';
      const p1Dojo = match.participant1?.dojang || '';
      const p2Name = match.participant2?.name || (round === 1 ? 'BYE' : 'TBD');
      const p2Dojo = match.participant2?.dojang || '';
      
      const hasScores = match.scoreA > 0 || match.scoreB > 0;
      const winner = hasScores ? (match.scoreA > match.scoreB ? 'p1' : 'p2') : null;

      // ✅ Format nomor lapangan: {nomor_antrian}{nomor_partai}
      let nomorLapanganDisplay = '';
      if (match.nomorAntrian && match.nomorPartai) {
        nomorLapanganDisplay = `${match.nomorAntrian}${match.nomorPartai}`;
      }

      return `
        <div style="
          border: 2px solid ${winner ? '#22c55e' : '#990D35'};
          border-radius: 12px;
          background: white;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          <!-- Header -->
          <div style="
            background: rgba(153, 13, 53, 0.05);
            padding: 8px 12px;
            border-bottom: 1px solid #990D35;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            ${nomorLapanganDisplay ? `
              <span style="
                background: #990D35;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
              ">No: ${nomorLapanganDisplay}</span>
            ` : '<span></span>'}
            ${match.tanggalPertandingan ? `
              <span style="font-size: 11px; color: #6b7280;">
                ${new Date(match.tanggalPertandingan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </span>
            ` : ''}
          </div>

          <!-- Participant 1 -->
          <div style="
            padding: 12px;
            ${winner === 'p1' ? 'background: linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2));' : ''}
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: bold; font-size: 14px; color: #050505; margin-bottom: 4px;">
                ${p1Name}
              </div>
              <div style="font-size: 11px; color: #3B82F6; opacity: 0.7;">
                ${p1Dojo}
              </div>
            </div>
            ${hasScores ? `
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                background: ${winner === 'p1' ? '#22c55e' : '#e5e7eb'};
                color: ${winner === 'p1' ? 'white' : '#6b7280'};
              ">
                ${match.scoreA}
              </div>
            ` : ''}
          </div>

          <!-- Participant 2 -->
          <div style="
            padding: 12px;
            ${winner === 'p2' ? 'background: linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2));' : ''}
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            ${p2Name === 'BYE' || p2Name === 'TBD' ? `
              <div style="width: 100%; text-align: center;">
                <span style="
                  background: ${p2Name === 'BYE' ? 'rgba(245, 183, 0, 0.15)' : 'rgba(192, 192, 192, 0.15)'};
                  color: ${p2Name === 'BYE' ? '#F5B700' : '#6b7280'};
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 11px;
                  font-weight: 600;
                ">${p2Name}</span>
              </div>
            ` : `
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 14px; color: #050505; margin-bottom: 4px;">
                  ${p2Name}
                </div>
                <div style="font-size: 11px; color: #EF4444; opacity: 0.7;">
                  ${p2Dojo}
                </div>
              </div>
              ${hasScores ? `
                <div style="
                  width: 40px;
                  height: 40px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 16px;
                  background: ${winner === 'p2' ? '#22c55e' : '#e5e7eb'};
                  color: ${winner === 'p2' ? 'white' : '#6b7280'};
                ">
                  ${match.scoreB}
                </div>
              ` : ''}
            `}
          </div>
        </div>
      `;
    }).join('');

    roundsHTML += `
      <div style="margin-right: 40px; min-width: 280px;">
        <div style="
          background: #990D35;
          color: white;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
          font-size: 14px;
        ">
          ${roundName}
          <div style="font-size: 11px; font-weight: normal; margin-top: 4px; opacity: 0.8;">
            ${roundMatches.length} Match${roundMatches.length > 1 ? 'es' : ''}
          </div>
        </div>
        ${matchesHTML}
      </div>
    `;
  }

  return `
    <div style="background: white; padding: 40px; min-height: 600px;">
      <div style="display: flex; gap: 40px; overflow-x: auto;">
        ${roundsHTML}
      </div>
    </div>
  `;
};

// Helper: Get round name
const getRoundName = (round: number, totalRounds: number): string => {
  const fromEnd = totalRounds - round;
  
  switch (fromEnd) {
    case 0: return 'Final';
    case 1: return 'Semi Final';
    case 2: return 'Quarter Final';
    default: return `Round ${round}`;
  }
};