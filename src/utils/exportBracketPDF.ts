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
const CARD_WIDTH = 65; // Diperbesar dari 55
const CARD_HEIGHT = 42; // Diperbesar dari 35
const ROUND_GAP = 30; // Diperbesar dari 25
const PRIMARY_COLOR = [153, 13, 53]; // RGB array untuk jsPDF
const SECONDARY_COLOR = [245, 183, 0];
const SUCCESS_COLOR = [34, 197, 94];
const BG_LIGHT = [245, 251, 239];
const TEXT_PRIMARY = [5, 5, 5];
const TEXT_SECONDARY = [107, 114, 128];

  // ==================== HELPER: Add Page Number (FIXED) ====================
const addPageNumber = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
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

// ==================== PAGE 1: COVER PAGE (CLEAN) ====================
export const drawCoverPage = (doc: jsPDF, config: ExportConfig) => {
  // Background
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header bar
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, PAGE_WIDTH, 45, 'F');

  // Trophy circle (simple design)
  doc.setFillColor(245, 183, 0); // Gold
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
  doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN + 20, boxY, PAGE_WIDTH - (MARGIN * 2) - 40, 75, 3, 3, 'FD');

  // Info content (clean, no emoji)
  doc.setFontSize(11);
  doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
  doc.setFont('helvetica', 'bold');

  const infoX = MARGIN + 35;
  let infoY = boxY + 15;

  // Location
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
  doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
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

