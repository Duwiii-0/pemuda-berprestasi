import jsPDF from 'jspdf';

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

// ==================== CONSTANTS ====================
const PAGE_WIDTH = 297; // A4 Landscape
const PAGE_HEIGHT = 210;
const MARGIN = 15;
const CARD_WIDTH = 55;
const CARD_HEIGHT = 35;
const ROUND_GAP = 25;
const PRIMARY_COLOR = '#990D35';
const SECONDARY_COLOR = '#F5B700';
const BG_LIGHT = '#F5FBEF';

// ==================== HELPER: Add Page Number ====================
const addPageNumber = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 5,
    { align: 'right' }
  );
};

// ==================== HELPER: Draw Rounded Rectangle ====================
const drawRoundedRect = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  borderColor?: string,
  borderWidth: number = 0.5
) => {
  if (fillColor) {
    doc.setFillColor(fillColor);
  }
  if (borderColor) {
    doc.setDrawColor(borderColor);
    doc.setLineWidth(borderWidth);
  }

  // Draw rounded rectangle (jsPDF doesn't have native rounded rect, so we use path)
  doc.roundedRect(x, y, width, height, radius, radius, fillColor ? 'FD' : 'S');
};

// ==================== PAGE 1: COVER PAGE ====================
export const drawCoverPage = (doc: jsPDF, config: ExportConfig) => {
  // Background color
  doc.setFillColor(BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header bar
  doc.setFillColor(PRIMARY_COLOR);
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');

  // Trophy icon (simple representation)
  doc.setFillColor('#FFD700');
  doc.circle(PAGE_WIDTH / 2, 20, 8, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('🏆', PAGE_WIDTH / 2, 23, { align: 'center' });

  // Event name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(config.eventName, PAGE_WIDTH / 2, 55, { align: 'center' });

  // Category
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(config.categoryName, PAGE_WIDTH / 2, 65, { align: 'center' });

  // Info box
  const boxY = 80;
  doc.setFillColor(255, 255, 255);
  drawRoundedRect(doc, MARGIN + 20, boxY, PAGE_WIDTH - (MARGIN * 2) - 40, 70, 3, '#FFFFFF', PRIMARY_COLOR, 1);

  // Info content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');

  const infoX = MARGIN + 35;
  let infoY = boxY + 15;

  doc.text('📍 Location:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(config.location, infoX + 50, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('📅 Date:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(config.dateRange, infoX + 50, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('👥 Participants:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.totalParticipants} Athletes`, infoX + 50, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('🎯 Total Rounds:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.totalRounds} Rounds`, infoX + 50, infoY);

  infoY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('⚔️ Total Matches:', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.matches.length} Matches`, infoX + 50, infoY);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 15,
    { align: 'center' }
  );

  addPageNumber(doc, 1, 0); // Will update total later
};

// ==================== DRAW MATCH CARD ====================
const drawMatchCard = (
  doc: jsPDF,
  x: number,
  y: number,
  match: MatchData,
  matchIndex: number
) => {
  // Card background
  const hasWinner = match.score1 > 0 || match.score2 > 0;
  const borderColor = hasWinner ? '#22c55e' : PRIMARY_COLOR;
  
  drawRoundedRect(doc, x, y, CARD_WIDTH, CARD_HEIGHT, 2, '#FFFFFF', borderColor, 0.8);

  // Header
  doc.setFillColor(PRIMARY_COLOR);
  doc.setDrawColor(PRIMARY_COLOR);
  doc.rect(x, y, CARD_WIDTH, 6, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`M${match.id}`, x + 2, y + 4);

  if (match.nomorPartai) {
    doc.setFillColor(SECONDARY_COLOR);
    doc.roundedRect(x + CARD_WIDTH - 12, y + 1, 10, 4, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(match.nomorPartai, x + CARD_WIDTH - 7, y + 3.5, { align: 'center' });
  }

  // Participants
  const participantY = y + 10;
  const participant2Y = y + 23;

  // Participant 1
  if (match.participant1) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const name1 = match.participant1.name.length > 25 
      ? match.participant1.name.substring(0, 22) + '...' 
      : match.participant1.name;
    doc.text(name1, x + 2, participantY);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246); // Blue
    const dojo1 = match.participant1.dojo.length > 28 
      ? match.participant1.dojo.substring(0, 25) + '...' 
      : match.participant1.dojo;
    doc.text(dojo1, x + 2, participantY + 3);

    // Score 1
    if (hasWinner) {
      const isWinner1 = match.score1 > match.score2;
      doc.setFillColor(isWinner1 ? '#22c55e' : '#e5e7eb');
      doc.roundedRect(x + CARD_WIDTH - 10, participantY - 3, 8, 6, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner1 ? 255 : 100);
      doc.text(match.score1.toString(), x + CARD_WIDTH - 6, participantY + 1, { align: 'center' });
    }
  } else {
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('TBD', x + CARD_WIDTH / 2, participantY, { align: 'center' });
  }

  // Separator line
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(x + 2, y + 18, x + CARD_WIDTH - 2, y + 18);

  // Participant 2
  if (match.participant2) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const name2 = match.participant2.name.length > 25 
      ? match.participant2.name.substring(0, 22) + '...' 
      : match.participant2.name;
    doc.text(name2, x + 2, participant2Y);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68); // Red
    const dojo2 = match.participant2.dojo.length > 28 
      ? match.participant2.dojo.substring(0, 25) + '...' 
      : match.participant2.dojo;
    doc.text(dojo2, x + 2, participant2Y + 3);

    // Score 2
    if (hasWinner) {
      const isWinner2 = match.score2 > match.score1;
      doc.setFillColor(isWinner2 ? '#22c55e' : '#e5e7eb');
      doc.roundedRect(x + CARD_WIDTH - 10, participant2Y - 3, 8, 6, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner2 ? 255 : 100);
      doc.text(match.score2.toString(), x + CARD_WIDTH - 6, participant2Y + 1, { align: 'center' });
    }
  } else {
    if (match.isBye) {
      doc.setFillColor(SECONDARY_COLOR);
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(x + CARD_WIDTH / 2 - 6, participant2Y - 3, 12, 4, 1, 1, 'F');
      doc.text('🎁 BYE', x + CARD_WIDTH / 2, participant2Y - 0.5, { align: 'center' });
    } else {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('⏳ TBD', x + CARD_WIDTH / 2, participant2Y, { align: 'center' });
    }
  }

  // Completed badge
  if (hasWinner) {
    doc.setFillColor(34, 197, 94, 20); // Green transparent
    doc.rect(x, y + CARD_HEIGHT - 4, CARD_WIDTH, 4, 'F');
    doc.setFontSize(6);
    doc.setTextColor(22, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ COMPLETED', x + CARD_WIDTH / 2, y + CARD_HEIGHT - 1.5, { align: 'center' });
  }
};

