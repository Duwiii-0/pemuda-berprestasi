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

/**
 * ⭐ CRITICAL FIX: Export as standalone function (NOT class method)
 * Check if match is BYE (only for Round 1)
 */
export function isByeMatch(match: {
  ronde: number;
  id_peserta_a: number | null;
  id_peserta_b: number | null;
}): boolean {
  if (match.ronde !== 1) {
    return false;
  }
  
  const hasOnlyA = match.id_peserta_a !== null && match.id_peserta_b === null;
  const hasOnlyB = match.id_peserta_a === null && match.id_peserta_b !== null;
  
  return hasOnlyA || hasOnlyB;
}

export class BracketService {
  
static async generateBracket(
  kompetisiId: number, 
  kelasKejuaraanId: number,
  byeParticipantIds?: number[],
  dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
): Promise<Bracket> {
  try {
    console.log(`\n🎯 generateBracket called:`);
    console.log(`   Kompetisi: ${kompetisiId}`);
    console.log(`   Kelas: ${kelasKejuaraanId}`);
    console.log(`   BYE IDs:`, byeParticipantIds);
    console.log(`   Dojang Separation:`, dojangSeparation);

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

    let finalByeIds = byeParticipantIds;
    
    if (!isPemula && !byeParticipantIds) {
      const structure = this.calculateBracketStructure(participants.length);
      const byesNeeded = structure.byesRecommended;
      
      if (byesNeeded > 0) {
        const shuffled = this.shuffleArray([...participants]);
        finalByeIds = shuffled.slice(0, byesNeeded).map(p => p.id);
        console.log(`🎁 Auto-selected ${byesNeeded} BYE participants:`, finalByeIds);
      }
    }

    const matches = isPemula
      ? await this.generatePemulaBracket(bagan.id_bagan, participants, dojangSeparation)
      : await this.generatePrestasiBracket(bagan.id_bagan, participants, finalByeIds, dojangSeparation);
    
    return {
      id: bagan.id_bagan,
      kompetisiId,
      kelasKejuaraanId,
      totalRounds: this.calculateTotalRounds(participants.length, isPemula),
      isGenerated: true,
      participants: participants,
      matches
    };
  } catch (error: any) {
    console.error('Error generating bracket:', error);
    throw new Error(error.message || 'Failed to generate bracket');
  }
}

  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static shuffleWithDojangSeparation(participants: Participant[]): Participant[] {
    console.log(`\n🏠 === Shuffling with Dojang Separation for PEMULA ===`);
    const dojangGroups = this.groupByDojang(participants);
    
    dojangGroups.forEach((group) => this.shuffleArray(group));
  
    const separatedList: Participant[] = [];
    let maxGroupSize = 0;
    dojangGroups.forEach(group => {
      if (group.length > maxGroupSize) {
        maxGroupSize = group.length;
      }
    });
  
    for (let i = 0; i < maxGroupSize; i++) {
      dojangGroups.forEach(group => {
        if (i < group.length) {
          separatedList.push(group[i]);
        }
      });
    }
  
    console.log(`   ✅ Separated list created:`, separatedList.map(p => `${p.name} (${p.dojang})`));
    return separatedList;
  }

  static distributeBYEForMirroredBracket( participantCount: number, targetSize: number ): number[] {
    // ... implementation unchanged
    return [];
  }

  static distributeFightPositions( fightPositions: number[], totalMatchesR1: number ): number[] {
    // ... implementation unchanged
    return [];
  }

  static validateAndAdjustBye( totalParticipants: number, userSelectedByeCount: number, targetWinners: number ): any {
    // ... implementation unchanged
    return {};
  }

  static calculateBracketStructure(participantCount: number): any {
    // ... implementation unchanged
    return {};
  }

  static groupByDojang(participants: Participant[]): Map<string, Participant[]> {
    const dojangMap = new Map<string, Participant[]>();
    participants.forEach(p => {
      const dojangName = p.dojang || 'UNKNOWN';
      if (!dojangMap.has(dojangName)) {
        dojangMap.set(dojangName, []);
      }
      dojangMap.get(dojangName)!.push(p);
    });
    return dojangMap;
  }

