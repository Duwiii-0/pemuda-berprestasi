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

// ==================== MAIN EXPORT FUNCTION ====================
export const exportBracketToPDF = async (
  config: ExportConfig,
  bracketElement: HTMLElement, // Pass the bracket DOM element
  leaderboardElement?: HTMLElement // Optional leaderboard element
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
        // Fallback: generate leaderboard manually if no DOM element
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
  // Capture the bracket element as canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: '#F5FBEF'
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 20; // margin
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Calculate how many pages needed
  const pageContentHeight = pageHeight - 20; // margin
  let heightLeft = imgHeight;
  let position = 10; // top margin

  // Add first page
  doc.addPage();
  doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageContentHeight;

  // Add additional pages if content exceeds one page
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
    backgroundColor: '#F5FBEF'
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
      if (index >= 2) return; // Max 2 third place shown
      
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

// ==================== TRANSFORM HELPER (TETAP SAMA) ====================
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