// ==================== DRAW MATCH CARD (CLEAN & BIGGER) ====================
const drawMatchCard = (
  doc: jsPDF,
  x: number,
  y: number,
  match: MatchData,
  matchIndex: number
) => {
  // Card background
  const hasWinner = match.score1 > 0 || match.score2 > 0;
  const borderColor = hasWinner ? SUCCESS_COLOR : PRIMARY_COLOR;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, 2, 2, 'FD');

  // Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(x, y, CARD_WIDTH, 7, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Match ${match.id}`, x + 2.5, y + 4.5);

  // Nomor partai badge
  if (match.nomorPartai) {
    doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
    doc.roundedRect(x + CARD_WIDTH - 14, y + 1.5, 12, 4, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(match.nomorPartai, x + CARD_WIDTH - 8, y + 4, { align: 'center' });
  }

  // Participants
  const participant1Y = y + 14;
  const participant2Y = y + 29;

  // Participant 1
  if (match.participant1) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    
    const name1 = match.participant1.name.length > 30 
      ? match.participant1.name.substring(0, 27) + '...' 
      : match.participant1.name;
    doc.text(name1, x + 2.5, participant1Y);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246); // Blue
    const dojo1 = match.participant1.dojo.length > 32 
      ? match.participant1.dojo.substring(0, 29) + '...' 
      : match.participant1.dojo;
    doc.text(dojo1, x + 2.5, participant1Y + 3.5);

    // Score 1
    if (hasWinner) {
      const isWinner1 = match.score1 > match.score2;
      const scoreColor = isWinner1 ? SUCCESS_COLOR : [229, 231, 235];
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.roundedRect(x + CARD_WIDTH - 12, participant1Y - 4, 10, 7, 1.5, 1.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner1 ? 255 : 100, isWinner1 ? 255 : 100, isWinner1 ? 255 : 100);
      doc.text(match.score1.toString(), x + CARD_WIDTH - 7, participant1Y + 1, { align: 'center' });
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
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
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    
    const name2 = match.participant2.name.length > 30 
      ? match.participant2.name.substring(0, 27) + '...' 
      : match.participant2.name;
    doc.text(name2, x + 2.5, participant2Y);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68); // Red
    const dojo2 = match.participant2.dojo.length > 32 
      ? match.participant2.dojo.substring(0, 29) + '...' 
      : match.participant2.dojo;
    doc.text(dojo2, x + 2.5, participant2Y + 3.5);

    // Score 2
    if (hasWinner) {
      const isWinner2 = match.score2 > match.score1;
      const scoreColor = isWinner2 ? SUCCESS_COLOR : [229, 231, 235];
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.roundedRect(x + CARD_WIDTH - 12, participant2Y - 4, 10, 7, 1.5, 1.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isWinner2 ? 255 : 100, isWinner2 ? 255 : 100, isWinner2 ? 255 : 100);
      doc.text(match.score2.toString(), x + CARD_WIDTH - 7, participant2Y + 1, { align: 'center' });
    }
  } else {
    if (match.isBye) {
      // BYE - Clean style
      doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
      doc.roundedRect(x + CARD_WIDTH / 2 - 8, participant2Y - 3.5, 16, 5, 1.5, 1.5, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('BYE', x + CARD_WIDTH / 2, participant2Y - 0.5, { align: 'center' });
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
      doc.text('TBD', x + CARD_WIDTH / 2, participant2Y, { align: 'center' });
    }
  }

  // Completed badge
  if (hasWinner) {
    doc.setFillColor(34, 197, 94, 30); // Green light
    doc.rect(x, y + CARD_HEIGHT - 5, CARD_WIDTH, 5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(SUCCESS_COLOR[0], SUCCESS_COLOR[1], SUCCESS_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLETED', x + CARD_WIDTH / 2, y + CARD_HEIGHT - 2, { align: 'center' });
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
  pageNum: number,
  totalPages: number
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
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('>> Continued on next page', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  }

  addPageNumber(doc, pageNum, totalPages); // FIXED: sekarang pass totalPages
};

// ==================== DRAW LEADERBOARD PAGE (CLEAN) ====================
const drawLeaderboardPage = (
  doc: jsPDF,
  leaderboard: LeaderboardData,
  pageNum: number,
  totalPages: number
) => {
  // Background
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, PAGE_WIDTH, 28, 'F');

  // Trophy icon (simple geometric)
  doc.setFillColor(245, 183, 0); // Gold
  doc.circle(PAGE_WIDTH / 2 - 20, 14, 6, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(PAGE_WIDTH / 2 - 22, 11, 4, 6, 'F');
  doc.rect(PAGE_WIDTH / 2 - 24, 17, 8, 1.5, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LEADERBOARD', PAGE_WIDTH / 2, 18, { align: 'center' });

  let currentY = 48;

  // 1st Place - CHAMPION
  if (leaderboard.first) {
    doc.setFillColor(255, 249, 230); // Light gold
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(2);
    doc.roundedRect(MARGIN + 30, currentY, PAGE_WIDTH - (MARGIN * 2) - 60, 38, 3, 3, 'FD');

    // Medal (simple circle with number)
    doc.setFillColor(255, 215, 0);
    doc.circle(MARGIN + 45, currentY + 19, 9, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('1', MARGIN + 45, currentY + 22, { align: 'center' });

    // Badge
    doc.setFillColor(255, 215, 0);
    doc.roundedRect(MARGIN + 65, currentY + 6, 32, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CHAMPION', MARGIN + 81, currentY + 10.5, { align: 'center' });

    // Name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    const name1 = leaderboard.first.name.length > 40 
      ? leaderboard.first.name.substring(0, 37) + '...' 
      : leaderboard.first.name;
    doc.text(name1, MARGIN + 65, currentY + 20);

    // Dojo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    const dojo1 = leaderboard.first.dojo.length > 45 
      ? leaderboard.first.dojo.substring(0, 42) + '...' 
      : leaderboard.first.dojo;
    doc.text(dojo1.toUpperCase(), MARGIN + 65, currentY + 29);

    // Trophy icon right (simple)
    doc.setFillColor(255, 215, 0);
    doc.circle(PAGE_WIDTH - MARGIN - 45, currentY + 19, 7, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(PAGE_WIDTH - MARGIN - 47, currentY + 16, 4, 5, 'F');

    currentY += 48;
  }

  // 2nd & 3rd Place
  const podiumY = currentY;
  const podiumWidth = (PAGE_WIDTH - (MARGIN * 2) - 20) / 3;

  // 2nd Place
  if (leaderboard.second) {
    const x2nd = MARGIN;
    doc.setFillColor(245, 245, 245); // Light silver
    doc.setDrawColor(192, 192, 192);
    doc.setLineWidth(1.5);
    doc.roundedRect(x2nd, podiumY, podiumWidth, 55, 3, 3, 'FD');

    // Medal
    doc.setFillColor(192, 192, 192);
    doc.circle(x2nd + podiumWidth / 2, podiumY + 15, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('2', x2nd + podiumWidth / 2, podiumY + 18, { align: 'center' });

    // Badge
    doc.setFillColor(192, 192, 192);
    doc.roundedRect(x2nd + podiumWidth / 2 - 16, podiumY + 24, 32, 6, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('2ND PLACE', x2nd + podiumWidth / 2, podiumY + 28, { align: 'center' });

    // Name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    const name2 = leaderboard.second.name.length > 22 
      ? leaderboard.second.name.substring(0, 19) + '...' 
      : leaderboard.second.name;
    doc.text(name2, x2nd + podiumWidth / 2, podiumY + 38, { align: 'center' });

    // Dojo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    const dojo2 = leaderboard.second.dojo.length > 24 
      ? leaderboard.second.dojo.substring(0, 21) + '...' 
      : leaderboard.second.dojo;
    doc.text(dojo2.toUpperCase(), x2nd + podiumWidth / 2, podiumY + 46, { align: 'center' });
  }

  // 3rd Place(s)
  if (leaderboard.third.length > 0) {
    leaderboard.third.forEach((participant, index) => {
      const x3rd = MARGIN + podiumWidth + 10 + (index * (podiumWidth + 10));
      
      doc.setFillColor(255, 245, 230); // Light bronze
      doc.setDrawColor(205, 127, 50);
      doc.setLineWidth(1.5);
      doc.roundedRect(x3rd, podiumY, podiumWidth, 55, 3, 3, 'FD');

      // Medal
      doc.setFillColor(205, 127, 50);
      doc.circle(x3rd + podiumWidth / 2, podiumY + 15, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('3', x3rd + podiumWidth / 2, podiumY + 18, { align: 'center' });

      // Badge
      doc.setFillColor(205, 127, 50);
      doc.roundedRect(x3rd + podiumWidth / 2 - 16, podiumY + 24, 32, 6, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('3RD PLACE', x3rd + podiumWidth / 2, podiumY + 28, { align: 'center' });

      // Name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
      const name3 = participant.name.length > 22 
        ? participant.name.substring(0, 19) + '...' 
        : participant.name;
      doc.text(name3, x3rd + podiumWidth / 2, podiumY + 38, { align: 'center' });

      // Dojo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
      const dojo3 = participant.dojo.length > 24 
        ? participant.dojo.substring(0, 21) + '...' 
        : participant.dojo;
      doc.text(dojo3.toUpperCase(), x3rd + podiumWidth / 2, podiumY + 46, { align: 'center' });
    });
  }

  // Empty state
  if (!leaderboard.first && !leaderboard.second && leaderboard.third.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(1);
    doc.roundedRect(MARGIN + 50, PAGE_HEIGHT / 2 - 20, PAGE_WIDTH - (MARGIN * 2) - 100, 40, 3, 3, 'FD');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('No Results Yet', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    doc.text('Leaderboard will be available after matches are completed', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 5, { align: 'center' });
  }

  addPageNumber(doc, pageNum, totalPages);
};

// ==================== MAIN EXPORT FUNCTION (FIXED) ====================
export const exportBracketToPDF = async (config: ExportConfig): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate total pages first
    const totalRounds = config.totalRounds;
    const roundsPerPage = totalRounds <= 3 ? totalRounds : 2; // Max 2 rounds per page for better readability
    const bracketPages = Math.ceil(totalRounds / roundsPerPage);
    const totalPages = 1 + bracketPages + (config.leaderboard ? 1 : 0);

    let currentPage = 1;

    // ===== PAGE 1: COVER PAGE =====
    drawCoverPage(doc, config);
    addPageNumber(doc, currentPage, totalPages);
    
    // ===== PAGE 2-N: BRACKET PAGES =====
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
        currentPage,
        totalPages
      );
      
      processedRounds = endRound;
    }

    // ===== LAST PAGE: LEADERBOARD =====
    if (config.leaderboard) {
      doc.addPage();
      currentPage++;
      drawLeaderboardPage(doc, config.leaderboard, currentPage, totalPages);
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
