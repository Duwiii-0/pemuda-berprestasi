import { PrismaClient } from '@prisma/client';
import prisma from '../config/database';

export interface Participant {
  id: number;
  name: string;
  dojang?: string;
  atletId?: number;
  isTeam: boolean;
  teamMembers?: string[];
}

  export interface Match {
    id?: number;
    round: number;
    position: number;
    participant1?: Participant | null;
    participant2?: Participant | null;
    winner?: Participant | null;
    scoreA?: number;
    scoreB?: number;
    status: 'pending' | 'ongoing' | 'completed' | 'bye';
    venue?: string;
    tanggalPertandingan?: Date | null;
    nomorPartai?: string | null;  
    nomorAntrian?: number | null;
    nomorLapangan?: string | null;
  }

export interface Bracket {
  id?: number;
  kompetisiId: number;
  kelasKejuaraanId: number;
  matches: Match[];
  totalRounds: number;
  isGenerated: boolean;
  participants: Participant[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class BracketService {
  

static async generateBracket(
  kompetisiId: number, 
  kelasKejuaraanId: number,
  byeParticipantIds?: number[]
): Promise<Bracket> {
  try {
    console.log(`\n🎯 generateBracket called:`);
    console.log(`   Kompetisi: ${kompetisiId}`);
    console.log(`   Kelas: ${kelasKejuaraanId}`);
    console.log(`   BYE IDs:`, byeParticipantIds);

    const existingBagan = await prisma.tb_bagan.findFirst({
      where: {
        id_kompetisi: kompetisiId,
        id_kelas_kejuaraan: kelasKejuaraanId
      }
    });

    if (existingBagan) {
      throw new Error('Bagan sudah dibuat untuk kelas kejuaraan ini');
    }

    const registrations = await prisma.tb_peserta_kompetisi.findMany({
      where: {
        id_kelas_kejuaraan: kelasKejuaraanId,
        status: 'APPROVED'
      },
      include: {
        atlet: {
          include: {
            dojang: true
          }
        },
        anggota_tim: {
          include: {
            atlet: {
              include: {
                dojang: true
              }
            }
          }
        },
        kelas_kejuaraan: {
          include: {
            kompetisi: true,
            kategori_event: true
          }
        }
      }
    });

    if (registrations.length < 2) {
      throw new Error('Minimal 2 peserta diperlukan untuk membuat bagan');
    }

    const kategori = registrations[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
    const isPemula = kategori.includes('pemula');

    console.log(`📊 Category detected: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);

    const participants: Participant[] = registrations.map(reg => {
      if (reg.is_team && reg.anggota_tim.length > 0) {
        return {
          id: reg.id_peserta_kompetisi,
          name: `Tim ${reg.anggota_tim.map(m => m.atlet.nama_atlet).join(' & ')}`,
          dojang: reg.anggota_tim[0]?.atlet?.dojang?.nama_dojang,
          isTeam: true,
          teamMembers: reg.anggota_tim.map(m => m.atlet.nama_atlet)
        };
      } else if (reg.atlet) {
        return {
          id: reg.id_peserta_kompetisi,
          name: reg.atlet.nama_atlet,
          dojang: reg.atlet.dojang?.nama_dojang,
          atletId: reg.atlet.id_atlet,
          isTeam: false
        };
      }
      return null;
    }).filter(Boolean) as Participant[];

    const bagan = await prisma.tb_bagan.create({
      data: {
        id_kompetisi: kompetisiId,
        id_kelas_kejuaraan: kelasKejuaraanId
      }
    });

    await Promise.all(
      participants.map((participant, index) =>
        prisma.tb_drawing_seed.create({
          data: {
            id_bagan: bagan.id_bagan,
            id_peserta_kompetisi: participant.id,
            seed_num: index + 1
          }
        })
      )
    );

    // ⭐ AUTO-GENERATE BYE for Prestasi
    let finalByeIds = byeParticipantIds;
    
    if (!isPemula && !byeParticipantIds) {
      const structure = this.calculateBracketStructure(participants.length);
      const byesNeeded = structure.byesRecommended;
      
      if (byesNeeded > 0) {
        // Randomly select BYE participants
        const shuffled = this.shuffleArray([...participants]);
        finalByeIds = shuffled.slice(0, byesNeeded).map(p => p.id);
        console.log(`🎁 Auto-selected ${byesNeeded} BYE participants:`, finalByeIds);
      }
    }

    const matches = isPemula
      ? await this.generatePemulaBracket(bagan.id_bagan, participants, finalByeIds)
      : await this.generatePrestasiBracket(bagan.id_bagan, participants, finalByeIds);
    
    return {
      id: bagan.id_bagan,
      kompetisiId,
      kelasKejuaraanId,
      totalRounds: isPemula ? 1 : this.calculateTotalRounds(participants.length),
      isGenerated: true,
      participants: participants,
      matches
    };
  } catch (error: any) {
    console.error('Error generating bracket:', error);
    throw new Error(error.message || 'Failed to generate bracket');
  }
}

  /**
   * Shuffle participants randomly
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
 * Validate and adjust BYE count for bracket generation
 * Returns validation result with optional auto-adjustment
 */
static validateAndAdjustBye(
  totalParticipants: number,
  userSelectedByeCount: number,
  targetWinners: number // 4 for Semi, 8 for Quarter
): {
  isValid: boolean;
  adjustedByeCount: number | null;
  message: string;
  recommendedBye: number;
} {
  
  // Calculate recommended BYE count
  const nextPower = Math.pow(2, Math.ceil(Math.log2(totalParticipants)));
  const recommended = nextPower - totalParticipants;
  
  console.log(`\n🔍 Validating BYE count:`);
  console.log(`   Total participants: ${totalParticipants}`);
  console.log(`   Target winners: ${targetWinners}`);
  console.log(`   Recommended BYE: ${recommended}`);
  console.log(`   User selected BYE: ${userSelectedByeCount}`);
  
  // STEP 1: Check if EXACT match (PERFECT)
  if (userSelectedByeCount === recommended) {
    console.log(`   ✅ PERFECT! Exact match`);
    return {
      isValid: true,
      adjustedByeCount: null,
      message: 'BYE count perfect!',
      recommendedBye: recommended
    };
  }
  
  // STEP 2: Check if within TOLERANCE (±1)
  const minBye = Math.max(0, recommended - 1);
  const maxBye = recommended + 1;
  
  console.log(`   📊 Tolerance range: ${minBye}-${maxBye}`);
  
  if (userSelectedByeCount >= minBye && userSelectedByeCount <= maxBye) {
    // Within tolerance → Calculate if it produces correct winners
    const fighters = totalParticipants - userSelectedByeCount;
    const fightMatches = Math.floor(fighters / 2);
    const oddFighter = fighters % 2;
    const totalWinners = fightMatches + userSelectedByeCount + oddFighter;
    
    console.log(`   🧮 Calculation:`);
    console.log(`      Fighters: ${fighters}`);
    console.log(`      Fight matches: ${fightMatches}`);
    console.log(`      Odd fighter: ${oddFighter}`);
    console.log(`      Total winners: ${totalWinners}`);
    
    if (totalWinners === targetWinners) {
      console.log(`   ✅ VALID! Within tolerance and produces correct winners`);
      return {
        isValid: true,
        adjustedByeCount: null,
        message: userSelectedByeCount === 0 
          ? 'Valid: 1 fighter akan dapat bye otomatis' 
          : 'BYE count valid (within tolerance)',
        recommendedBye: recommended
      };
    } else {
      // Need auto-adjust to recommended
      console.log(`   ⚠️ AUTO-ADJUST needed: ${userSelectedByeCount} → ${recommended}`);
      return {
        isValid: true,
        adjustedByeCount: recommended,
        message: `BYE auto-adjusted from ${userSelectedByeCount} to ${recommended} untuk menghasilkan ${targetWinners} winners`,
        recommendedBye: recommended
      };
    }
  }
  
  // STEP 3: OUTSIDE tolerance → REJECT
  console.log(`   ❌ INVALID! Outside tolerance range`);
  return {
    isValid: false,
    adjustedByeCount: null,
    message: `BYE count invalid! Harus ${recommended} (±1 tolerance: ${minBye}-${maxBye}). Anda memilih ${userSelectedByeCount}`,
    recommendedBye: recommended
  };
}

static calculateBracketStructure(
  participantCount: number
): {
  totalRounds: number;
  rounds: {
    round: number;
    name: string;
    participants: number;
    matches: number;
  }[];
  round1Target: number;
  byesRecommended: number;
} {
  console.log(`\n📐 === CALCULATING BRACKET STRUCTURE ===`);
  console.log(`   Participant Count: ${participantCount}`);
  
  // CRITICAL: Minimal 4 peserta untuk proper bracket
  if (participantCount < 4) {
    throw new Error('Minimal 4 peserta diperlukan untuk bracket turnamen');
  }
  
  const rounds: {
    round: number;
    name: string;
    participants: number;
    matches: number;
  }[] = [];
  
  let currentRound = 1;
  
  // ========================================
  // STEP 1: WAJIB - FINAL (2→1)
  // ========================================
  rounds.push({
    round: currentRound++,
    name: 'Final',
    participants: 2,
    matches: 1
  });
  
  console.log(`   ✅ Round ${rounds.length}: Final (2 → 1)`);
  
  // ========================================
  // STEP 2: WAJIB - SEMI FINAL (4→2)
  // ========================================
  rounds.push({
    round: currentRound++,
    name: 'Semi Final',
    participants: 4,
    matches: 2
  });
  
  console.log(`   ✅ Round ${rounds.length}: Semi Final (4 → 2)`);
  
  let round1Target = 4; // Default: Round 1 feeds Semi
  
  // ========================================
  // STEP 3: OPTIONAL - QUARTER FINAL (8→4)
  // ========================================
  if (participantCount >= 8) {
    rounds.push({
      round: currentRound++,
      name: 'Quarter Final',
      participants: 8,
      matches: 4
    });
    round1Target = 8; // Round 1 feeds Quarter
    
    console.log(`   ✅ Round ${rounds.length}: Quarter Final (8 → 4)`);
    console.log(`      → Round 1 target changed to: ${round1Target}`);
  } else {
    console.log(`   ℹ️ No Quarter Final (participants < 8)`);
  }
  
  // ========================================
  // STEP 4: OPTIONAL - ROUND 1
  // ========================================
  let firstRoundParticipants = round1Target;
  
  if (participantCount === round1Target) {
    // Perfect fit! No Round 1 needed
    // Quarter/Semi becomes the first round
    console.log(`   ✅ Perfect fit! No Round 1 needed (${participantCount} = ${round1Target})`);
    
  } else if (participantCount > round1Target) {
    // Need Round 1 to reduce participants to target
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    firstRoundParticipants = nextPowerOf2;
    
    rounds.push({
      round: currentRound++,
      name: 'Round 1',
      participants: nextPowerOf2,
      matches: nextPowerOf2 / 2
    });
    
    console.log(`   ✅ Round ${rounds.length}: Round 1 (${nextPowerOf2} → ${round1Target})`);
    console.log(`      Next Power of 2: ${nextPowerOf2}`);
    
  } else {
    // participantCount < round1Target
    // Need Round 1 with BYE to reach target
    rounds.push({
      round: currentRound++,
      name: 'Round 1',
      participants: round1Target,
      matches: round1Target / 2
    });
    
    console.log(`   ✅ Round ${rounds.length}: Round 1 (${round1Target} with BYE → ${round1Target})`);
  }
  
  // ========================================
  // STEP 5: REVERSE & RENUMBER
  // ========================================
  // Reverse rounds (Final first → Round 1 last dalam array)
  // But renumber dari Round 1 = 1, Round 2, ..., Final
  rounds.reverse();
  rounds.forEach((r, idx) => r.round = idx + 1);
  
  // Calculate BYE recommendation
  const byesRecommended = firstRoundParticipants - participantCount;
  
  console.log(`\n   📊 FINAL STRUCTURE:`);
  rounds.forEach(r => {
    console.log(`      Round ${r.round}: ${r.name} - ${r.participants} participants, ${r.matches} matches`);
  });
  console.log(`   💡 Recommended BYE: ${byesRecommended}`);
  console.log(`   🎯 Total Rounds: ${rounds.length}\n`);
  
  return {
    totalRounds: rounds.length,
    rounds,
    round1Target,
    byesRecommended
  };
}

static async generatePrestasiBracket(
  baganId: number, 
  participants: Participant[],
  byeParticipantIds?: number[]
): Promise<Match[]> {
  const participantCount = participants.length;
  
  console.log(`\n🏆 === GENERATING PRESTASI BRACKET ===`);
  console.log(`Total Participants: ${participantCount}`);
  
  // ⭐ VALIDATE minimal participants
  if (participantCount < 4) {
    throw new Error('Minimal 4 peserta diperlukan untuk bracket prestasi');
  }

  // ⭐ CALCULATE BRACKET STRUCTURE using new method
  const structure = this.calculateBracketStructure(participantCount);
  const totalRounds = structure.totalRounds;
  const round1Target = structure.round1Target;
  const byesRecommended = structure.byesRecommended;
  
  console.log(`📊 Bracket Structure:`);
  console.log(`   Total Rounds: ${totalRounds}`);
  console.log(`   Round 1 Target: ${round1Target}`);
  console.log(`   BYE Recommended: ${byesRecommended}`);
  
  // ⭐ VALIDATE BYE count if provided
  if (byeParticipantIds && byeParticipantIds.length > 0) {
    const validation = this.validateAndAdjustBye(
      participantCount,
      byeParticipantIds.length,
      round1Target
    );
    
    console.log(`   BYE Validation: ${validation.message}`);
    
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    // ⭐ AUTO-ADJUST if needed (hybrid approach)
    if (validation.adjustedByeCount !== null) {
      console.log(`   ⚠️ BYE auto-adjusted from ${byeParticipantIds.length} to ${validation.adjustedByeCount}`);
      // Randomly select subset if user selected too many
      if (byeParticipantIds.length > validation.adjustedByeCount) {
        const shuffled = this.shuffleArray([...byeParticipantIds]);
        byeParticipantIds = shuffled.slice(0, validation.adjustedByeCount);
        console.log(`   → Selected BYE IDs: ${byeParticipantIds}`);
      }
    }
  }

  const matches: Match[] = [];

  // ========================================
  // STEP 1: Separate BYE vs FIGHTING
  // ========================================
  let byeParticipants: Participant[] = [];
  let fightingParticipants: Participant[] = [];

  if (byeParticipantIds && byeParticipantIds.length > 0) {
    byeParticipants = participants.filter(p => byeParticipantIds.includes(p.id));
    fightingParticipants = participants.filter(p => !byeParticipantIds.includes(p.id));
    
    console.log(`🎁 BYE (${byeParticipants.length}):`, byeParticipants.map(p => p.name));
    console.log(`⚔️ FIGHTING (${fightingParticipants.length}):`, fightingParticipants.map(p => p.name));
  } else {
    fightingParticipants = [...participants];
    console.log(`⚔️ ALL FIGHTING (no BYE): ${fightingParticipants.length}`);
  }

  // ========================================
  // STEP 2: ROUND 1 - Create ALL matches (including BYE matches)
  // ========================================
  console.log(`\n📝 Creating Round 1 matches...`);
  
  // Shuffle fighting participants for random seeding
  const shuffledFighters = this.shuffleArray([...fightingParticipants]);
  
  // Create FIGHTING matches (pair up fighters)
  for (let i = 0; i < shuffledFighters.length; i += 2) {
    const participant1 = shuffledFighters[i];
    const participant2 = shuffledFighters[i + 1] || null;
    
    const match = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: participant1.id,
        id_peserta_b: participant2?.id || null,
        skor_a: 0,
        skor_b: 0
      }
    });

    matches.push({
      id: match.id_match,
      round: 1,
      position: matches.length,
      participant1,
      participant2: participant2 || null,
      status: participant2 ? 'pending' : 'bye',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  Match ${match.id_match}: ${participant1.name} vs ${participant2?.name || 'BYE (odd)'}`);
  }

  // Create BYE matches (user-selected BYE participants)
  for (const byeParticipant of byeParticipants) {
    const match = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: byeParticipant.id,
        id_peserta_b: null, // ✅ NULL = BYE (auto-win)
        skor_a: 0,
        skor_b: 0
      }
    });
    
    matches.push({
      id: match.id_match,
      round: 1,
      position: matches.length,
      participant1: byeParticipant,
      participant2: null,
      status: 'bye',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  Match ${match.id_match}: ${byeParticipant.name} vs BYE (auto-win)`);
  }

  // ========================================
  // STEP 3: ROUND 2+ - Create EMPTY placeholder matches
  // ========================================
  for (let round = 2; round <= totalRounds; round++) {
    // Calculate matches in this round (each round has half the participants of previous)
    const participantsInRound = Math.pow(2, totalRounds - round + 1);
    const matchesInRound = participantsInRound / 2;
    
    console.log(`\n   Round ${round}: Creating ${matchesInRound} placeholder matches`);
    
    for (let i = 0; i < matchesInRound; i++) {
      const match = await prisma.tb_match.create({
        data: {
          id_bagan: baganId,
          ronde: round,
          id_peserta_a: null, // ✅ TBD - Will be filled by advanceWinner
          id_peserta_b: null, // ✅ TBD - Will be filled by advanceWinner
          skor_a: 0,
          skor_b: 0
        }
      });

      matches.push({
        id: match.id_match,
        round,
        position: i,
        participant1: null,
        participant2: null,
        status: 'pending',
        scoreA: 0,
        scoreB: 0
      });
    }
  }

// ⭐ ADVANCE BYE WINNERS AUTOMATICALLY
console.log(`\n🎯 Auto-advancing BYE winners to next round...`);
const round1Matches = matches.filter(m => m.round === 1);

for (const match of round1Matches) {
  // Check if this is a BYE match (participant A exists, no participant B)
  if (match.participant1 && !match.participant2 && match.id) {
    console.log(`   🎁 BYE detected: ${match.participant1.name} (Match ${match.id})`);
    
    // Create a mock match object for advanceWinnerToNextRound
    const mockMatch = await prisma.tb_match.findUnique({
      where: { id_match: match.id },
      include: {
        bagan: true
      }
    });
    
    if (mockMatch) {
      // Advance the BYE winner to next round
      await this.advanceWinnerToNextRound(mockMatch, match.participant1.id);
      console.log(`   ✅ Advanced ${match.participant1.name} to Round 2`);
    }
  }
}

return matches;
}

static getMatchesByRound(matches: Match[], round: number): Match[] {
  return matches.filter(m => m.round === round);
}

  /**
   * ⭐ NEW: Calculate optimal BYE positions to spread them evenly
   */
  static calculateByePositions(participantCount: number, targetSize: number): number[] {
    const byesNeeded = targetSize - participantCount;
    const positions: number[] = [];
    
    // Spread byes evenly throughout the bracket
    const spacing = Math.floor(targetSize / byesNeeded);
    
    for (let i = 0; i < byesNeeded; i++) {
      positions.push(spacing * i + Math.floor(spacing / 2));
    }
    
    return positions.sort((a, b) => b - a); // Reverse order for insertion
  }

  /**
   * Generate PEMULA bracket (single round, all matches)
   */
static async generatePemulaBracket(
  baganId: number, 
  participants: Participant[],
  byeParticipantIds?: number[] // ⭐ IGNORED - BYE otomatis
): Promise<Match[]> {
  const matches: Match[] = [];
  
  console.log(`\n🥋 === GENERATING PEMULA BRACKET (AUTO BYE) ===`);
  console.log(`Total participants: ${participants.length}`);

  // ⭐ SHUFFLE all participants
  const shuffled = this.shuffleArray([...participants]);
  
  // ⭐ CALCULATE pairs
  const totalParticipants = shuffled.length;
  const hasBye = totalParticipants % 2 === 1;
  
  // ⭐ STEP 1: Pair up participants for normal matches
  const normalMatchCount = Math.floor(totalParticipants / 2);
  
  console.log(`\n📊 Creating ${normalMatchCount} normal matches...`);
  
  for (let i = 0; i < normalMatchCount * 2; i += 2) {
    const participant1 = shuffled[i];
    const participant2 = shuffled[i + 1];
    
    const match = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: participant1.id,
        id_peserta_b: participant2.id,
        skor_a: 0,
        skor_b: 0
      }
    });
    
    matches.push({
      id: match.id_match,
      round: 1,
      position: matches.length,
      participant1,
      participant2,
      status: 'pending',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  Match ${match.id_match}: ${participant1.name} vs ${participant2.name}`);
  }

  // ⭐ STEP 2: If ODD, create ADDITIONAL MATCH (BYE participant vs last winner)
  if (hasBye) {
    const byeParticipant = shuffled[totalParticipants - 1]; // Last participant gets BYE
    
    console.log(`\n🎁 BYE participant: ${byeParticipant.name} (${byeParticipant.id})`);
    console.log(`   → Will compete in ADDITIONAL match after round 1 completes`);
    
    // Create placeholder match (will be filled after match 3 winner is determined)
    const additionalMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 2, // ⭐ ROUND 2 (additional match)
        id_peserta_a: byeParticipant.id, // BYE participant
        id_peserta_b: null, // ⭐ TBD - winner of last match in round 1
        skor_a: 0,
        skor_b: 0
      }
    });
    
