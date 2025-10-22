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
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 15;
const CARD_WIDTH = 65;
const CARD_HEIGHT = 42;
const ROUND_GAP = 30;

// ==================== COLOR HELPERS ====================
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

const PRIMARY = hexToRgb('#990D35');
const SECONDARY = hexToRgb('#F5B700');
const SUCCESS = hexToRgb('#22c55e');
const BG_LIGHT = hexToRgb('#F5FBEF');
const TEXT_PRIMARY = hexToRgb('#050505');
const TEXT_SECONDARY = hexToRgb('#6b7280');

// ==================== HELPER: Add Page Number ====================
const addPageNumber = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 5,
    { align: 'right' }
  );
};

// ==================== PAGE 1: COVER PAGE ====================
export const drawCoverPage = (doc: jsPDF, config: ExportConfig) => {
  // Background
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_WIDTH, 45, 'F');

  // Trophy circle
  doc.setFillColor(245, 183, 0);
  doc.circle(PAGE_WIDTH / 2, 22, 10, 'F');
  
  // Trophy inner
  doc.setFillColor(255, 255, 255);
  doc.rect(PAGE_WIDTH / 2 - 3, 18, 6, 8, 'F');
  doc.rect(PAGE_WIDTH / 2 - 5, 26, 10, 2, 'F');

  // Event name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(config.eventName, PAGE_WIDTH / 2, 60, { align: 'center' });

  // Category
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(config.categoryName, PAGE_WIDTH / 2, 70, { align: 'center' });

  // Info box
  const boxY = 85;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN + 20, boxY, PAGE_WIDTH - (MARGIN * 2) - 40, 75, 3, 3, 'FD');

  // Info content
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFont('helvetica', 'bold');

  const infoX = MARGIN + 35;
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
  doc.setTextColor(...TEXT_SECONDARY);
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
};

