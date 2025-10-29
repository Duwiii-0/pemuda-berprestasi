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
}

// ==================== HELPER: Convert oklab/oklch to RGB ====================
const convertModernColorsToRGB = (clonedDoc: Document) => {
  // Create style element to force RGB colors
  const style = clonedDoc.createElement('style');
  style.textContent = `
    * {
      color: rgb(5, 5, 5) !important;
    }
    
    /* Preserve specific backgrounds */
    body,
    [style*="backgroundColor"][style*="F5FBEF"],
    [style*="background-color: rgb(245, 251, 239)"] { 
      background-color: rgb(245, 251, 239) !important; 
    }
    
    .bg-white,
    [class*="bg-white"] { 
      background-color: rgb(255, 255, 255) !important; 
    }
    
    [style*="backgroundColor: '#990D35'"],
    [style*="990D35"] { 
      background-color: rgb(153, 13, 53) !important; 
    }
    
    [style*="backgroundColor: '#22c55e'"],
    [style*="22c55e"] { 
      background-color: rgb(34, 197, 94) !important; 
    }
    
    [style*="backgroundColor: '#e5e7eb'"],
    [style*="e5e7eb"] { 
      background-color: rgb(229, 231, 235) !important; 
    }
    
    [style*="rgba(245, 183, 0, 0.15)"],
    [style*="F5B700"] { 
      background-color: rgb(255, 249, 230) !important; 
    }
    
    [style*="rgba(153, 13, 53, 0.05)"] { 
      background-color: rgb(253, 242, 245) !important; 
    }
    
    /* Preserve text colors */
    [style*="color: '#050505'"] { color: rgb(5, 5, 5) !important; }
    [style*="color: '#990D35'"] { color: rgb(153, 13, 53) !important; }
    [style*="color: '#3B82F6'"] { color: rgb(59, 130, 246) !important; }
    [style*="color: '#EF4444'"] { color: rgb(239, 68, 68) !important; }
    [style*="color: '#F5B700'"] { color: rgb(245, 183, 0) !important; }
    [style*="color: 'white'"],
    [style*="color: white"],
    [style*="color: rgb(255, 255, 255)"] { 
      color: rgb(255, 255, 255) !important; 
    }
    
    /* Border colors */
    [style*="borderColor: '#990D35'"],
    [style*="border-color"][style*="990D35"] { 
      border-color: rgb(153, 13, 53) !important; 
    }
    
    [style*="borderColor: '#22c55e'"] { 
      border-color: rgb(34, 197, 94) !important; 
    }
    
    /* Gradients */
    .bg-gradient-to-r,
    [class*="bg-gradient"] { 
      background: linear-gradient(to right, rgb(240, 253, 244), rgb(220, 252, 231)) !important; 
    }
    
    /* Trophy and medal colors */
    [style*="backgroundColor: '#FFD700'"],
    [style*="FFD700"] { 
      background-color: rgb(255, 215, 0) !important; 
    }
    
    [style*="backgroundColor: '#C0C0C0'"],
    [style*="C0C0C0"] { 
      background-color: rgb(192, 192, 192) !important; 
    }
    
    [style*="backgroundColor: '#CD7F32'"],
    [style*="CD7F32"] { 
      background-color: rgb(205, 127, 50) !important; 
    }
    
    /* Remove any oklch/oklab */
    *:not(svg):not(path):not(line):not(g):not(circle):not(rect) {
      background-image: none !important;
    }
  `;
  clonedDoc.head.appendChild(style);
  
  // Force recompute all computed styles
  const allElements = clonedDoc.body.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i] as HTMLElement;
    
    // Skip SVG elements
    if (el.tagName.toLowerCase() === 'svg' || 
        el.tagName.toLowerCase() === 'path' || 
        el.tagName.toLowerCase() === 'line' ||
        el.tagName.toLowerCase() === 'g' ||
        el.tagName.toLowerCase() === 'circle' ||
        el.tagName.toLowerCase() === 'rect') {
      continue;
    }
    
    try {
      const computed = window.getComputedStyle(el);
      
      // Force RGB conversion for inline styles
      if (el.style.color && (el.style.color.includes('oklab') || el.style.color.includes('oklch'))) {
        el.style.color = computed.color;
      }
      if (el.style.backgroundColor && (el.style.backgroundColor.includes('oklab') || el.style.backgroundColor.includes('oklch'))) {
        el.style.backgroundColor = computed.backgroundColor;
      }
      if (el.style.borderColor && (el.style.borderColor.includes('oklab') || el.style.borderColor.includes('oklch'))) {
        el.style.borderColor = computed.borderColor;
      }
      
      // Handle border shorthand
      if (el.style.border && (el.style.border.includes('oklab') || el.style.border.includes('oklch'))) {
        el.style.border = `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`;
      }
    } catch (e) {
      // Ignore errors for elements without computed styles
      console.warn('Could not process element:', el.tagName, e);
    }
  }
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
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // ===== PAGE 1: COVER PAGE =====
    await addCoverPage(pdf, config);

    // ===== PAGE 2+: BRACKET PAGES (from DOM) =====
    if (bracketElement) {
      await addBracketPages(pdf, bracketElement, pageWidth, pageHeight);
    }

    // ===== LAST PAGE: LEADERBOARD (from DOM or generated) =====
    if (config.leaderboard) {
      pdf.addPage();
      if (leaderboardElement) {
        await addDOMPage(pdf, leaderboardElement, pageWidth, pageHeight);
      } else {
        await addGeneratedLeaderboard(pdf, config.leaderboard, config.eventName);
      }
    }

    // Save PDF
    const sanitizedEventName = config.eventName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${sanitizedEventName}_${dateStr}.pdf`;

    pdf.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
};

// ==================== HELPER: Add Cover Page ====================
const addCoverPage = async (doc: jsPDF, config: ExportConfig) => {
  const pageWidth = 297;
  const pageHeight = 210;

  // Background
  doc.setFillColor(245, 251, 239);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header bar
  doc.setFillColor(153, 13, 53);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Trophy circle
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
  doc.text(config.categoryName, pageWidth / 2, 70, { align: 'center' });

  // Info box
  const boxY = 85;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(153, 13, 53);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 100, boxY, 200, 75, 3, 3, 'FD');

  // Info content
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
  doc.text('Total Rounds:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.totalRounds} Rounds`, infoX + 35, infoY);

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