    matches.push({
      id: additionalMatch.id_match,
      round: 2,
      position: 0,
      participant1: byeParticipant,
      participant2: null,
      status: 'pending',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  ⭐ Additional Match ${additionalMatch.id_match}: ${byeParticipant.name} vs [Winner of Match ${matches[matches.length - 2].id}]`);
  }

  console.log(`\n✅ PEMULA bracket complete: ${matches.length} matches`);
  return matches;
}

  /**
   * Get bracket by competition and class
   */
  static async getBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<Bracket | null> {
    try {
      const bagan = await prisma.tb_bagan.findFirst({
        where: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        },
        include: {
          drawing_seed: {
            include: {
              peserta_kompetisi: {
                include: {
                  atlet: {
                    include: {
                      dojang: true
                    }
                  },
                  anggota_tim: {
                    include: {
                      atlet: {
                        include: {
                          dojang: true
                        }
                      }
                    }
                  }
                }
              }
            },
            orderBy: { seed_num: 'asc' }
          },
          match: {
            include: {
              peserta_a: {
                include: {
                  atlet: {
                    include: {
                      dojang: true
                    }
                  },
                  anggota_tim: {
                    include: {
                      atlet: {
                        include: {
                          dojang: true
                        }
                      }
                    }
                  }
                }
              },
              peserta_b: {
                include: {
                  atlet: {
                    include: {
                      dojang: true
                    }
                  },
                  anggota_tim: {
                    include: {
                      atlet: {
                        include: {
                          dojang: true
                        }
                      }
                    }
                  }
                }
              },
              venue: true
            },
            orderBy: [
              { ronde: 'asc' },
              { id_match: 'asc' }
            ]
          }
        }
      });

      if (!bagan) return null;

      // Transform participants
      const participants: Participant[] = bagan.drawing_seed.map(seed => {
        const reg = seed.peserta_kompetisi;
        if (reg.is_team && reg.anggota_tim.length > 0) {
          return {
            id: reg.id_peserta_kompetisi,
            name: `Tim ${reg.anggota_tim.map(m => m.atlet.nama_atlet).join(' & ')}`,
            dojang: reg.anggota_tim[0]?.atlet?.dojang?.nama_dojang,
            isTeam: true,
            teamMembers: reg.anggota_tim.map(m => m.atlet.nama_atlet)
          };
        } else if (reg.atlet) {
          return {
            id: reg.id_peserta_kompetisi,
            name: reg.atlet.nama_atlet,
            dojang: reg.atlet.dojang?.nama_dojang,
            atletId: reg.atlet.id_atlet,
            isTeam: false
          };
        }
        return null;
      }).filter(Boolean) as Participant[];

      // Transform matches
      const matches: Match[] = bagan.match.map(match => {
        const hasParticipant1 = !!match.peserta_a;
        const hasParticipant2 = !!match.peserta_b;
        
        return {
          id: match.id_match,
          round: match.ronde,
          position: 0,
          participant1: hasParticipant1 ? this.transformParticipant(match.peserta_a) : null,
          participant2: hasParticipant2 ? this.transformParticipant(match.peserta_b) : null,
          winner: this.determineWinner(match),
          scoreA: match.skor_a,
          scoreB: match.skor_b,
          status: (hasParticipant1 && !hasParticipant2) || (!hasParticipant1 && hasParticipant2)
            ? 'bye' 
            : this.determineMatchStatus(match),
          venue: match.venue?.nama_venue,
          tanggalPertandingan: match.tanggal_pertandingan,
          nomorPartai: match.nomor_partai,
          
          // ⭐ TAMBAHAN BARU
          nomorAntrian: match.nomor_antrian,
          nomorLapangan: match.nomor_lapangan
        };
      });

      return {
        id: bagan.id_bagan,
        kompetisiId,
        kelasKejuaraanId,
        totalRounds: Math.max(...matches.map(m => m.round)),
        isGenerated: true,
        participants,
        matches
      };
    } catch (error: any) {
      console.error('Error getting bracket:', error);
      throw new Error('Failed to get bracket');
    }
  }

  /**
   * Update match result with queue fields
   */
static async updateMatch(
  matchId: number, 
  winnerId?: number | null,             // ⭐ NOW OPTIONAL
  scoreA?: number | null,               // ⭐ NOW OPTIONAL
  scoreB?: number | null,               // ⭐ NOW OPTIONAL
  tanggalPertandingan?: Date | null,
  nomorAntrian?: number | null,
  nomorLapangan?: string | null
): Promise<Match> {
  try {
    const updateData: any = {};
    
    // ⭐ MODE DETECTION
    const isResultUpdate = winnerId !== undefined && winnerId !== null;
    const isScheduleUpdate = nomorAntrian !== undefined || nomorLapangan !== undefined || tanggalPertandingan !== undefined;
    
    console.log(`🔄 Update mode: ${isResultUpdate ? 'RESULT' : 'SCHEDULE'}`);

    // ⭐ RESULT UPDATE - Update scores & advance winner
    if (isResultUpdate) {
      updateData.skor_a = scoreA;
      updateData.skor_b = scoreB;
      
      console.log(`   📊 Updating scores: ${scoreA} - ${scoreB}, Winner: ${winnerId}`);
    }

    // ⭐ SCHEDULING UPDATE - Update queue fields
    if (tanggalPertandingan !== undefined) {
      updateData.tanggal_pertandingan = tanggalPertandingan;
      console.log(`   📅 Updating tanggal: ${tanggalPertandingan}`);
    }
    
    if (nomorAntrian !== undefined) {
      updateData.nomor_antrian = nomorAntrian;
      console.log(`   🔢 Updating nomor antrian: ${nomorAntrian}`);
    }
    
    if (nomorLapangan !== undefined) {
      updateData.nomor_lapangan = nomorLapangan;
      console.log(`   🏟️ Updating nomor lapangan: ${nomorLapangan}`);
    }
    
    // ⭐ AUTO-GENERATE nomor_partai if both queue fields exist
    if (nomorAntrian && nomorLapangan) {
      updateData.nomor_partai = `${nomorAntrian}${nomorLapangan}`;
      console.log(`   🎯 Auto-generated nomor_partai: ${updateData.nomor_partai}`);
    }

    // Execute update
    const updatedMatch = await prisma.tb_match.update({
      where: { id_match: matchId },
      data: updateData,
      include: {
        peserta_a: {
          include: {
            atlet: {
              include: {
                dojang: true
              }
            },
            anggota_tim: {
              include: {
                atlet: {
                  include: {
                    dojang: true
                  }
                }
              }
            }
          }
        },
        peserta_b: {
          include: {
            atlet: {
              include: {
                dojang: true
              }
            },
            anggota_tim: {
              include: {
                atlet: {
                  include: {
                    dojang: true
                  }
                }
              }
            }
          }
        },
        venue: true
      }
    });

    // ⭐ ONLY advance winner if result update mode
    if (isResultUpdate && winnerId) {
      console.log(`   ➡️ Advancing winner to next round...`);
      await this.advanceWinnerToNextRound(updatedMatch, winnerId);
    }

    return {
      id: updatedMatch.id_match,
      round: updatedMatch.ronde,
      position: 0,
      participant1: updatedMatch.peserta_a ? this.transformParticipant(updatedMatch.peserta_a) : null,
      participant2: updatedMatch.peserta_b ? this.transformParticipant(updatedMatch.peserta_b) : null,
      winner: this.determineWinner(updatedMatch),
      scoreA: updatedMatch.skor_a,
      scoreB: updatedMatch.skor_b,
      status: this.determineMatchStatus(updatedMatch),
      tanggalPertandingan: updatedMatch.tanggal_pertandingan,
      nomorPartai: updatedMatch.nomor_partai,
      nomorAntrian: updatedMatch.nomor_antrian,
      nomorLapangan: updatedMatch.nomor_lapangan
    };
  } catch (error: any) {
    console.error('❌ Error updating match:', error);
    throw new Error('Failed to update match');
  }
}

  /**
   * Advance winner to next round
   */
static async advanceWinnerToNextRound(match: any, winnerId: number): Promise<void> {
  const currentRound = match.ronde;
  const nextRound = currentRound + 1;
  
  console.log(`🎯 Advancing winner ${winnerId} from Round ${currentRound} to Round ${nextRound}`);
  
  // ⭐ CHECK: Is this PEMULA category?
  const bagan = await prisma.tb_bagan.findUnique({
    where: { id_bagan: match.id_bagan },
    include: {
      kelas_kejuaraan: {
        include: {
          kategori_event: true
        }
      }
    }
  });
  
  const isPemula = bagan?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
  
  // ⭐ PEMULA LOGIC: Check if this is the LAST match in Round 1
  if (isPemula && currentRound === 1) {
    // Get all Round 1 matches
    const round1Matches = await prisma.tb_match.findMany({
      where: {
        id_bagan: match.id_bagan,
        ronde: 1
      },
      orderBy: { id_match: 'asc' }
    });
    
    // Check if there's a Round 2 match (additional match)
    const round2Match = await prisma.tb_match.findFirst({
      where: {
        id_bagan: match.id_bagan,
        ronde: 2
      }
    });
    
    if (round2Match) {
      // Find the last match in Round 1
      const lastMatchInRound1 = round1Matches[round1Matches.length - 1];
      
      // If this is the last match winner, advance to Round 2 additional match
      if (match.id_match === lastMatchInRound1.id_match) {
        console.log(`   ⭐ PEMULA: Last match winner → Advance to additional match (Round 2)`);
        
        await prisma.tb_match.update({
          where: { id_match: round2Match.id_match },
          data: { id_peserta_b: winnerId }
        });
        
        console.log(`   ✅ Winner ${winnerId} placed in Round 2 Additional Match (Slot B)`);
        return; // Exit early
      }
    }
  }
  
  // ⭐ EXISTING LOGIC FOR PRESTASI (continue as normal)
  const currentRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: currentRound
    },
    orderBy: { id_match: 'asc' }
  });

  const nextRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: nextRound
    },
    orderBy: { id_match: 'asc' }
  });

  if (nextRoundMatches.length === 0) {
    console.log(`   ℹ️ No next round (this was the final)`);
    return;
  }

  const currentMatchIndex = currentRoundMatches.findIndex(m => m.id_match === match.id_match);
  
  if (currentMatchIndex === -1) {
    console.error(`   ❌ Could not find current match in round matches`);
    return;
  }

  const nextMatchIndex = Math.floor(currentMatchIndex / 2);
  const nextMatch = nextRoundMatches[nextMatchIndex];

  if (!nextMatch) {
    console.error(`   ❌ Could not find next match at index ${nextMatchIndex}`);
    return;
  }

  const isFirstSlot = currentMatchIndex % 2 === 0;
  
  if (isFirstSlot) {
    if (nextMatch.id_peserta_a) {
      console.log(`   ⚠️ Slot A already occupied - SKIPPING`);
      return;
    }
    
    await prisma.tb_match.update({
      where: { id_match: nextMatch.id_match },
      data: { id_peserta_a: winnerId }
    });
    
    console.log(`   ✅ Winner ${winnerId} placed in Round ${nextRound} Match ${nextMatch.id_match} (Slot A)`);
  } else {
    if (nextMatch.id_peserta_b) {
      console.log(`   ⚠️ Slot B already occupied - SKIPPING`);
      return;
    }
    
    await prisma.tb_match.update({
      where: { id_match: nextMatch.id_match },
      data: { id_peserta_b: winnerId }
    });
    
    console.log(`   ✅ Winner ${winnerId} placed in Round ${nextRound} Match ${nextMatch.id_match} (Slot B)`);
  }
}

  /**
   * Shuffle/regenerate bracket
   * ⭐ NOW supports participantIds parameter
   */
static async shuffleBracket(
  kompetisiId: number, 
  kelasKejuaraanId: number,
  participantIds?: number[]
): Promise<Bracket> {
  try {
    console.log(`\n🔀 Shuffling PRESTASI bracket...`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);

    // ⭐ STEP 1: DELETE EXISTING BRACKET
    const existingBagan = await prisma.tb_bagan.findFirst({
      where: {
        id_kompetisi: kompetisiId,
        id_kelas_kejuaraan: kelasKejuaraanId
      },
      include: {
        match: true
      }
    });

    if (existingBagan) {
      console.log(`   🗑️ Deleting existing bracket (${existingBagan.match.length} matches)...`);

      // Delete in correct order to avoid foreign key constraints
      await prisma.tb_match_audit.deleteMany({
        where: {
          match: {
            id_bagan: existingBagan.id_bagan
          }
        }
      });

      await prisma.tb_match.deleteMany({
        where: { id_bagan: existingBagan.id_bagan }
      });

      await prisma.tb_drawing_seed.deleteMany({
        where: { id_bagan: existingBagan.id_bagan }
      });

      await prisma.tb_bagan.delete({
        where: { id_bagan: existingBagan.id_bagan }
      });

      console.log(`   ✅ Bracket deleted successfully`);
    }

    // ⭐ STEP 2: GENERATE NEW BRACKET (auto BYE selection)
    console.log(`   🎲 Generating new bracket with random BYE...`);
    const newBracket = await this.generateBracket(kompetisiId, kelasKejuaraanId);
    
    console.log(`   ✅ New bracket generated with ${newBracket.matches.length} matches`);
    return newBracket;

  } catch (error: any) {
    console.error('❌ Error shuffling bracket:', error);
    throw new Error(error.message || 'Failed to shuffle bracket');
  }
}

/**
 * ⭐ NEW: Shuffle PEMULA bracket (re-arrange participants only)
 * Does NOT delete bracket - just re-assigns participants to matches
 */
static async shufflePemulaBracket(
  kompetisiId: number,
  kelasKejuaraanId: number
): Promise<Bracket> {
  try {
    console.log(`\n🔀 === SHUFFLING PEMULA BRACKET ===`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);

    // Get existing bracket
    const bagan = await prisma.tb_bagan.findFirst({
      where: {
        id_kompetisi: kompetisiId,
        id_kelas_kejuaraan: kelasKejuaraanId
      },
      include: {
        match: {
          include: {
            peserta_a: true,
            peserta_b: true
          }
        },
        drawing_seed: {
          include: {
            peserta_kompetisi: {
              include: {
                atlet: {
                  include: {
                    dojang: true
                  }
                },
                anggota_tim: {
                  include: {
                    atlet: {
                      include: {
                        dojang: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!bagan) {
      throw new Error('Bagan tidak ditemukan');
    }

    // ⭐ CHECK: Any match has scores?
    const hasScores = bagan.match.some(m => m.skor_a > 0 || m.skor_b > 0);
    if (hasScores) {
      throw new Error('Tidak dapat shuffle! Ada pertandingan yang sudah memiliki skor. Silakan Clear Results terlebih dahulu.');
    }

    // Get all participants from drawing_seed
    const participants: Participant[] = bagan.drawing_seed.map(seed => {
      const reg = seed.peserta_kompetisi;
      if (reg.is_team && reg.anggota_tim.length > 0) {
        return {
          id: reg.id_peserta_kompetisi,
          name: `Tim ${reg.anggota_tim.map(m => m.atlet.nama_atlet).join(' & ')}`,
          dojang: reg.anggota_tim[0]?.atlet?.dojang?.nama_dojang,
          isTeam: true,
          teamMembers: reg.anggota_tim.map(m => m.atlet.nama_atlet)
        };
      } else if (reg.atlet) {
        return {
          id: reg.id_peserta_kompetisi,
          name: reg.atlet.nama_atlet,
          dojang: reg.atlet.dojang?.nama_dojang,
          atletId: reg.atlet.id_atlet,
          isTeam: false
        };
      }
      return null;
    }).filter(Boolean) as Participant[];

    console.log(`   Total participants: ${participants.length}`);

    // ⭐ SHUFFLE participants
    const shuffled = this.shuffleArray([...participants]);
    console.log(`   🔀 Shuffled order:`, shuffled.map(p => p.name));

    // ⭐ RE-ASSIGN participants to existing matches
    const round1Matches = bagan.match.filter(m => m.ronde === 1).sort((a, b) => a.id_match - b.id_match);
    const round2Matches = bagan.match.filter(m => m.ronde === 2).sort((a, b) => a.id_match - b.id_match);

    const normalMatchCount = Math.floor(shuffled.length / 2);
    const hasBye = shuffled.length % 2 === 1;

    console.log(`\n   📝 Re-assigning participants to matches...`);

    // Update Round 1 matches
    for (let i = 0; i < normalMatchCount; i++) {
      const match = round1Matches[i];
      const participant1 = shuffled[i * 2];
      const participant2 = shuffled[i * 2 + 1];

      await prisma.tb_match.update({
        where: { id_match: match.id_match },
        data: {
          id_peserta_a: participant1.id,
          id_peserta_b: participant2.id,
          skor_a: 0,
          skor_b: 0
        }
      });

      console.log(`      Match ${match.id_match}: ${participant1.name} vs ${participant2.name}`);
    }

    // Update Round 2 (additional match) if exists
    if (hasBye && round2Matches.length > 0) {
      const byeParticipant = shuffled[shuffled.length - 1];
      const additionalMatch = round2Matches[0];

      await prisma.tb_match.update({
        where: { id_match: additionalMatch.id_match },
        data: {
          id_peserta_a: byeParticipant.id,
          id_peserta_b: null, // TBD - will be filled after last match
          skor_a: 0,
          skor_b: 0
        }
      });

      console.log(`      Additional Match ${additionalMatch.id_match}: ${byeParticipant.name} vs TBD`);
    }

    console.log(`\n   ✅ Shuffle complete!`);

    // Return updated bracket
    return await this.getBracket(kompetisiId, kelasKejuaraanId) as Bracket;

  } catch (error: any) {
    console.error('❌ Error shuffling PEMULA bracket:', error);
    throw new Error(error.message || 'Gagal shuffle bracket');
  }
}

  /**
   * Advance bye winners to next round automatically
   */
  static async advanceByeWinners(baganId: number, byeWinners: Match[]): Promise<void> {
    for (const match of byeWinners) {
      if (match.winner && match.id) {
        await this.advanceWinnerToNextRound(
          { id_bagan: baganId, ronde: match.round, id_match: match.id },
          match.winner.id
        );
      }
    }
  }

  /**
   * Calculate total rounds needed
   */
static calculateTotalRounds(participantCount: number): number {
  if (participantCount < 4) {
    throw new Error('Minimal 4 peserta diperlukan untuk bracket turnamen');
  }
  
  try {
    const structure = this.calculateBracketStructure(participantCount);
    return structure.totalRounds;
  } catch (error) {
    // Fallback to old logic if structure calculation fails
    console.warn('⚠️ Using fallback calculation for total rounds');
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    return Math.log2(nextPowerOf2);
  }
}

  /**
   * Transform participant from database format
   */
  static transformParticipant(participant: any): Participant {
    if (participant.is_team && participant.anggota_tim?.length > 0) {
      return {
        id: participant.id_peserta_kompetisi,
        name: `Tim ${participant.anggota_tim.map((m: any) => m.atlet.nama_atlet).join(' & ')}`,
        dojang: participant.anggota_tim[0]?.atlet?.dojang?.nama_dojang,
        isTeam: true,
        teamMembers: participant.anggota_tim.map((m: any) => m.atlet.nama_atlet)
      };
    } else if (participant.atlet) {
      return {
        id: participant.id_peserta_kompetisi,
        name: participant.atlet.nama_atlet,
        dojang: participant.atlet.dojang?.nama_dojang,
        atletId: participant.atlet.id_atlet,
        isTeam: false
      };
    }
    throw new Error('Invalid participant data');
  }

  /**
   * Determine match winner based on scores
   */
  static determineWinner(match: any): Participant | null {
    if (match.skor_a > match.skor_b && match.peserta_a) {
      return this.transformParticipant(match.peserta_a);
    } else if (match.skor_b > match.skor_a && match.peserta_b) {
      return this.transformParticipant(match.peserta_b);
    }
    return null;
  }

  /**
   * Determine match status
   */
  static determineMatchStatus(match: any): 'pending' | 'ongoing' | 'completed' {
    if (match.skor_a > 0 || match.skor_b > 0) {
      return 'completed';
    }
    if (match.peserta_a && match.peserta_b) {
      return 'pending';
    }
    return 'pending';
  }

  /**
   * Clear all match results (scores) but keep bracket structure
   */
  static async clearMatchResults(kompetisiId: number, kelasKejuaraanId: number): Promise<{
    success: boolean;
    message: string;
    clearedMatches: number;
  }> {
    try {
      console.log(`🧹 Clearing match results for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

      const bagan = await prisma.tb_bagan.findFirst({
        where: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        },
        include: {
          match: true
        }
      });

      if (!bagan) {
        throw new Error('Bagan tidak ditemukan');
      }

      // Reset all match scores to 0
      const updatePromises = bagan.match.map((match) => {
        if (match.ronde === 1) {
          return prisma.tb_match.update({
            where: { id_match: match.id_match },
            data: {
              skor_a: 0,
              skor_b: 0
            }
          });
        } else {
          return prisma.tb_match.update({
            where: { id_match: match.id_match },
            data: {
              skor_a: 0,
              skor_b: 0,
              id_peserta_a: null,
              id_peserta_b: null
            }
          });
        }
      });

      await Promise.all(updatePromises);

      console.log(`✅ Cleared ${bagan.match.length} matches`);

      return {
        success: true,
        message: `Berhasil mereset ${bagan.match.length} pertandingan`,
        clearedMatches: bagan.match.length
      };
    } catch (error: any) {
      console.error('❌ Error clearing match results:', error);
      throw new Error(error.message || 'Gagal mereset hasil pertandingan');
    }
  }

  /**
   * Delete entire bracket (bagan + matches + seeds)
   */
  static async deleteBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<{
    success: boolean;
    message: string;
    deletedItems: {
      matches: number;
      seeds: number;
      bracket: boolean;
    };
  }> {
    try {
      console.log(`🗑️ Deleting bracket for kompetisi ${kompetisiId}, kelas ${kelasKejuaraanId}`);

      const bagan = await prisma.tb_bagan.findFirst({
        where: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        },
        include: {
          match: true,
          drawing_seed: true
        }
      });

      if (!bagan) {
        throw new Error('Bagan tidak ditemukan');
      }

      const matchCount = bagan.match.length;
      const seedCount = bagan.drawing_seed.length;

      // Delete in correct order
      await prisma.tb_match_audit.deleteMany({
        where: {
          match: {
            id_bagan: bagan.id_bagan
          }
        }
      });

      await prisma.tb_match.deleteMany({
        where: { id_bagan: bagan.id_bagan }
      });

      await prisma.tb_drawing_seed.deleteMany({
        where: { id_bagan: bagan.id_bagan }
      });

      await prisma.tb_bagan.delete({
        where: { id_bagan: bagan.id_bagan }
      });

      console.log(`✅ Deleted bracket: ${matchCount} matches, ${seedCount} seeds`);

      return {
        success: true,
        message: 'Bracket berhasil dihapus',
        deletedItems: {
          matches: matchCount,
          seeds: seedCount,
          bracket: true
        }
      };
    } catch (error: any) {
      console.error('❌ Error deleting bracket:', error);
      throw new Error(error.message || 'Gagal menghapus bracket');
    }
  }
}