// ==================== DRAW MATCH CARD ====================
const drawMatchCard = (
  doc: jsPDF,
  x: number,
  y: number,
  match: MatchData,
  matchIndex: number
) => {
  const hasWinner = match.score1 > 0 || match.score2 > 0;
  const borderColor = hasWinner ? SUCCESS : PRIMARY;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, 2, 2, 'FD');

  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(x, y, CARD_WIDTH, 7, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Match ${match.id}`, x + 2.5, y + 4.5);

  // Nomor partai badge
  if (match.nomorPartai) {
    doc.setFillColor(...SECONDARY);
    doc.roundedRect(x + CARD_WIDTH - 14, y + 1.5, 12, 4, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(match.nomorPartai, x + CARD_WIDTH - 8, y + 4, { align: 'center' });
  }

  const participant1Y = y + 14;
  const participant2Y = y + 29;

  // Participant 1
  if (match.participant1) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    
    const name1 = match.participant1.name.length > 30 
      ? match.participant1.name.substring(0, 27) + '...' 
      : match.participant1.name;
    doc.text(name1, x + 2.5, participant1Y);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246);
    const dojo1 = match.participant1.dojo.length > 32 
      ? match.participant1.dojo.substring(0, 29) + '...' 
      : match.participant1.dojo;
    doc.text(dojo1, x + 2.5, participant1Y + 3.5);

    // Score 1
    if (hasWinner) {
      const isWinner1 = match.score1 > match.score2;
      doc.setFillColor(...(isWinner1 ? SUCCESS : [229, 231, 235]));
      doc.roundedRect(x + CARD_WIDTH - 12, participant1Y - 4, 10, 7, 1.5, 1.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner1 ? 255 : 100, isWinner1 ? 255 : 100, isWinner1 ? 255 : 100);
      doc.text(match.score1.toString(), x + CARD_WIDTH - 7, participant1Y + 1, { align: 'center' });
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('TBD', x + CARD_WIDTH / 2, participant1Y, { align: 'center' });
  }

  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(x + 2.5, y + 21, x + CARD_WIDTH - 2.5, y + 21);

  // Participant 2
  if (match.participant2) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    
    const name2 = match.participant2.name.length > 30 
      ? match.participant2.name.substring(0, 27) + '...' 
      : match.participant2.name;
    doc.text(name2, x + 2.5, participant2Y);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68);
    const dojo2 = match.participant2.dojo.length > 32 
      ? match.participant2.dojo.substring(0, 29) + '...' 
      : match.participant2.dojo;
    doc.text(dojo2, x + 2.5, participant2Y + 3.5);

    // Score 2
    if (hasWinner) {
      const isWinner2 = match.score2 > match.score1;
      doc.setFillColor(...(isWinner2 ? SUCCESS : [229, 231, 235]));
      doc.roundedRect(x + CARD_WIDTH - 12, participant2Y - 4, 10, 7, 1.5, 1.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner2 ? 255 : 100, isWinner2 ? 255 : 100, isWinner2 ? 255 : 100);
      doc.text(match.score2.toString(), x + CARD_WIDTH - 7, participant2Y + 1, { align: 'center' });
    }
  } else {
    if (match.isBye) {
      doc.setFillColor(...SECONDARY);
      doc.roundedRect(x + CARD_WIDTH / 2 - 8, participant2Y - 3.5, 16, 5, 1.5, 1.5, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('BYE', x + CARD_WIDTH / 2, participant2Y - 0.5, { align: 'center' });
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text('TBD', x + CARD_WIDTH / 2, participant2Y, { align: 'center' });
    }
  }

  // Completed badge
  if (hasWinner) {
    doc.setFillColor(34, 197, 94, 30);
    doc.rect(x, y + CARD_HEIGHT - 5, CARD_WIDTH, 5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...SUCCESS);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLETED', x + CARD_WIDTH / 2, y + CARD_HEIGHT - 2, { align: 'center' });
  }
};

// ==================== DRAW CONNECTION LINES (IMPROVED) ====================
const drawConnectionLines = (
  doc: jsPDF,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);

  // Horizontal extension from card
  const midX = startX + 8;

  // Line from card
  doc.line(startX, startY, midX, startY);
  
  // Vertical line (if needed)
  if (Math.abs(startY - endY) > 0.5) {
    doc.line(midX, startY, midX, endY);
  }
  
  // Line to next card
  doc.line(midX, endY, endX, endY);
};

// ==================== CALCULATE GRID POSITION (NEW - GRID BASED) ====================
const calculateGridPosition = (
  matchIndex: number,
  totalMatchesInRound: number,
  baseY: number = 40
): number => {
  // Simple grid: each match has fixed spacing
  const MATCH_SPACING = 48; // Gap between matches (top to bottom)
  return baseY + (matchIndex * MATCH_SPACING);
};

// ==================== GET ROUND NAME ====================
const getRoundName = (round: number, totalRounds: number): string => {
  const fromEnd = totalRounds - round;
  switch (fromEnd) {
    case 0: return 'FINAL';
    case 1: return 'SEMI FINAL';
    case 2: return 'QUARTER FINAL';
    case 3: return 'ROUND OF 16';
    default: return `ROUND ${round}`;
  }
};

// ==================== DRAW BRACKET PAGE (COMPLETELY REWRITTEN) ====================
const drawBracketPage = (
  doc: jsPDF,
  matches: MatchData[],
  startRound: number,
  endRound: number,
  totalRounds: number,
  pageNum: number,
  totalPages: number
) => {
  // Background
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Title bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_WIDTH, 12, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOURNAMENT BRACKET', PAGE_WIDTH / 2, 8, { align: 'center' });

  // Calculate max matches in any round for this page
  let maxMatchesInPage = 0;
  for (let round = startRound; round <= endRound; round++) {
    const roundMatches = matches.filter(m => m.round === round);
    maxMatchesInPage = Math.max(maxMatchesInPage, roundMatches.length);
  }

  // Adjust ROUND_GAP dynamically based on number of rounds on page
  const roundsOnPage = endRound - startRound + 1;
  const ADJUSTED_ROUND_GAP = roundsOnPage >= 3 ? 22 : 28;

  // Round headers
  let headerX = MARGIN;
  const headerY = 18;

  for (let round = startRound; round <= endRound; round++) {
    const roundName = getRoundName(round, totalRounds);
    const roundMatches = matches.filter(m => m.round === round);

    // Header background
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(headerX, headerY, CARD_WIDTH, 8, 2, 2, 'F');

    // Header text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(roundName, headerX + CARD_WIDTH / 2, headerY + 5.5, { align: 'center' });

    // Match count
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${roundMatches.length} ${roundMatches.length === 1 ? 'Match' : 'Matches'}`,
      headerX + CARD_WIDTH / 2,
      headerY + 11,
      { align: 'center' }
    );

    headerX += CARD_WIDTH + ADJUSTED_ROUND_GAP;
  }

  // Draw matches in grid layout
  const baseY = 32; // Starting Y position for cards
  let currentX = MARGIN;

  // Store card positions for connection lines
  const cardPositions: Map<number, { x: number; y: number; round: number }> = new Map();

  for (let round = startRound; round <= endRound; round++) {
    const roundMatches = matches.filter(m => m.round === round);

    roundMatches.forEach((match, matchIndex) => {
      // Grid position: simple top-to-bottom layout
      const y = calculateGridPosition(matchIndex, roundMatches.length, baseY);

      // Store position for this match
      cardPositions.set(match.id, { x: currentX, y: y, round: round });

      // Draw match card
      drawMatchCard(doc, currentX, y, match, matchIndex);
    });

    currentX += CARD_WIDTH + ADJUSTED_ROUND_GAP;
  }

  // Draw connection lines AFTER all cards are drawn
  for (let round = startRound; round < endRound; round++) {
    const roundMatches = matches.filter(m => m.round === round);

    roundMatches.forEach((match, matchIndex) => {
      const currentPos = cardPositions.get(match.id);
      if (!currentPos) return;

      // Find next round match (every 2 matches connect to 1 match in next round)
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const nextRoundMatches = matches.filter(m => m.round === round + 1);
      
      if (nextMatchIndex < nextRoundMatches.length) {
        const nextMatch = nextRoundMatches[nextMatchIndex];
        const nextPos = cardPositions.get(nextMatch.id);

        if (nextPos) {
          // Calculate connection points
          const startX = currentPos.x + CARD_WIDTH;
          const startY = currentPos.y + (CARD_HEIGHT / 2);
          const endX = nextPos.x;
          const endY = nextPos.y + (CARD_HEIGHT / 2);

          // Draw connection with better logic
          drawConnectionLines(doc, startX, startY, endX, endY);
        }
      }
    });
  }

  // Page continuation indicator
  if (endRound < totalRounds) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PRIMARY);
    doc.text('>> Continued on next page', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  }

  addPageNumber(doc, pageNum, totalPages);
};