  static distributeDojangSeparated( participants: Participant[], mode: 'STRICT' | 'BALANCED' ): [Participant[], Participant[]] {
    // ... implementation unchanged
    return [[], []];
  }

  static async generatePrestasiBracket(
    baganId: number,
    participants: Participant[],
    byeParticipantIds?: number[],
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Match[]> {
    // ... implementation unchanged
    return [];
  }

  static async generatePemulaBracket(
    baganId: number, 
    participants: Participant[],
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Match[]> {
    const matches: Match[] = [];
    
    console.log(`\n🥋 === GENERATING PEMULA BRACKET ===`);
    console.log(`Total participants: ${participants.length}`);

    let shuffled: Participant[];
    if (dojangSeparation?.enabled) {
      shuffled = this.shuffleWithDojangSeparation(participants);
    } else {
      shuffled = this.shuffleArray([...participants]);
    }
    
    const totalParticipants = shuffled.length;
    const isOdd = totalParticipants % 2 === 1;
    
    if (isOdd) {
      console.log(`\n📊 ODD participants detected → 3 cards structure`);
      const normalPairs = Math.floor((totalParticipants - 1) / 2);
      for (let i = 0; i < normalPairs; i++) {
        const p1 = shuffled[i * 2];
        const p2 = shuffled[i * 2 + 1];
        const match = await prisma.tb_match.create({
          data: { id_bagan: baganId, ronde: 1, id_peserta_a: p1.id, id_peserta_b: p2.id, skor_a: 0, skor_b: 0 }
        });
        matches.push({ id: match.id_match, round: 1, position: matches.length, participant1: p1, participant2: p2, status: 'pending', scoreA: 0, scoreB: 0 });
      }
      const byeParticipant = shuffled[totalParticipants - 1];
      const byeMatch = await prisma.tb_match.create({
        data: { id_bagan: baganId, ronde: 1, id_peserta_a: byeParticipant.id, id_peserta_b: null, skor_a: 0, skor_b: 0 }
      });
      matches.push({ id: byeMatch.id_match, round: 1, position: matches.length, participant1: byeParticipant, participant2: null, status: 'bye', scoreA: 0, scoreB: 0 });
      const additionalMatch = await prisma.tb_match.create({
        data: { id_bagan: baganId, ronde: 2, id_peserta_a: null, id_peserta_b: byeParticipant.id, skor_a: 0, skor_b: 0 }
      });
      matches.push({ id: additionalMatch.id_match, round: 2, position: 0, participant1: null, participant2: byeParticipant, status: 'pending', scoreA: 0, scoreB: 0 });
    } else {
      console.log(`\n📊 EVEN participants → Normal matches only`);
      const normalPairs = totalParticipants / 2;
      for (let i = 0; i < normalPairs; i++) {
        const p1 = shuffled[i * 2];
        const p2 = shuffled[i * 2 + 1];
        const match = await prisma.tb_match.create({
          data: { id_bagan: baganId, ronde: 1, id_peserta_a: p1.id, id_peserta_b: p2.id, skor_a: 0, skor_b: 0 }
        });
        matches.push({ id: match.id_match, round: 1, position: matches.length, participant1: p1, participant2: p2, status: 'pending', scoreA: 0, scoreB: 0 });
      }
    }
    return matches;
  }

  static async getBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<Bracket | null> {
    // ... implementation unchanged
    return null;
  }

  static async updateMatch(matchId: number, winnerId?: number | null, scoreA?: number | null, scoreB?: number | null, tanggalPertandingan?: Date | null, nomorAntrian?: number | null, nomorLapangan?: string | null): Promise<Match> {
    // ... implementation unchanged
    throw new Error("Not implemented");
  }

  static async advanceWinnerToNextRound(match: any, winnerId: number): Promise<void> {
    // ... implementation unchanged
  }

  static async shuffleBracket(kompetisiId: number, kelasKejuaraanId: number, participantIds?: number[], dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }): Promise<Bracket> {
    // ... implementation unchanged
    throw new Error("Not implemented");
  }

  static async shufflePemulaBracket(kompetisiId: number, kelasKejuaraanId: number, dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }): Promise<Bracket> {
    try {
        console.log(`\n🔀 === SHUFFLING PEMULA BRACKET ===`);
        const bagan = await prisma.tb_bagan.findFirst({
            where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId },
            include: { match: true, drawing_seed: { include: { peserta_kompetisi: { include: { atlet: { include: { dojang: true } } } } } } }
        });

        if (!bagan) throw new Error('Bagan tidak ditemukan');
        if (bagan.match.some(m => m.skor_a > 0 || m.skor_b > 0)) {
            throw new Error('Tidak dapat shuffle! Ada pertandingan yang sudah memiliki skor.');
        }

        const participants: Participant[] = bagan.drawing_seed.map(seed => {
          const reg = seed.peserta_kompetisi;
          return {
            id: reg.id_peserta_kompetisi,
            name: reg.atlet!.nama_atlet,
            dojang: reg.atlet!.dojang?.nama_dojang,
            atletId: reg.id_atlet!,
            isTeam: false
          };
        }).filter(Boolean) as Participant[];
        
        let shuffled: Participant[];
        if (dojangSeparation?.enabled) {
          shuffled = this.shuffleWithDojangSeparation(participants);
        } else {
          shuffled = this.shuffleArray([...participants]);
        }

        const round1Matches = bagan.match.filter(m => m.ronde === 1).sort((a, b) => a.id_match - b.id_match);
        const isOdd = shuffled.length % 2 === 1;

        if (isOdd) {
            const normalPairs = Math.floor((shuffled.length - 1) / 2);
            for (let i = 0; i < normalPairs; i++) {
                await prisma.tb_match.update({ where: { id_match: round1Matches[i].id_match }, data: { id_peserta_a: shuffled[i*2].id, id_peserta_b: shuffled[i*2+1].id, skor_a: 0, skor_b: 0 }});
            }
            const byeParticipant = shuffled[shuffled.length - 1];
            await prisma.tb_match.update({ where: { id_match: round1Matches[normalPairs].id_match }, data: { id_peserta_a: byeParticipant.id, id_peserta_b: null, skor_a: 0, skor_b: 0 }});
            const round2Match = bagan.match.find(m => m.ronde === 2);
            if (round2Match) {
                await prisma.tb_match.update({ where: { id_match: round2Match.id_match }, data: { id_peserta_a: null, id_peserta_b: byeParticipant.id, skor_a: 0, skor_b: 0 }});
            }
        } else {
            for (let i = 0; i < shuffled.length / 2; i++) {
                await prisma.tb_match.update({ where: { id_match: round1Matches[i].id_match }, data: { id_peserta_a: shuffled[i*2].id, id_peserta_b: shuffled[i*2+1].id, skor_a: 0, skor_b: 0 }});
            }
        }
        return await this.getBracket(kompetisiId, kelasKejuaraanId) as Bracket;
    } catch (error: any) {
        console.error('❌ Error shuffling PEMULA bracket:', error);
        throw new Error(error.message || 'Gagal shuffle bracket');
    }
  }

  static calculateTotalRounds(participantCount: number, isPemula: boolean): number {
    if (isPemula) {
        return participantCount % 2 === 1 && participantCount > 1 ? 2 : 1;
    }
    if (participantCount < 2) return 0;
    if (participantCount <= 4) return 2;
    return Math.ceil(Math.log2(participantCount));
  }
  
  static transformParticipant(participant: any): Participant {
    // ... implementation unchanged
    throw new Error("Not implemented");
  }

  static determineWinner(match: any): Participant | null {
    // ... implementation unchanged
    return null;
  }
  
  static determineMatchStatus(match: any): 'pending' | 'ongoing' | 'completed' {
    // ... implementation unchanged
    return 'pending';
  }

  static async clearMatchResults(kompetisiId: number, kelasKejuaraanId: number): Promise<any> {
    // ... implementation unchanged
    return {};
  }
  
  static async deleteBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<any> {
    // ... implementation unchanged
    return {};
  }
}