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
  status: 'pending' | 'ongoing' | 'completed';
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
  
  /**
   * Generate bracket for a competition class
   */
  static async generateBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<Bracket> {
    try {
      // Check if bracket already exists
      const existingBagan = await prisma.tb_bagan.findFirst({
        where: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        }
      });

      if (existingBagan) {
        throw new Error('Bagan sudah dibuat untuk kelas kejuaraan ini');
      }

      // Get approved participants for this class
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
              kompetisi: true
            }
          }
        }
      });

      if (registrations.length < 2) {
        throw new Error('Minimal 2 peserta diperlukan untuk membuat bagan');
      }

      // Transform to participants
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

      // Shuffle participants for random seeding
      const shuffledParticipants = this.shuffleArray([...participants]);
      
      // Create bracket (bagan)
      const bagan = await prisma.tb_bagan.create({
        data: {
          id_kompetisi: kompetisiId,
          id_kelas_kejuaraan: kelasKejuaraanId
        }
      });

      // Generate seeding
      await Promise.all(
        shuffledParticipants.map((participant, index) =>
          prisma.tb_drawing_seed.create({
            data: {
              id_bagan: bagan.id_bagan,
              id_peserta_kompetisi: participant.id,
              seed_num: index + 1
            }
          })
        )
      );

      // Generate matches
      const matches = await this.generateMatches(bagan.id_bagan, shuffledParticipants);
      
      return {
        id: bagan.id_bagan,
        kompetisiId,
        kelasKejuaraanId,
        totalRounds: this.calculateTotalRounds(shuffledParticipants.length),
        isGenerated: true,
        participants: shuffledParticipants,
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
   * Generate tournament matches using existing schema
   */
  static async generateMatches(baganId: number, participants: Participant[]): Promise<Match[]> {
    const participantCount = participants.length;
    
    if (participantCount < 2) {
      throw new Error('At least 2 participants required for bracket');
    }

    // Calculate next power of 2
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    const totalRounds = Math.log2(nextPowerOf2);
    
    // Prepare participants with byes
    let currentParticipants = [...participants];
    while (currentParticipants.length < nextPowerOf2) {
      currentParticipants.push(null as any); // null represents bye
    }

    const matches: Match[] = [];

    // Generate first round matches
    for (let i = 0; i < currentParticipants.length; i += 2) {
      const participant1 = currentParticipants[i];
      const participant2 = currentParticipants[i + 1];
      
      // Create match in database
      const match = await prisma.tb_match.create({
        data: {
          id_bagan: baganId,
          ronde: 1,
          id_peserta_a: participant1?.id || null,
          id_peserta_b: participant2?.id || null,
          skor_a: 0,
          skor_b: 0
        }
      });

      matches.push({
        id: match.id_match,
        round: 1,
        position: Math.floor(i / 2) + 1,
        participant1: participant1 || null,
        participant2: participant2 || null,
        status: (participant1 && participant2) ? 'pending' : 'completed',
        winner: (!participant2) ? participant1 : null, // Auto-win for bye
        scoreA: match.skor_a,
        scoreB: match.skor_b
      });

      // If there's a bye (auto-win), update match immediately
      if (participant1 && !participant2) {
        await prisma.tb_match.update({
          where: { id_match: match.id_match },
          data: { skor_a: 1, skor_b: 0 }
        });
      }
    }

    // Generate subsequent rounds (empty matches)
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      
      for (let i = 0; i < matchesInRound; i++) {
        const match = await prisma.tb_match.create({
          data: {
            id_bagan: baganId,
            ronde: round,
            id_peserta_a: null,
            id_peserta_b: null,
            skor_a: 0,
            skor_b: 0
          }
        });

        matches.push({
          id: match.id_match,
          round,
          position: i + 1,
          participant1: null,
          participant2: null,
          status: 'pending',
          scoreA: 0,
          scoreB: 0
        });
      }
    }

    // Advance bye winners to next round
    await this.advanceByeWinners(baganId, matches.filter(m => m.winner));

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
      const matches: Match[] = bagan.match.map(match => ({
        id: match.id_match,
        round: match.ronde,
        position: 0, // Will be calculated based on round and order
        participant1: match.peserta_a ? this.transformParticipant(match.peserta_a) : null,
        participant2: match.peserta_b ? this.transformParticipant(match.peserta_b) : null,
        winner: this.determineWinner(match),
        scoreA: match.skor_a,
        scoreB: match.skor_b,
        status: this.determineMatchStatus(match),
        venue: match.venue?.nama_venue
      }));

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
    // Find next round match
    const nextRoundMatches = await prisma.tb_match.findMany({
      where: {
        id_bagan: match.id_bagan,
        ronde: match.ronde + 1
      },
      orderBy: { id_match: 'asc' }
    });

    if (nextRoundMatches.length > 0) {
      // Determine which match in next round this winner goes to
      const currentRoundMatches = await prisma.tb_match.findMany({
        where: {
          id_bagan: match.id_bagan,
          ronde: match.ronde
        },
        orderBy: { id_match: 'asc' }
      });

      const currentMatchIndex = currentRoundMatches.findIndex(m => m.id_match === match.id_match);
      const nextMatchIndex = Math.floor(currentMatchIndex / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];

      if (nextMatch) {
        const isFirstSlot = currentMatchIndex % 2 === 0;
        const updateData = isFirstSlot 
          ? { id_peserta_a: winnerId }
          : { id_peserta_b: winnerId };

        await prisma.tb_match.update({
          where: { id_match: nextMatch.id_match },
          data: updateData
        });
      }
    }
  }

  /**
   * Shuffle/regenerate bracket
   */
  static async shuffleBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<Bracket> {
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

      // Generate new bracket
      return await this.generateBracket(kompetisiId, kelasKejuaraanId);
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
    return Math.ceil(Math.log2(participantCount));
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
   * Export bracket to PDF (placeholder - will be implemented in controller)
   */
  static async exportBracketToPdf(kompetisiId: number, kelasKejuaraanId: number): Promise<Buffer> {
    // This will be implemented in the controller using a PDF library
    throw new Error('PDF export functionality will be implemented in controller');
  }
}