// ==================== HELPER: Add Bracket Pages from DOM ====================
const addBracketPages = async (
  doc: jsPDF,
  element: HTMLElement,
  pageWidth: number,
  pageHeight: number
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#F5FBEF',
    onclone: (clonedDoc) => {
      convertModernColorsToRGB(clonedDoc);
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pageContentHeight = pageHeight - 20;
  let heightLeft = imgHeight;
  let position = 10;

  doc.addPage();
  doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageContentHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    doc.addPage();
    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;
  }
};

// ==================== HELPER: Add DOM Element as PDF Page ====================
const addDOMPage = async (
  doc: jsPDF,
  element: HTMLElement,
  pageWidth: number,
  pageHeight: number
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#F5FBEF',
    onclone: (clonedDoc) => {
      convertModernColorsToRGB(clonedDoc);
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  doc.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
};

// ==================== HELPER: Generated Leaderboard (Fallback) ====================
const addGeneratedLeaderboard = async (
  doc: jsPDF,
  leaderboard: LeaderboardData,
  eventName: string
) => {
  const pageWidth = 297;
  const pageHeight = 210;

  doc.setFillColor(245, 251, 239);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(153, 13, 53);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LEADERBOARD', pageWidth / 2, 18, { align: 'center' });

  let currentY = 48;

  // 1st Place
  if (leaderboard.first) {
    doc.setFillColor(255, 249, 230);
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(2);
    doc.roundedRect(50, currentY, pageWidth - 100, 35, 3, 3, 'FD');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`🥇 ${leaderboard.first.name}`, pageWidth / 2, currentY + 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(leaderboard.first.dojo, pageWidth / 2, currentY + 25, { align: 'center' });

    currentY += 45;
  }

  // 2nd & 3rd Place side by side
  const podiumWidth = 120;
  let podiumX = 30;

  if (leaderboard.second) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(podiumX, currentY, podiumWidth, 40, 3, 3, 'FD');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`🥈 ${leaderboard.second.name}`, podiumX + podiumWidth / 2, currentY + 18, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(leaderboard.second.dojo, podiumX + podiumWidth / 2, currentY + 28, { align: 'center' });
  }

  podiumX += podiumWidth + 17;

  if (leaderboard.third.length > 0) {
    leaderboard.third.forEach((participant, index) => {
      if (index >= 2) return;
      
      doc.setFillColor(255, 245, 230);
      doc.roundedRect(podiumX, currentY, podiumWidth, 40, 3, 3, 'FD');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`🥉 ${participant.name}`, podiumX + podiumWidth / 2, currentY + 18, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(participant.dojo, podiumX + podiumWidth / 2, currentY + 28, { align: 'center' });

      podiumX += podiumWidth + 17;
    });
  }
};

// ==================== TRANSFORM HELPER ====================
export const transformBracketDataForPDF = (
  kelasData: any,
  matches: any[],
  leaderboard: any
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
    totalRounds: matches.length > 0 ? Math.max(...matches.map((m: any) => m.ronde)) : 0
  };
};