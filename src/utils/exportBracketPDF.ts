import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ==================== TYPES ====================
interface Participant {
  name: string;
  dojo: string;
  id: number;
}

interface MatchData {
  id: number;
  round: number;
  participant1?: Participant;
  participant2?: Participant;
  score1: number;
  score2: number;
  nomorPartai?: string;
  tanggal?: string;
  isBye?: boolean;
}

interface LeaderboardData {
  first: Participant | null;
  second: Participant | null;
  third: Participant[];
}

interface ExportConfig {
  eventName: string;
  categoryName: string;
  location: string;
  dateRange: string;
  totalParticipants: number;
  matches: MatchData[];
  leaderboard: LeaderboardData | null;
  totalRounds: number;
  isPemula?: boolean; // ✅ NEW: Flag untuk layout pemula
}

// ==================== HELPER: Simple Color Fix ====================
const fixColors = (clonedDoc: Document) => {
  const style = clonedDoc.createElement('style');
  style.textContent = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
    }
    
    /* Force simple RGB colors */
    * { color: rgb(5, 5, 5) !important; }
    
    .bg-white, [class*="bg-white"] { background-color: rgb(255, 255, 255) !important; }
    [style*="F5FBEF"] { background-color: rgb(245, 251, 239) !important; }
    [style*="990D35"] { background-color: rgb(153, 13, 53) !important; }
    [style*="22c55e"] { background-color: rgb(34, 197, 94) !important; }
    [style*="e5e7eb"] { background-color: rgb(229, 231, 235) !important; }
    [style*="F5B700"] { background-color: rgb(245, 183, 0) !important; }
    [style*="FFD700"] { background-color: rgb(255, 215, 0) !important; }
    
    [class*="text-white"] { color: rgb(255, 255, 255) !important; }
    [class*="text-blue"] { color: rgb(59, 130, 246) !important; }
    [class*="text-red"] { color: rgb(239, 68, 68) !important; }
    
    [class*="border-red"] { border-color: rgb(153, 13, 53) !important; }
    [class*="border-green"] { border-color: rgb(34, 197, 94) !important; }
    
    /* Remove gradients */
    [class*="gradient"] { 
      background: rgb(240, 253, 244) !important; 
      background-image: none !important;
    }
  `;
  clonedDoc.head.appendChild(style);
};

// ==================== MAIN EXPORT FUNCTION ====================
export const exportBracketToPDF = async (
  config: ExportConfig,
  bracketElement: HTMLElement,
  leaderboardElement?: HTMLElement
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // ===== PAGE 1: COVER PAGE =====
    await addCoverPage(pdf, config);

    // ===== PAGE 2+: BRACKET PAGES =====
    if (bracketElement) {
      if (config.isPemula) {
        // Layout Pemula: Capture per section untuk avoid corruption
        await addPemulaLayout(pdf, bracketElement, pageWidth, pageHeight);
      } else {
        // Layout Prestasi: Capture bracket biasa
        await addPrestasiLayout(pdf, bracketElement, pageWidth, pageHeight);
      }
    }

    // ===== LAST PAGE: LEADERBOARD =====
    if (config.leaderboard && leaderboardElement) {
      pdf.addPage();
      await addSimplePage(pdf, leaderboardElement, pageWidth, pageHeight);
    }

    // Save PDF
    const sanitizedEventName = config.eventName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const layoutType = config.isPemula ? 'Pemula' : 'Prestasi';
    const filename = `Bracket_${layoutType}_${sanitizedEventName}_${dateStr}.pdf`;

    pdf.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
};

// ==================== HELPER: Cover Page ====================
const addCoverPage = async (doc: jsPDF, config: ExportConfig) => {
  const pageWidth = 297;
  const pageHeight = 210;

  // Background
  doc.setFillColor(245, 251, 239);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header bar
  doc.setFillColor(153, 13, 53);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Trophy
  doc.setFillColor(245, 183, 0);
  doc.circle(pageWidth / 2, 22, 10, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth / 2 - 3, 18, 6, 8, 'F');
  doc.rect(pageWidth / 2 - 5, 26, 10, 2, 'F');

  // Event name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(config.eventName, pageWidth / 2, 60, { align: 'center' });

  // Category
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  const categoryLabel = config.isPemula ? 'KATEGORI PEMULA' : 'KATEGORI PRESTASI';
  doc.text(`${categoryLabel} - ${config.categoryName}`, pageWidth / 2, 70, { align: 'center' });

  // Info box
  const boxY = 85;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(153, 13, 53);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 100, boxY, 200, 75, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(5, 5, 5);
  doc.setFont('helvetica', 'bold');

  const infoX = pageWidth / 2 - 80;
  let infoY = boxY + 15;

  doc.text('Location:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(config.location, infoX + 35, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(config.dateRange, infoX + 35, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Participants:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.totalParticipants} Athletes`, infoX + 35, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Matches:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.matches.length} Matches`, infoX + 35, infoY);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
};

// ==================== LAYOUT PEMULA: Capture in sections ====================
const addPemulaLayout = async (
  doc: jsPDF,
  element: HTMLElement,
  pageWidth: number,
  pageHeight: number
) => {
  // Find all match cards in pemula layout
  const matchCards = element.querySelectorAll('[class*="border-2"]');
  
  if (matchCards.length === 0) {
    // Fallback: capture whole element
    await addSimplePage(doc, element, pageWidth, pageHeight);
    return;
  }

  // Capture title first
  const titleElement = element.querySelector('h2');
  if (titleElement) {
    pdf.addPage();
    await addSimplePage(doc, titleElement as HTMLElement, pageWidth, pageHeight, true);
  } else {
    doc.addPage();
  }

  // Capture matches in batches (3 per page)
  const batchSize = 3;
  for (let i = 0; i < matchCards.length; i += batchSize) {
    if (i > 0) doc.addPage();
    
    const batch = Array.from(matchCards).slice(i, i + batchSize);
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.backgroundColor = '#F5FBEF';
    
    batch.forEach(card => {
      const clone = card.cloneNode(true) as HTMLElement;
      clone.style.marginBottom = '15px';
      container.appendChild(clone);
    });
    
    document.body.appendChild(container);
    
    try {
      await addSimplePage(doc, container, pageWidth, pageHeight);
    } finally {
      document.body.removeChild(container);
    }
  }
};

// ==================== LAYOUT PRESTASI: Normal bracket ====================
const addPrestasiLayout = async (
  doc: jsPDF,
  element: HTMLElement,
  pageWidth: number,
  pageHeight: number
) => {
  doc.addPage();
  await addSimplePage(doc, element, pageWidth, pageHeight);
};

// ==================== HELPER: Simple Page Capture ====================
const addSimplePage = async (
  doc: jsPDF,
  element: HTMLElement,
  pageWidth: number,
  pageHeight: number,
  isTitle: boolean = false
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#F5FBEF',
    imageTimeout: 0,
    onclone: (clonedDoc) => {
      fixColors(clonedDoc);
    }
  });

  const imgData = canvas.toDataURL('image/png', 0.95);
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (isTitle) {
    // Center title at top
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 30));
  } else {
    const pageContentHeight = pageHeight - 20;
    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;
    }
  }
};

// ==================== TRANSFORM HELPER ====================
export const transformBracketDataForPDF = (
  kelasData: any,
  matches: any[],
  leaderboard: any,
  isPemula: boolean = false // ✅ NEW parameter
): ExportConfig => {
  const transformedMatches: MatchData[] = matches.map(match => ({
    id: match.id_match,
    round: match.ronde,
    participant1: match.peserta_a ? {
      name: match.peserta_a.is_team
        ? match.peserta_a.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') || 'Team'
        : match.peserta_a.atlet?.nama_atlet || '',
      dojo: match.peserta_a.atlet?.dojang.nama_dojang || '',
      id: match.peserta_a.id_peserta_kompetisi
    } : undefined,
    participant2: match.peserta_b ? {
      name: match.peserta_b.is_team
        ? match.peserta_b.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') || 'Team'
        : match.peserta_b.atlet?.nama_atlet || '',
      dojo: match.peserta_b.atlet?.dojang.nama_dojang || '',
      id: match.peserta_b.id_peserta_kompetisi
    } : undefined,
    score1: match.skor_a || 0,
    score2: match.skor_b || 0,
    nomorPartai: match.nomor_partai,
    tanggal: match.tanggal_pertandingan,
    isBye: !match.peserta_b && match.ronde === 1
  }));

  const categoryName = `${kelasData.kelompok?.nama_kelompok || ''} ${
    kelasData.kelas_berat?.jenis_kelamin === 'LAKI_LAKI' ? 'Male' : 'Female'
  } ${kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas || ''}`.trim();

  const dateRange = `${new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })} - ${new Date(kelasData.kompetisi.tanggal_selesai).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })}`;

  return {
    eventName: kelasData.kompetisi.nama_event,
    categoryName: categoryName,
    location: kelasData.kompetisi.lokasi,
    dateRange: dateRange,
    totalParticipants: kelasData.peserta_kompetisi.filter((p: any) => p.status === 'APPROVED').length,
    matches: transformedMatches,
    leaderboard: leaderboard,
    totalRounds: matches.length > 0 ? Math.max(...matches.map((m: any) => m.ronde)) : 0,
    isPemula: isPemula // ✅ NEW
  };
};