// ==================== DRAW CONNECTION LINES ====================
const drawConnectionLines = (
  doc: jsPDF,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  doc.setDrawColor(PRIMARY_COLOR);
  doc.setLineWidth(0.5);

  const midX = startX + 5;

  // Horizontal line from card
  doc.line(startX, startY, midX, startY);
  
  // Vertical line
  doc.line(midX, startY, midX, endY);
  
  // Horizontal line to next card
  doc.line(midX, endY, endX, endY);
};

// ==================== CALCULATE VERTICAL POSITION ====================
const calculateVerticalPosition = (
  roundIndex: number,
  matchIndex: number,
  totalMatchesInRound: number,
  baseY: number = 50
): number => {
  const baseSpacing = 40;
  const spacingMultiplier = Math.pow(2, roundIndex);
  const spacing = baseSpacing * spacingMultiplier;

  const totalHeight = (totalMatchesInRound - 1) * spacing;
  const startOffset = -totalHeight / 2;

  return baseY + startOffset + (matchIndex * spacing);
};

// ==================== GET ROUND NAME ====================
const getRoundName = (round: number, totalRounds: number): string => {
  const fromEnd = totalRounds - round;

  switch (fromEnd) {
    case 0:
      return 'FINAL';
    case 1:
      return 'SEMI FINAL';
    case 2:
      return 'QUARTER FINAL';
    case 3:
      return 'ROUND OF 16';
    default:
      return `ROUND ${round}`;
  }
};