// ==================== DRAW LEADERBOARD PAGE ====================
const drawLeaderboardPage = (
  doc: jsPDF,
  leaderboard: LeaderboardData,
  pageNum: number,
  totalPages: number
) => {
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_WIDTH, 28, 'F');

  doc.setFillColor(245, 183, 0);
  doc.circle(PAGE_WIDTH / 2 - 20, 14, 6, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(PAGE_WIDTH / 2 - 22, 11, 4, 6, 'F');
  doc.rect(PAGE_WIDTH / 2 - 24, 17, 8, 1.5, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LEADERBOARD', PAGE_WIDTH / 2, 18, { align: 'center' });

  let currentY = 48;

  // 1st Place
  if (leaderboard.first) {
    doc.setFillColor(255, 249, 230);
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(2);
    doc.roundedRect(MARGIN + 30, currentY, PAGE_WIDTH - (MARGIN * 2) - 60, 38, 3, 3, 'FD');

    doc.setFillColor(255, 215, 0);
    doc.circle(MARGIN + 45, currentY + 19, 9, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('1', MARGIN + 45, currentY + 22, { align: 'center' });

    doc.setFillColor(255, 215, 0);
    doc.roundedRect(MARGIN + 65, currentY + 6, 32, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CHAMPION', MARGIN + 81, currentY + 10.5, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    const name1 = leaderboard.first.name.length > 40 
      ? leaderboard.first.name.substring(0, 37) + '...' 
      : leaderboard.first.name;
    doc.text(name1, MARGIN + 65, currentY + 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    const dojo1 = leaderboard.first.dojo.length > 45 
      ? leaderboard.first.dojo.substring(0, 42) + '...' 
      : leaderboard.first.dojo;
    doc.text(dojo1.toUpperCase(), MARGIN + 65, currentY + 29);

    doc.setFillColor(255, 215, 0);
    doc.circle(PAGE_WIDTH - MARGIN - 45, currentY + 19, 7, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(PAGE_WIDTH - MARGIN - 47, currentY + 16, 4, 5, 'F');

    currentY += 48;
  }

  const podiumY = currentY;
  const podiumWidth = (PAGE_WIDTH - (MARGIN * 2) - 20) / 3;

  // 2nd Place
  if (leaderboard.second) {
    const x2nd = MARGIN;
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(192, 192, 192);
    doc.setLineWidth(1.5);
    doc.roundedRect(x2nd, podiumY, podiumWidth, 55, 3, 3, 'FD');

    doc.setFillColor(192, 192, 192);
    doc.circle(x2nd + podiumWidth / 2, podiumY + 15, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('2', x2nd + podiumWidth / 2, podiumY + 18, { align: 'center' });

    doc.setFillColor(192, 192, 192);
    doc.roundedRect(x2nd + podiumWidth / 2 - 16, podiumY + 24, 32, 6, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('2ND PLACE', x2nd + podiumWidth / 2, podiumY + 28, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    const name2 = leaderboard.second.name.length > 22 
      ? leaderboard.second.name.substring(0, 19) + '...' 
      : leaderboard.second.name;
    doc.text(name2, x2nd + podiumWidth / 2, podiumY + 38, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    const dojo2 = leaderboard.second.dojo.length > 24 
      ? leaderboard.second.dojo.substring(0, 21) + '...' 
      : leaderboard.second.dojo;
    doc.text(dojo2.toUpperCase(), x2nd + podiumWidth / 2, podiumY + 46, { align: 'center' });
  }

  // 3rd Place(s)
  if (leaderboard.third.length > 0) {
    leaderboard.third.forEach((participant, index) => {
      const x3rd = MARGIN + podiumWidth + 10 + (index * (podiumWidth + 10));
      
      doc.setFillColor(255, 245, 230);
      doc.setDrawColor(205, 127, 50);
      doc.setLineWidth(1.5);
      doc.roundedRect(x3rd, podiumY, podiumWidth, 55, 3, 3, 'FD');

      doc.setFillColor(205, 127, 50);
      doc.circle(x3rd + podiumWidth / 2, podiumY + 15, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('3', x3rd + podiumWidth / 2, podiumY + 18, { align: 'center' });

      doc.setFillColor(205, 127, 50);
      doc.roundedRect(x3rd + podiumWidth / 2 - 16, podiumY + 24, 32, 6, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('3RD PLACE', x3rd + podiumWidth / 2, podiumY + 28, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_PRIMARY);
      const name3 = participant.name.length > 22 
        ? participant.name.substring(0, 19) + '...' 
        : participant.name;
      doc.text(name3, x3rd + podiumWidth / 2, podiumY + 38, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_SECONDARY);
      const dojo3 = participant.dojo.length > 24 
        ? participant.dojo.substring(0, 21) + '...' 
        : participant.dojo;
      doc.text(dojo3.toUpperCase(), x3rd + podiumWidth / 2, podiumY + 46, { align: 'center' });
    });
  }

  // Empty state
  if (!leaderboard.first && !leaderboard.second && leaderboard.third.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(1);
    doc.roundedRect(MARGIN + 50, PAGE_HEIGHT / 2 - 20, PAGE_WIDTH - (MARGIN * 2) - 100, 40, 3, 3, 'FD');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('No Results Yet', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('Leaderboard will be available after matches are completed', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 5, { align: 'center' });
  }

  addPageNumber(doc, pageNum, totalPages);
};

// ==================== MAIN EXPORT FUNCTION ====================
export const exportBracketToPDF = async (config: ExportConfig): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const totalRounds = config.totalRounds;

    // ===== SMART PAGE CALCULATION =====
    // Calculate pages based on content height, not fixed rounds
    const MAX_CARDS_PER_PAGE = 3.5; // Maximum cards that fit vertically (with spacing)
    const MATCH_HEIGHT_WITH_GAP = 48; // 42mm card + 6mm gap
    
    const roundsData = [];
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = config.matches.filter(m => m.round === round);
      roundsData.push({
        round: round,
        matchCount: roundMatches.length
      });
    }

    // Group rounds into pages based on max matches per page
    const pages: Array<{ startRound: number; endRound: number }> = [];
    let currentPageRounds: number[] = [];
    let currentPageMaxMatches = 0;

    roundsData.forEach(({ round, matchCount }) => {
      const newMaxMatches = Math.max(currentPageMaxMatches, matchCount);
      
      // If adding this round would exceed page capacity, start new page
      if (newMaxMatches > MAX_CARDS_PER_PAGE && currentPageRounds.length > 0) {
        pages.push({
          startRound: currentPageRounds[0],
          endRound: currentPageRounds[currentPageRounds.length - 1]
        });
        currentPageRounds = [round];
        currentPageMaxMatches = matchCount;
      } else {
        currentPageRounds.push(round);
        currentPageMaxMatches = newMaxMatches;
      }
    });

    // Add last page
    if (currentPageRounds.length > 0) {
      pages.push({
        startRound: currentPageRounds[0],
        endRound: currentPageRounds[currentPageRounds.length - 1]
      });
    }

    const totalPages = 1 + pages.length + (config.leaderboard ? 1 : 0);
    let currentPage = 1;

    // ===== PAGE 1: COVER PAGE =====
    drawCoverPage(doc, config);
    addPageNumber(doc, currentPage, totalPages);
    
    // ===== PAGE 2-N: BRACKET PAGES (DYNAMIC) =====
    pages.forEach((pageData) => {
      doc.addPage();
      currentPage++;
      
      drawBracketPage(
        doc,
        config.matches,
        pageData.startRound,
        pageData.endRound,
        totalRounds,
        currentPage,
        totalPages
      );
    });

    // ===== LAST PAGE: LEADERBOARD =====
    if (config.leaderboard) {
      doc.addPage();
      currentPage++;
      drawLeaderboardPage(doc, config.leaderboard, currentPage, totalPages);
    }

    const sanitizedEventName = config.eventName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bracket_${sanitizedEventName}_${dateStr}.pdf`;

    doc.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
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