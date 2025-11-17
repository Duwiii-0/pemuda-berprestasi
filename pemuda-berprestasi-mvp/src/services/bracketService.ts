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
  
  // Public method for initial bracket creation (checks for existence)
  static async createBracket(
    kompetisiId: number, 
    kelasKejuaraanId: number,
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Bracket> {
    const existingBagan = await prisma.tb_bagan.findFirst({
      where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId }
    });

    if (existingBagan) {
      throw new Error('Bagan sudah dibuat untuk kelas kejuaraan ini');
    }

    return this._generateBracketInternal(kompetisiId, kelasKejuaraanId, undefined, dojangSeparation);
  }

  // Public method for shuffling any bracket (deletes and regenerates)
  static async shuffleBracket(
    kompetisiId: number, 
    kelasKejuaraanId: number,
    isPemula: boolean, // Added this parameter to differentiate Pemula/Prestasi for shuffle logic
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Bracket> {
    try {
      console.log(`\n🔀 Deleting and Regenerating ${isPemula ? 'PEMULA' : 'PRESTASI'} BRACKET...`);
      const existingBagan = await prisma.tb_bagan.findFirst({
        where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId }
      });

      if (existingBagan) {
        const hasScores = await prisma.tb_match.findFirst({ where: { id_bagan: existingBagan.id_bagan, OR: [{skor_a: {gt: 0}}, {skor_b: {gt: 0}}] }});
        if (hasScores) throw new Error('Tidak dapat shuffle! Ada pertandingan yang sudah memiliki skor.');
        
        await prisma.tb_match_audit.deleteMany({ where: { match: { id_bagan: existingBagan.id_bagan } } });
        await prisma.tb_match.deleteMany({ where: { id_bagan: existingBagan.id_bagan } });
        await prisma.tb_drawing_seed.deleteMany({ where: { id_bagan: existingBagan.id_bagan } });
        await prisma.tb_bagan.delete({ where: { id_bagan: existingBagan.id_bagan } });
        console.log(`   ✅ Bracket for kelas ${kelasKejuaraanId} deleted successfully.`);
      }

      // Regenerate by calling the internal method
      return this._generateBracketInternal(kompetisiId, kelasKejuaraanId, undefined, dojangSeparation);
    } catch (error: any) {
      console.error(`❌ Error shuffling bracket for kelas ${kelasKejuaraanId}:`, error);
      throw new Error(error.message || 'Gagal shuffle bracket');
    }
  }

  // Internal generation logic (renamed from generateBracket)
  private static async _generateBracketInternal(
    kompetisiId: number, 
    kelasKejuaraanId: number,
    byeParticipantIds?: number[],
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Bracket> {
    try {
      const registrations = await prisma.tb_peserta_kompetisi.findMany({
        where: { id_kelas_kejuaraan: kelasKejuaraanId, status: 'APPROVED' },
        include: {
          atlet: { include: { dojang: true } },
          anggota_tim: { include: { atlet: { include: { dojang: true } } } },
          kelas_kejuaraan: { include: { kompetisi: true, kategori_event: true } }
        }
      });

      if (registrations.length < 2) throw new Error('Minimal 2 peserta diperlukan untuk membuat bagan');

      const kategori = registrations[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
      const isPemula = kategori.includes('pemula');
      console.log(`📊 Category detected: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);

      const participants: Participant[] = registrations.map(reg => ({
        id: reg.id_peserta_kompetisi,
        name: reg.is_team ? `Tim ${reg.anggota_tim.map(m => m.atlet.nama_atlet).join(' & ')}` : reg.atlet!.nama_atlet,
        dojang: reg.is_team ? reg.anggota_tim[0]?.atlet?.dojang?.nama_dojang : reg.atlet!.dojang?.nama_dojang,
        atletId: reg.id_atlet,
        isTeam: reg.is_team,
        teamMembers: reg.is_team ? reg.anggota_tim.map(m => m.atlet.nama_atlet) : undefined
      }));

      const bagan = await prisma.tb_bagan.create({
        data: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId }
      });

      await Promise.all(participants.map((p, i) =>
        prisma.tb_drawing_seed.create({ data: { id_bagan: bagan.id_bagan, id_peserta_kompetisi: p.id, seed_num: i + 1 } })
      ));

      const matches = isPemula
        ? await this.generatePemulaBracket(bagan.id_bagan, participants, dojangSeparation)
        : await this.generatePrestasiBracket(bagan.id_bagan, participants, byeParticipantIds, dojangSeparation);
      
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
      console.error('Error in _generateBracketInternal:', error);
      throw new Error(error.message || 'Failed to generate bracket internally');
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
    const dojangGroups = this.groupByDojang(participants);
    const left: Participant[] = [];
    const right: Participant[] = [];
    const sortedDojangs = Array.from(dojangGroups.entries()).sort((a, b) => b[1].length - a[1].length);
    
    sortedDojangs.forEach(([dojang, members]) => {
      if (members.length === 1) {
        if (left.length <= right.length) left.push(members[0]);
        else right.push(members[0]);
      } else {
        if (mode === 'STRICT') {
          const mid = Math.ceil(members.length / 2);
          left.push(...members.slice(0, mid));
          right.push(...members.slice(mid));
        } else {
          if (left.length <= right.length) left.push(...members);
          else right.push(...members);
        }
      }
    });
    return [left, right];
  }

  static async generatePrestasiBracket(
    baganId: number,
    participants: Participant[],
    byeParticipantIds?: number[],
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Match[]> {
    const matches: Match[] = [];
    const participantCount = participants.length;

    if (participantCount < 2) throw new Error("Minimal 2 peserta diperlukan untuk bracket prestasi");
    if (participantCount === 2) {
      const shuffled = this.shuffleArray([...participants]);
      const finalMatch = await prisma.tb_match.create({ data: { id_bagan: baganId, ronde: 1, id_peserta_a: shuffled[0].id, id_peserta_b: shuffled[1].id, skor_a: 0, skor_b: 0 } });
      matches.push({ id: finalMatch.id_match, round: 1, position: 0, participant1: shuffled[0], participant2: shuffled[1], status: "pending", scoreA: 0, scoreB: 0 });
      return matches;
    }
    if (participantCount === 3) {
      const shuffled = this.shuffleArray([...participants]);
      const r1Match = await prisma.tb_match.create({ data: { id_bagan: baganId, ronde: 1, id_peserta_a: shuffled[0].id, id_peserta_b: shuffled[1].id, skor_a: 0, skor_b: 0 } });
      matches.push({ id: r1Match.id_match, round: 1, position: 0, participant1: shuffled[0], participant2: shuffled[1], status: "pending", scoreA: 0, scoreB: 0 });
      const finalMatch = await prisma.tb_match.create({ data: { id_bagan: baganId, ronde: 2, id_peserta_a: shuffled[2].id, id_peserta_b: null, skor_a: 0, skor_b: 0 } });
      matches.push({ id: finalMatch.id_match, round: 2, position: 0, participant1: shuffled[2], participant2: null, status: "pending", scoreA: 0, scoreB: 0 });
      return matches;
    }

    const targetSize = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    const byesNeeded = targetSize - participantCount;
    const totalMatchesR1 = targetSize / 2;
    
    let byeParticipants: Participant[] = [];
    let activeParticipants: Participant[] = [...participants];

    if (byeParticipantIds && byeParticipantIds.length > 0) {
      byeParticipants = participants.filter(p => byeParticipantIds.includes(p.id));
      activeParticipants = participants.filter(p => !byeParticipantIds.includes(p.id));
    } else if (byesNeeded > 0) {
      const shuffled = this.shuffleArray([...participants]);
      byeParticipants = shuffled.slice(0, byesNeeded);
      activeParticipants = shuffled.slice(byesNeeded);
    }

    let leftPool: Participant[] = [];
    let rightPool: Participant[] = [];
    
    if (dojangSeparation?.enabled) {
      [leftPool, rightPool] = this.distributeDojangSeparated(activeParticipants, dojangSeparation.mode);
      leftPool = this.shuffleArray(leftPool);
      rightPool = this.shuffleArray(rightPool);
    } else {
      const shuffledActive = this.shuffleArray([...activeParticipants]);
      const mid = Math.ceil(shuffledActive.length / 2);
      leftPool = shuffledActive.slice(0, mid);
      rightPool = shuffledActive.slice(mid);
    }

    const byePositions = this.distributeBYEForMirroredBracket(participantCount, targetSize);
    const allPositions = Array.from({ length: totalMatchesR1 }, (_, i) => i);
    const fightPositions = allPositions.filter(pos => !byePositions.includes(pos));
    const distributedFightPositions = this.distributeFightPositions(fightPositions, totalMatchesR1);

    const halfSize = totalMatchesR1 / 2;
    let leftIndex = 0;
    let rightIndex = 0;
    let byeIndex = 0;

    const allSortedPositions = [...byePositions, ...distributedFightPositions].sort((a, b) => a - b);

    for (const pos of allSortedPositions) {
      let p1: Participant | null = null;
      let p2: Participant | null = null;
      let status: Match["status"] = "pending";

      if (byePositions.includes(pos)) {
        if (byeIndex < byeParticipants.length) {
          p1 = byeParticipants[byeIndex++];
          status = "bye";
        }
      } else {
        const isLeftSide = pos < halfSize;
        if (isLeftSide) {
          p1 = leftPool[leftIndex++] || null;
          p2 = leftPool[leftIndex++] || null;
        } else {
          p1 = rightPool[rightIndex++] || null;
          p2 = rightPool[rightIndex++] || null;
        }
        if (p1 && !p2) status = "bye";
      }

      const created = await prisma.tb_match.create({
        data: { id_bagan: baganId, ronde: 1, id_peserta_a: p1?.id || null, id_peserta_b: p2?.id || null, skor_a: 0, skor_b: 0 },
      });
      matches.push({ id: created.id_match, round: 1, position: pos, participant1: p1, participant2: p2, status, scoreA: 0, scoreB: 0 });
    }

    const totalRounds = Math.log2(targetSize);
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        const created = await prisma.tb_match.create({
          data: { id_bagan: baganId, ronde: round, id_peserta_a: null, id_peserta_b: null, skor_a: 0, skor_b: 0 },
        });
        matches.push({ id: created.id_match, round, position: i, participant1: null, participant2: null, status: "pending", scoreA: 0, scoreB: 0 });
      }
    }

    const createdR1Matches = matches.filter(m => m.round === 1);
    for (const m of createdR1Matches) {
      if (m.participant1 && !m.participant2 && m.id) {
        await this.advanceWinnerToNextRound({ id_bagan: baganId, ronde: 1, id_match: m.id }, m.participant1.id);
      }
    }

    return matches;
  }
  
  static getBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<Bracket | null> {
    return prisma.tb_bagan.findFirst({
      where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId },
      include: {
        drawing_seed: { include: { peserta_kompetisi: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: { include: { dojang: true } } } } } }, orderBy: { seed_num: 'asc' } }, 
        match: { include: { peserta_a: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: { include: { dojang: true } } } } } }, peserta_b: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: { include: { dojang: true } } } } } }, venue: true }, orderBy: [{ ronde: 'asc' }, { id_match: 'asc' }] }
      }
    }).then(bagan => {
      if (!bagan) return null;
      const participants: Participant[] = bagan.drawing_seed.map(seed => {
        const reg = seed.peserta_kompetisi;
        if (reg.is_team && reg.anggota_tim?.length > 0) {
          return { id: reg.id_peserta_kompetisi, name: `Tim ${reg.anggota_tim.map((m: any) => m.atlet.nama_atlet).join(' & ')}`, dojang: reg.anggota_tim[0]?.atlet?.dojang?.nama_dojang, isTeam: true, teamMembers: reg.anggota_tim.map((m: any) => m.atlet.nama_atlet) };
        } else if (reg.atlet) {
          return { id: reg.id_peserta_kompetisi, name: reg.atlet.nama_atlet, dojang: reg.atlet.dojang?.nama_dojang, atletId: reg.atlet.id_atlet, isTeam: false };
        }
        return null;
      }).filter(Boolean) as Participant[];
      const matches: Match[] = bagan.match.map(match => ({
        id: match.id_match, round: match.ronde, position: 0, participant1: match.peserta_a ? this.transformParticipant(match.peserta_a) : null, participant2: match.peserta_b ? this.transformParticipant(match.peserta_b) : null, winner: this.determineWinner(match), scoreA: match.skor_a, scoreB: match.skor_b, status: (!!match.peserta_a && !match.peserta_b) || (!match.peserta_a && !!match.peserta_b) ? 'bye' : this.determineMatchStatus(match), venue: match.venue?.nama_venue, tanggalPertandingan: match.tanggal_pertandingan, nomorPartai: match.nomor_partai, nomorAntrian: match.nomor_antrian, nomorLapangan: match.nomor_lapangan
      }));
      return { id: bagan.id_bagan, kompetisiId, kelasKejuaraanId, totalRounds: Math.max(...matches.map(m => m.round)), isGenerated: true, participants, matches };
    }).catch(error => {
      console.error('Error getting bracket:', error);
      throw new Error('Failed to get bracket');
    });
  }

  static async updateMatch(matchId: number, winnerId?: number | null, scoreA?: number | null, scoreB?: number | null, tanggalPertandingan?: Date | null, nomorAntrian?: number | null, nomorLapangan?: string | null): Promise<Match> {
    try {
      const updateData: any = {};
      const isResultUpdate = winnerId !== undefined && winnerId !== null;
      if (isResultUpdate) { updateData.skor_a = scoreA; updateData.skor_b = scoreB; }
      if (tanggalPertandingan !== undefined) updateData.tanggal_pertandingan = tanggalPertandingan;
      if (nomorAntrian !== undefined) updateData.nomor_antrian = nomorAntrian;
      if (nomorLapangan !== undefined) updateData.nomor_lapangan = nomorLapangan;
      if (nomorAntrian !== null && nomorAntrian !== undefined && nomorLapangan !== null && nomorLapangan !== undefined) updateData.nomor_partai = `${nomorAntrian}${nomorLapangan}`;
      else if (nomorAntrian === null && nomorLapangan === null) updateData.nomor_partai = null;

      const updatedMatch = await prisma.tb_match.update({
        where: { id_match: matchId }, data: updateData, include: {
          peserta_a: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: { include: { dojang: true } } } } }, },
          peserta_b: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: { include: { dojang: true } } } } }, venue: true
        }
      });
      if (isResultUpdate && winnerId) await this.advanceWinnerToNextRound(updatedMatch, winnerId);

      return {
        id: updatedMatch.id_match, round: updatedMatch.ronde, position: 0,
        participant1: updatedMatch.peserta_a ? this.transformParticipant(updatedMatch.peserta_a) : null,
        participant2: updatedMatch.peserta_b ? this.transformParticipant(updatedMatch.peserta_b) : null,
        winner: this.determineWinner(updatedMatch), scoreA: updatedMatch.skor_a, scoreB: updatedMatch.skor_b,
        status: this.determineMatchStatus(updatedMatch), tanggalPertandingan: updatedMatch.tanggal_pertandingan,
        nomorPartai: updatedMatch.nomor_partai, nomorAntrian: updatedMatch.nomor_antrian, nomorLapangan: updatedMatch.nomor_lapangan
      };
    } catch (error: any) {
      console.error('❌ Error updating match:', error);
      throw new Error('Failed to update match');
    }
  }

  static async advanceWinnerToNextRound(match: any, winnerId: number): Promise<void> {
    const currentRound = match.ronde;
    const nextRound = currentRound + 1;
    const bagan = await prisma.tb_bagan.findUnique({ where: { id_bagan: match.id_bagan }, include: { kelas_kejuaraan: { include: { kategori_event: true } } } });
    const isPemula = bagan?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
    
    if (isPemula && currentRound === 1) {
      const round1Matches = await prisma.tb_match.findMany({ where: { id_bagan: match.id_bagan, ronde: 1 }, orderBy: { id_match: 'asc' } });
      const round2Match = await prisma.tb_match.findFirst({ where: { id_bagan: match.id_bagan, ronde: 2 } });
      const byeMatch = round1Matches.find(m => m.id_peserta_a && !m.id_peserta_b);
      
      if (round2Match && byeMatch) {
        const lastNormalFightMatch = round1Matches.find(m => m.id_match !== byeMatch.id_match && m.id_peserta_a && m.id_peserta_b);
        if (match.id_match === lastNormalFightMatch?.id_match) {
          await prisma.tb_match.update({ where: { id_match: round2Match.id_match }, data: { id_peserta_a: winnerId } });
        }
      }
      return;
    }

    const currentRoundMatches = await prisma.tb_match.findMany({ where: { id_bagan: match.id_bagan, ronde: currentRound }, orderBy: { id_match: 'asc' } });
    const nextRoundMatches = await prisma.tb_match.findMany({ where: { id_bagan: match.id_bagan, ronde: nextRound }, orderBy: { id_match: 'asc' } });
    if (nextRoundMatches.length === 0) return;

    const currentMatchIndex = currentRoundMatches.findIndex(m => m.id_match === match.id_match);
    const nextMatch = nextRoundMatches[Math.floor(currentMatchIndex / 2)];

    if (!nextMatch) return;

    if (currentMatchIndex % 2 === 0) { // First slot in the next match
      if (nextMatch.id_peserta_a) return;
      await prisma.tb_match.update({ where: { id_match: nextMatch.id_match }, data: { id_peserta_a: winnerId } });
    } else { // Second slot in the next match
      if (nextMatch.id_peserta_b) return;
      await prisma.tb_match.update({ where: { id_match: nextMatch.id_match }, data: { id_peserta_b: winnerId } });
    }
  }

  static calculateTotalRounds(participantCount: number, isPemula: boolean): number {
    if (isPemula) return participantCount % 2 === 1 && participantCount > 1 ? 2 : 1;
    if (participantCount < 2) return 0;
    if (participantCount <= 4) return 2;
    return Math.ceil(Math.log2(participantCount));
  }
  
  static transformParticipant(participant: any): Participant {
    if (participant.is_team && participant.anggota_tim?.length > 0) {
      return { id: participant.id_peserta_kompetisi, name: `Tim ${participant.anggota_tim.map((m: any) => m.atlet.nama_atlet).join(' & ')}`, dojang: participant.anggota_tim[0]?.atlet?.dojang?.nama_dojang, isTeam: true, teamMembers: participant.anggota_tim.map((m: any) => m.atlet.nama_atlet) };
    } else if (participant.atlet) {
      return { id: participant.id_peserta_kompetisi, name: participant.atlet.nama_atlet, dojang: participant.atlet.dojang?.nama_dojang, atletId: participant.atlet.id_atlet, isTeam: false };
    }
    throw new Error('Invalid participant data');
  }

  static determineWinner(match: any): Participant | null {
    if (match.skor_a > match.skor_b && match.peserta_a) return this.transformParticipant(match.peserta_a);
    else if (match.skor_b > match.skor_a && match.peserta_b) return this.transformParticipant(match.peserta_b);
    return null;
  }
  
  static determineMatchStatus(match: any): 'pending' | 'ongoing' | 'completed' {
    if (match.skor_a > 0 || match.skor_b > 0) return 'completed';
    if (match.peserta_a && match.peserta_b) return 'pending';
    return 'pending';
  }

  static async clearMatchResults(kompetisiId: number, kelasKejuaraanId: number): Promise<{ success: boolean; message: string; clearedMatches: number; }> {
    try {
      const bagan = await prisma.tb_bagan.findFirst({
        where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId },
        include: { kelas_kejuaraan: { include: { kategori_event: true } }, match: true }
      });
      if (!bagan) throw new Error('Bagan tidak ditemukan');

      const isPemula = bagan.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;
      const updatePromises = bagan.match.map(match => {
        if (match.ronde === 1) return prisma.tb_match.update({ where: { id_match: match.id_match }, data: { skor_a: 0, skor_b: 0 } });
        else if (isPemula && match.ronde === 2) return prisma.tb_match.update({ where: { id_match: match.id_match }, data: { skor_a: 0, skor_b: 0, id_peserta_a: null } });
        else return prisma.tb_match.update({ where: { id_match: match.id_match }, data: { skor_a: 0, skor_b: 0, id_peserta_a: null, id_peserta_b: null } });
      });
      await Promise.all(updatePromises);
      return { success: true, message: `Berhasil mereset ${bagan.match.length} pertandingan`, clearedMatches: bagan.match.length };
    } catch (error: any) {
      console.error('❌ Error clearing match results:', error);
      throw new Error(error.message || 'Gagal mereset hasil pertandingan');
    }
  }

  static async deleteBracket(kompetisiId: number, kelasKejuaraanId: number): Promise<{ success: boolean; message: string; deletedItems: { matches: number; seeds: number; bracket: boolean; }; }> {
    try {
      const bagan = await prisma.tb_bagan.findFirst({
        where: { id_kompetisi: kompetisiId, id_kelas_kejuaraan: kelasKejuaraanId },
        include: { match: true, drawing_seed: true }
      });
      if (!bagan) throw new Error('Bagan tidak ditemukan');

      await prisma.tb_match_audit.deleteMany({ where: { match: { id_bagan: bagan.id_bagan } } });
      await prisma.tb_match.deleteMany({ where: { id_bagan: bagan.id_bagan } });
      await prisma.tb_drawing_seed.deleteMany({ where: { id_bagan: bagan.id_bagan } });
      await prisma.tb_bagan.delete({ where: { id_bagan: bagan.id_bagan } });
      return { success: true, message: 'Bracket berhasil dihapus', deletedItems: { matches: bagan.match.length, seeds: bagan.drawing_seed.length, bracket: true } };
    } catch (error: any) {
      console.error('❌ Error deleting bracket:', error);
      throw new Error(error.message || 'Gagal menghapus bracket');
    }
  }
}