// ==================== DRAW BRACKET PAGE ====================
const drawBracketPage = (
  doc: jsPDF,
  matches: MatchData[],
  startRound: number,
  endRound: number,
  totalRounds: number,
  pageNum: number
) => {
  // Background
  doc.setFillColor(BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Title bar
  doc.setFillColor(PRIMARY_COLOR);
  doc.rect(0, 0, PAGE_WIDTH, 12, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOURNAMENT BRACKET', PAGE_WIDTH / 2, 8, { align: 'center' });

  // Round headers
  let headerX = MARGIN;
  const headerY = 20;

  for (let round = startRound; round <= endRound; round++) {
    const roundName = getRoundName(round, totalRounds);
    const roundMatches = matches.filter(m => m.round === round);

    // Header background
    doc.setFillColor(PRIMARY_COLOR);
    drawRoundedRect(doc, headerX, headerY, CARD_WIDTH, 8, 2, PRIMARY_COLOR);

    // Header text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(roundName, headerX + CARD_WIDTH / 2, headerY + 5.5, { align: 'center' });

    // Match count
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(
      `${roundMatches.length} ${roundMatches.length === 1 ? 'Match' : 'Matches'}`,
      headerX + CARD_WIDTH / 2,
      headerY + 11,
      { align: 'center' }
    );

    headerX += CARD_WIDTH + ROUND_GAP;
  }

  // Draw matches and connections
  const baseY = 70; // Center vertical position
  let currentX = MARGIN;

  for (let round = startRound; round <= endRound; round++) {
    const roundMatches = matches.filter(m => m.round === round);
    const roundIndex = round - 1;

    roundMatches.forEach((match, matchIndex) => {
      const y = calculateVerticalPosition(roundIndex, matchIndex, roundMatches.length, baseY);

      // Draw match card
      drawMatchCard(doc, currentX, y, match, matchIndex);

      // Draw connection lines to next round
      if (round < endRound) {
        const nextRoundMatches = matches.filter(m => m.round === round + 1);
        const nextMatchIndex = Math.floor(matchIndex / 2);
        
        if (nextMatchIndex < nextRoundMatches.length) {
          const nextY = calculateVerticalPosition(
            roundIndex + 1,
            nextMatchIndex,
            nextRoundMatches.length,
            baseY
          );

          drawConnectionLines(
            doc,
            currentX + CARD_WIDTH,
            y + CARD_HEIGHT / 2,
            currentX + CARD_WIDTH + ROUND_GAP,
            nextY + CARD_HEIGHT / 2
          );
        }
      }
    });

    currentX += CARD_WIDTH + ROUND_GAP;
  }

  // Page continuation indicator
  if (endRound < totalRounds) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('➡️ Continued on next page...', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  }

  addPageNumber(doc, pageNum, 0);
};

// ==================== DRAW LEADERBOARD PAGE ====================
const drawLeaderboardPage = (
  doc: jsPDF,
  leaderboard: LeaderboardData,
  pageNum: number
) => {
  // Background
  doc.setFillColor(BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header
  doc.setFillColor(PRIMARY_COLOR);
  doc.rect(0, 0, PAGE_WIDTH, 25, 'F');

  // Trophy icon
  doc.setFontSize(20);
  doc.text('🏆', PAGE_WIDTH / 2 - 15, 17);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LEADERBOARD', PAGE_WIDTH / 2, 17, { align: 'center' });

  let currentY = 45;

  // 1st Place - CHAMPION
  if (leaderboard.first) {
    doc.setFillColor('#FFD700');
    doc.setDrawColor('#FFD700');
    drawRoundedRect(doc, MARGIN + 30, currentY, PAGE_WIDTH - (MARGIN * 2) - 60, 35, 3, '#FFF9E6', '#FFD700', 2);

    // Medal
    doc.setFontSize(24);
    doc.text('🥇', MARGIN + 40, currentY + 22);

    // Badge
    doc.setFillColor('#FFD700');
    drawRoundedRect(doc, MARGIN + 60, currentY + 5, 28, 6, 2, '#FFD700');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CHAMPION', MARGIN + 74, currentY + 9, { align: 'center' });

    // Name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(leaderboard.first.name, MARGIN + 60, currentY + 18);

    // Dojo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(leaderboard.first.dojo.toUpperCase(), MARGIN + 60, currentY + 26);

    // Trophy icon right
    doc.setFontSize(20);
    doc.text('🏆', PAGE_WIDTH - MARGIN - 50, currentY + 22);

    currentY += 45;
  }

  // 2nd & 3rd Place
  const podiumY = currentY;
  const podiumWidth = (PAGE_WIDTH - (MARGIN * 2) - 20) / 3;

  // 2nd Place
  if (leaderboard.second) {
    const x2nd = MARGIN;
    doc.setFillColor('#C0C0C0');
    drawRoundedRect(doc, x2nd, podiumY, podiumWidth, 50, 3, '#F5F5F5', '#C0C0C0', 1.5);

    doc.setFontSize(20);
    doc.text('🥈', x2nd + podiumWidth / 2 - 8, podiumY + 18);

    doc.setFillColor('#C0C0C0');
    drawRoundedRect(doc, x2nd + podiumWidth / 2 - 15, podiumY + 22, 30, 5, 2, '#C0C0C0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('2ND PLACE', x2nd + podiumWidth / 2, podiumY + 25.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const name2 = leaderboard.second.name.length > 20 
      ? leaderboard.second.name.substring(0, 17) + '...' 
      : leaderboard.second.name;
    doc.text(name2, x2nd + podiumWidth / 2, podiumY + 35, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const dojo2 = leaderboard.second.dojo.length > 22 
      ? leaderboard.second.dojo.substring(0, 19) + '...' 
      : leaderboard.second.dojo;
    doc.text(dojo2.toUpperCase(), x2nd + podiumWidth / 2, podiumY + 42, { align: 'center' });
  }

  // 3rd Place(s)
  if (leaderboard.third.length > 0) {
    leaderboard.third.forEach((participant, index) => {
      const x3rd = MARGIN + podiumWidth + 10 + (index * (podiumWidth + 10));
      
      doc.setFillColor('#CD7F32');
      drawRoundedRect(doc, x3rd, podiumY, podiumWidth, 50, 3, '#FFF5E6', '#CD7F32', 1.5);

      doc.setFontSize(20);
      doc.text('🥉', x3rd + podiumWidth / 2 - 8, podiumY + 18);

      doc.setFillColor('#CD7F32');
      drawRoundedRect(doc, x3rd + podiumWidth / 2 - 15, podiumY + 22, 30, 5, 2, '#CD7F32');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('3RD PLACE', x3rd + podiumWidth / 2, podiumY + 25.5, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const name3 = participant.name.length > 20 
        ? participant.name.substring(0, 17) + '...' 
        : participant.name;
      doc.text(name3, x3rd + podiumWidth / 2, podiumY + 35, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      const dojo3 = participant.dojo.length > 22 
        ? participant.dojo.substring(0, 19) + '...' 
        : participant.dojo;
      doc.text(dojo3.toUpperCase(), x3rd + podiumWidth / 2, podiumY + 42, { align: 'center' });
    });
  }

  // Empty state
  if (!leaderboard.first && !leaderboard.second && leaderboard.third.length === 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('No Results Yet', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Leaderboard will be available after matches are completed', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 8, { align: 'center' });
  }

  addPageNumber(doc, pageNum, 0);
};

// ==================== MAIN EXPORT FUNCTION ====================
export const exportBracketToPDF = async (config: ExportConfig): Promise<void> => {
  try {
    // Initialize PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    let currentPage = 1;

    // ===== PAGE 1: COVER PAGE =====
    drawCoverPage(doc, config);
    
    // ===== PAGE 2-N: BRACKET PAGES =====
    const totalRounds = config.totalRounds;
    const roundsPerPage = totalRounds <= 3 ? totalRounds : Math.ceil(totalRounds / 2);
    
    let processedRounds = 0;
    
    while (processedRounds < totalRounds) {
      doc.addPage();
      currentPage++;
      
      const startRound = processedRounds + 1;
      const endRound = Math.min(processedRounds + roundsPerPage, totalRounds);
      
      drawBracketPage(
        doc,
        config.matches,
        startRound,
        endRound,
        totalRounds,
        currentPage
      );
      
      processedRounds = endRound;
    }

    // ===== LAST PAGE: LEADERBOARD =====
    if (config.leaderboard) {
      doc.addPage();
      currentPage++;
      drawLeaderboardPage(doc, config.leaderboard, currentPage);
    }

    // Update all page numbers with total
    const totalPages = currentPage;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Re-render page number with correct total
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        PAGE_WIDTH - MARGIN,
        PAGE_HEIGHT - 5,
        { align: 'right' }
      );
    }

    // Generate filename
    const sanitizedEventName = config.eventName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${sanitizedEventName}_${dateStr}.pdf`;

    // Save PDF
    doc.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
};

// ==================== TRANSFORM HELPER ====================
// Helper untuk transform data dari component ke format PDF
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