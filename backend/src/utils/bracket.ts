/**
 * Tournament bracket generation utilities
 */

export interface BracketParticipant {
  id: number;
  name: string;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  participant1?: BracketParticipant;
  participant2?: BracketParticipant;
  winner?: BracketParticipant;
  nextMatchId?: string;
  previousMatch1Id?: string;
  previousMatch2Id?: string;
}

export interface BracketStructure {
  matches: BracketMatch[];
  rounds: number;
  totalParticipants: number;
  bracketType: 'single-elimination' | 'double-elimination';
}

/**
 * Calculate the next power of 2 greater than or equal to n
 */
const nextPowerOfTwo = (n: number): number => {
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

/**
 * Generate single elimination bracket
 */
export const generateSingleEliminationBracket = (
  participants: BracketParticipant[]
): BracketStructure => {
  const totalParticipants = participants.length;
  const bracketSize = nextPowerOfTwo(totalParticipants);
  const rounds = Math.log2(bracketSize);
  const matches: BracketMatch[] = [];
  
  // Shuffle and seed participants if no seed provided
  const seededParticipants = [...participants];
  seededParticipants.forEach((p, index) => {
    if (!p.seed) p.seed = index + 1;
  });
  
  // Sort by seed
  seededParticipants.sort((a, b) => (a.seed || 0) - (b.seed || 0));
  
  let matchId = 1;
  
  // Generate all rounds
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    
    for (let position = 1; position <= matchesInRound; position++) {
      const match: BracketMatch = {
        id: `match_${matchId}`,
        round,
        position,
      };
      
      // First round - assign participants
      if (round === 1) {
        const participant1Index = (position - 1) * 2;
        const participant2Index = participant1Index + 1;
        
        if (participant1Index < seededParticipants.length) {
          match.participant1 = seededParticipants[participant1Index];
        }
        if (participant2Index < seededParticipants.length) {
          match.participant2 = seededParticipants[participant2Index];
        }
      } else {
        // Connect to previous matches
        const prevMatchPosition1 = (position - 1) * 2 + 1;
        const prevMatchPosition2 = prevMatchPosition1 + 1;
        const prevRound = round - 1;
        
        match.previousMatch1Id = `match_${getPreviousMatchId(prevRound, prevMatchPosition1, rounds)}`;
        match.previousMatch2Id = `match_${getPreviousMatchId(prevRound, prevMatchPosition2, rounds)}`;
      }
      
      // Connect to next match (except final)
      if (round < rounds) {
        const nextMatchPosition = Math.ceil(position / 2);
        const nextRound = round + 1;
        match.nextMatchId = `match_${getNextMatchId(nextRound, nextMatchPosition, rounds)}`;
      }
      
      matches.push(match);
      matchId++;
    }
  }
  
  return {
    matches,
    rounds,
    totalParticipants,
    bracketType: 'single-elimination'
  };
};

/**
 * Helper function to calculate previous match ID
 */
const getPreviousMatchId = (round: number, position: number, totalRounds: number): number => {
  let matchId = 1;
  for (let r = 1; r < round; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    matchId += matchesInRound;
  }
  return matchId + position - 1;
};

/**
 * Helper function to calculate next match ID
 */
const getNextMatchId = (round: number, position: number, totalRounds: number): number => {
  let matchId = 1;
  for (let r = 1; r < round; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    matchId += matchesInRound;
  }
  return matchId + position - 1;
};

/**
 * Generate bracket with byes for odd number of participants
 */
export const generateBracketWithByes = (
  participants: BracketParticipant[]
): BracketStructure => {
  const totalParticipants = participants.length;
  const bracketSize = nextPowerOfTwo(totalParticipants);
  const byesNeeded = bracketSize - totalParticipants;
  
  // Add bye participants
  const participantsWithByes = [...participants];
  for (let i = 0; i < byesNeeded; i++) {
    participantsWithByes.push({
      id: -1 - i,
      name: 'BYE',
      seed: totalParticipants + i + 1
    });
  }
  
  return generateSingleEliminationBracket(participantsWithByes);
};

/**
 * Update match result and propagate winner
 */
