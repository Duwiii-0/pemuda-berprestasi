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

      // Build WHERE clause for participant filtering
      const participantFilter: any = {
        id_kelas_kejuaraan: kelasKejuaraanId,
        status: 'APPROVED'
      };

      // Get approved participants for this class
      const registrations = await prisma.tb_peserta_kompetisi.findMany({
        where: participantFilter,
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

      // Validate participant count
      if (registrations.length < 2) {
        throw new Error('Minimal 2 peserta diperlukan untuk membuat bagan');
      }

      // DETEKSI KATEGORI PEMULA vs PRESTASI
    const kategori = registrations[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
    const isPemula = kategori.includes('pemula');

    console.log(`📊 Category detected: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);
    console.log(`   BYE participants to select: ${byeParticipantIds?.length || 0}`);

      // ⭐ ALL participants must be included
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

      // // Shuffle participants for random seeding
      // const shuffledParticipants = this.shuffleArray([...participants]);
      
      // Create bracket (bagan)
      const bagan = await prisma.tb_bagan.create({
        data: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        }
      });

    // ⭐ SEEDING: Buat seed untuk SEMUA participants (belum di-shuffle)
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

// ⭐ Generate matches - PASS participants asli (belum shuffle)
    const matches = isPemula
      ? await this.generatePemulaBracket(bagan.id_bagan, participants, byeParticipantIds)
      : await this.generatePrestasiBracket(bagan.id_bagan, participants, byeParticipantIds);
    
    return {
      id: bagan.id_bagan,
      kompetisiId,
      kelasKejuaraanId,
      totalRounds: isPemula ? 1 : this.calculateTotalRounds(participants.length),
      isGenerated: true,
      participants: participants, // ⭐ Return original order
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

static async generatePrestasiBracket(
  baganId: number, 
  participants: Participant[],
  byeParticipantIds?: number[]
): Promise<Match[]> {
  const participantCount = participants.length;
  
  if (participantCount < 2) {
    throw new Error('At least 2 participants required for bracket');
  }

  // ✅ CALCULATE TOTAL ROUNDS based on next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  const totalRounds = Math.log2(nextPowerOf2);
  
  console.log(`\n🏆 === GENERATING PRESTASI BRACKET ===`);
  console.log(`Total Participants: ${participantCount}`);
  console.log(`Next Power of 2: ${nextPowerOf2}`);
  console.log(`Total Rounds: ${totalRounds}`);

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

  console.log(`\n✅ PRESTASI bracket complete: ${matches.length} matches`);
  console.log(`   - Round 1: ${this.getMatchesByRound(matches, 1).length} matches`);
  console.log(`   - Total Rounds: ${totalRounds}\n`);
  
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
  byeParticipantIds?: number[]
): Promise<Match[]> {
  const matches: Match[] = [];
  
  console.log(`\n🥋 === GENERATING PEMULA BRACKET ===`);
  console.log(`Total participants: ${participants.length}`);
  console.log(`BYE participant IDs:`, byeParticipantIds);

  // ⭐ STEP 1: Separate BYE vs FIGHTING
  let byeParticipants: Participant[] = [];
  let fightingParticipants: Participant[] = [];

  if (byeParticipantIds && byeParticipantIds.length > 0) {
    console.log(`\n🔍 Separating BYE and FIGHTING participants...`);
    
    byeParticipants = participants.filter(p => byeParticipantIds.includes(p.id));
    fightingParticipants = participants.filter(p => !byeParticipantIds.includes(p.id));
    
    console.log(`✅ BYE (${byeParticipants.length}):`, byeParticipants.map(p => `${p.name} (${p.id})`));
    console.log(`⚔️ FIGHTING (${fightingParticipants.length}):`, fightingParticipants.map(p => `${p.name} (${p.id})`));
  } else {
    console.log(`⚠️ No BYE - all fight`);
    fightingParticipants = [...participants];
  }

  // ⭐ STEP 2: Shuffle ONLY fighting participants
  const shuffledFighters = this.shuffleArray([...fightingParticipants]);
  console.log(`\n🔀 Shuffled fighters:`, shuffledFighters.map(p => `${p.name} (${p.id})`));

  // ⭐ STEP 3: Create FIGHTING matches
  console.log(`\n📝 Creating fighting matches...`);
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
      position: Math.floor(i / 2),
      participant1,
      participant2: participant2 || null,
      status: participant2 ? 'pending' : 'bye',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  ✅ Fighting Match ${match.id_match}: ${participant1.name} vs ${participant2?.name || 'BYE (odd)'}`);
  }

  // ⭐ STEP 4: Create BYE matches (AUTO GOLD)
  console.log(`\n🎁 Creating BYE matches (Auto GOLD)...`);
  
  for (const byeParticipant of byeParticipants) {
    console.log(`  📝 Creating BYE for ${byeParticipant.name} (${byeParticipant.id})`);
    
    const match = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: byeParticipant.id,
        id_peserta_b: null, // ⭐ NULL = BYE
        skor_a: 0,
        skor_b: 0
      }
    });
    
    console.log(`     ✅ BYE Match ${match.id_match} created`);
    
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
  }
  
  console.log(`\n✅ PEMULA bracket complete: ${matches.length} matches`);
  console.log(`   - Fighting: ${Math.ceil(shuffledFighters.length / 2)}`);
  console.log(`   - BYE: ${byeParticipants.length}\n`);
  
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
          venue: match.venue?.nama_venue
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
   * Update match result
   */
  static async updateMatch(matchId: number, winnerId: number, scoreA: number, scoreB: number): Promise<Match> {
    try {
      const updatedMatch = await prisma.tb_match.update({
        where: { id_match: matchId },
        data: {
          skor_a: scoreA,
          skor_b: scoreB
        },
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
          }
        }
      });

      // Advance winner to next round
      await this.advanceWinnerToNextRound(updatedMatch, winnerId);

      return {
        id: updatedMatch.id_match,
        round: updatedMatch.ronde,
        position: 0,
        participant1: updatedMatch.peserta_a ? this.transformParticipant(updatedMatch.peserta_a) : null,
        participant2: updatedMatch.peserta_b ? this.transformParticipant(updatedMatch.peserta_b) : null,
        winner: this.determineWinner(updatedMatch),
        scoreA: updatedMatch.skor_a,
        scoreB: updatedMatch.skor_b,
        status: this.determineMatchStatus(updatedMatch)
      };
    } catch (error: any) {
      console.error('Error updating match:', error);
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
  
  // Get all matches in current round
  const currentRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: currentRound
    },
    orderBy: { id_match: 'asc' }
  });

  // Get all matches in next round
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

  // Find current match position
  const currentMatchIndex = currentRoundMatches.findIndex(m => m.id_match === match.id_match);
  
  if (currentMatchIndex === -1) {
    console.error(`   ❌ Could not find current match in round matches`);
    return;
  }

  // ✅ Calculate which match in next round this winner goes to
  const nextMatchIndex = Math.floor(currentMatchIndex / 2);
  const nextMatch = nextRoundMatches[nextMatchIndex];

  if (!nextMatch) {
    console.error(`   ❌ Could not find next match at index ${nextMatchIndex}`);
    return;
  }

  // ✅ Determine slot (A or B) based on whether current match is even or odd
  const isFirstSlot = currentMatchIndex % 2 === 0;
  
  // ✅ CHECK if slot is already occupied (should NOT happen with correct logic)
  if (isFirstSlot) {
    if (nextMatch.id_peserta_a) {
      console.log(`   ⚠️ Slot A already occupied by participant ${nextMatch.id_peserta_a} - SKIPPING`);
      return; // Don't overwrite!
    }
    
    await prisma.tb_match.update({
      where: { id_match: nextMatch.id_match },
      data: { id_peserta_a: winnerId }
    });
    
    console.log(`   ✅ Winner ${winnerId} placed in Round ${nextRound} Match ${nextMatch.id_match} (Slot A)`);
  } else {
    if (nextMatch.id_peserta_b) {
      console.log(`   ⚠️ Slot B already occupied by participant ${nextMatch.id_peserta_b} - SKIPPING`);
      return; // Don't overwrite!
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
    participantIds?: number[] // ⭐ NEW PARAMETER
  ): Promise<Bracket> {
    try {
      // Delete existing bracket and all related data
      const existingBagan = await prisma.tb_bagan.findFirst({
        where: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        }
      });

      if (existingBagan) {
        // Delete matches first (due to foreign key constraints)
        await prisma.tb_match.deleteMany({
          where: { id_bagan: existingBagan.id_bagan }
        });

        // Delete drawing seeds
        await prisma.tb_drawing_seed.deleteMany({
          where: { id_bagan: existingBagan.id_bagan }
        });

        // Delete the bracket
        await prisma.tb_bagan.delete({
          where: { id_bagan: existingBagan.id_bagan }
        });
      }

      // ⭐ Generate new bracket with selected participants
      return await this.generateBracket(kompetisiId, kelasKejuaraanId, participantIds);
    } catch (error: any) {
      console.error('Error shuffling bracket:', error);
      throw new Error('Failed to shuffle bracket');
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
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  return Math.log2(nextPowerOf2);
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