export const updateMatchResult = (
  bracket: BracketStructure,
  matchId: string,
  winner: BracketParticipant
): BracketStructure => {
  const updatedMatches = bracket.matches.map(match => {
    if (match.id === matchId) {
      return { ...match, winner };
    }
    return match;
  });
  
  // Find the match and propagate winner to next match
  const currentMatch = updatedMatches.find(m => m.id === matchId);
  if (currentMatch?.nextMatchId) {
    const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId);
    if (nextMatch) {
      // Determine if winner goes to participant1 or participant2 slot
      if (nextMatch.previousMatch1Id === matchId) {
        nextMatch.participant1 = winner;
      } else if (nextMatch.previousMatch2Id === matchId) {
        nextMatch.participant2 = winner;
      }
    }
  }
  
  return {
    ...bracket,
    matches: updatedMatches
  };
};

/**
 * Get matches by round
 */
export const getMatchesByRound = (
  bracket: BracketStructure,
  round: number
): BracketMatch[] => {
  return bracket.matches
    .filter(match => match.round === round)
    .sort((a, b) => a.position - b.position);
};

/**
 * Get current active matches (matches that can be played)
 */
export const getActiveMatches = (bracket: BracketStructure): BracketMatch[] => {
  return bracket.matches.filter(match => {
    // Match is active if:
    // 1. It has both participants (or one participant for bye)
    // 2. It doesn't have a winner yet
    // 3. All prerequisite matches are completed
    
    if (match.winner) return false; // Already completed
    
    // First round matches
    if (match.round === 1) {
      return match.participant1 && (match.participant2 || match.participant1.name === 'BYE');
    }
    
    // Later round matches - check if previous matches are completed
    const prevMatch1 = bracket.matches.find(m => m.id === match.previousMatch1Id);
    const prevMatch2 = bracket.matches.find(m => m.id === match.previousMatch2Id);
    
    return prevMatch1?.winner && prevMatch2?.winner;
  });
};

/**
 * Check if tournament is complete
 */
export const isTournamentComplete = (bracket: BracketStructure): boolean => {
  const finalMatch = bracket.matches.find(match => 
    match.round === bracket.rounds && match.position === 1
  );
  return !!finalMatch?.winner;
};

/**
 * Get tournament winner
 */
export const getTournamentWinner = (bracket: BracketStructure): BracketParticipant | null => {
  if (!isTournamentComplete(bracket)) return null;
  
  const finalMatch = bracket.matches.find(match => 
    match.round === bracket.rounds && match.position === 1
  );
  return finalMatch?.winner || null;
};

/**
 * Generate seeded bracket (professional seeding)
 */
export const generateSeededBracket = (
  participants: BracketParticipant[]
): BracketStructure => {
  const totalParticipants = participants.length;
  const bracketSize = nextPowerOfTwo(totalParticipants);
  
  // Professional tournament seeding order
  const seedingOrder = generateSeedingOrder(bracketSize);
  
  // Arrange participants according to seeding
  const arrangedParticipants: BracketParticipant[] = [];
  seedingOrder.forEach((seedPosition, index) => {
    if (seedPosition <= totalParticipants) {
      const participant = participants.find(p => p.seed === seedPosition);
      if (participant) {
        arrangedParticipants[index] = participant;
      }
    }
  });
  
  // Fill remaining slots with byes if needed
  while (arrangedParticipants.length < bracketSize) {
    arrangedParticipants.push({
      id: -arrangedParticipants.length,
      name: 'BYE',
      seed: bracketSize + 1
    });
  }
  
  return generateSingleEliminationBracket(arrangedParticipants);
};

/**
 * Generate professional seeding order
 */
const generateSeedingOrder = (bracketSize: number): number[] => {
  if (bracketSize === 2) return [1, 2];
  if (bracketSize === 4) return [1, 4, 2, 3];
  if (bracketSize === 8) return [1, 8, 4, 5, 2, 7, 3, 6];
  if (bracketSize === 16) return [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
  if (bracketSize === 32) return [
    1, 32, 16, 17, 8, 25, 9, 24, 4, 29, 13, 20, 5, 28, 12, 21,
    2, 31, 15, 18, 7, 26, 10, 23, 3, 30, 14, 19, 6, 27, 11, 22
  ];
  
  // For larger brackets, generate recursively
  const half = bracketSize / 2;
  const firstHalf = generateSeedingOrder(half);
  const secondHalf = generateSeedingOrder(half);
  
  const result: number[] = [];
  for (let i = 0; i < half; i++) {
    result.push(firstHalf[i]);
    result.push(bracketSize + 1 - firstHalf[i]);
  }
  
  return result;
};