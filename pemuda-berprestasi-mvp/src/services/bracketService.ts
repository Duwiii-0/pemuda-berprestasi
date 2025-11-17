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
  byeParticipantIds?: number[]
): Promise<any> {
  console.log(`🎯 generateBracket called:`);
  console.log(`   Kompetisi: ${kompetisiId}`);
  console.log(`   Kelas: ${kelasKejuaraanId}`);
  console.log(`   BYE IDs:`, byeParticipantIds);

  // Check if bracket already exists
  const existingBagan = await prisma.tb_bagan.findFirst({
    where: {
      id_kompetisi: kompetisiId,
      id_kelas_kejuaraan: kelasKejuaraanId
    }
  });

  if (existingBagan) {
    throw new Error('Bagan sudah ada untuk kelas kejuaraan ini');
  }

  // Get approved participants
  const registrations = await prisma.tb_peserta_kompetisi.findMany({
    where: {
      id_kelas_kejuaraan: kelasKejuaraanId,
      status: 'APPROVED'
    },
    include: {
      atlet: true,
      anggota_tim: {
        include: {
          atlet: true
        }
      },
      kelas_kejuaraan: {
        include: {
          kategori_event: true
        }
      }
    }
  });

  if (registrations.length === 0) {
    throw new Error('Tidak ada peserta yang disetujui untuk kelas ini');
  }

  const participantCount = registrations.length;
  console.log(`📊 Total participants: ${participantCount}`);

  // Detect category
  const kategori = registrations[0]?.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
  const isPemula = kategori.includes('pemula');
  console.log(`📊 Category detected: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);

  // Calculate bracket structure
  const bracketStructure = BracketService.calculateBracketStructure(participantCount);

  // Create bagan
  const bagan = await prisma.tb_bagan.create({
    data: {
      id_kompetisi: kompetisiId,
      id_kelas_kejuaraan: kelasKejuaraanId
    }
  });

  // ⭐ CREATE ALL MATCHES WITH POSITION
  const allMatches: any[] = [];
  
  for (let round of bracketStructure) {
    console.log(`\n   📍 Creating ${round.matchCount} matches for ${round.name}...`);
    
    for (let i = 0; i < round.matchCount; i++) {
      const matchData = {
        id_bagan: bagan.id_bagan,
        ronde: round.round,
        position: i,  // ⭐ SET POSITION = INDEX
        id_peserta_a: null,
        id_peserta_b: null,
        skor_a: 0,
        skor_b: 0
      };
      
      const match = await prisma.tb_match.create({
        data: matchData
      });
      
      allMatches.push(match);
      console.log(`      ✅ Match created - Round ${round.round} Position ${i} (ID: ${match.id_match})`);
    }
  }

  console.log(`\n   ✅ Total ${allMatches.length} matches created`);

  // Update bracket status
  await prisma.tb_kelas_kejuaraan.update({
    where: { id_kelas_kejuaraan: kelasKejuaraanId },
    data: { bracket_status: 'created' }
  });

  // ⭐ POPULATE MATCHES BASED ON CATEGORY
  if (isPemula) {
    await BracketService.populatePemulaBracket(
      bagan.id_bagan,
      registrations,
      allMatches,
      bracketStructure
    );
  } else {
    await BracketService.populatePrestasiMatches(
      bagan.id_bagan,
      registrations,
      allMatches,
      bracketStructure,
      byeParticipantIds
    );
  }

  // Return bracket data
  const bracket = await BracketService.getBracket(kompetisiId, kelasKejuaraanId);

  console.log(`✅ Bracket generated with ${allMatches.length} matches`);

  return bracket;
}

static async populatePrestasiMatches(
  baganId: number,
  registrations: any[],
  allMatches: any[],
  bracketStructure: any[],
  byeParticipantIds?: number[]
): Promise<void> {
  const participantCount = registrations.length;
  
  // ✅ FIX: Get LAST round (actual Round 1)
  const firstRound = bracketStructure[bracketStructure.length - 1];
  const targetSize = firstRound.participants;
  const byesNeeded = targetSize - participantCount;

  console.log(`📊 PRESTASI: participants=${participantCount}, targetSize=${targetSize}, byesNeeded=${byesNeeded}`);

  // Get Round 1 matches (using firstRound.round number)
  const r1Matches = allMatches
    .filter(m => m.ronde === firstRound.round)
    .sort((a, b) => a.position - b.position);
  
  console.log(`   Total R1 matches: ${r1Matches.length}`);

  // Auto-select BYE if not provided
  let byeIds = byeParticipantIds;
  if (!byeIds || byeIds.length === 0) {
    const shuffled = [...registrations].sort(() => Math.random() - 0.5);
    byeIds = shuffled.slice(0, byesNeeded).map(r => r.id_peserta_kompetisi);
    console.log(`🎁 Auto-selected ${byesNeeded} BYE participants:`, byeIds);
  }

  console.log(`   Using provided BYE IDs:`, byeIds);

  // Distribute BYEs
  const byePositions = BracketService.distributeBYEs(r1Matches.length, byesNeeded);
  console.log(`   📊 Final BYE Positions:`, byePositions);

  // Get non-BYE participants
  const activeParticipants = registrations.filter(r => !byeIds.includes(r.id_peserta_kompetisi));
  const byeParticipants = registrations.filter(r => byeIds.includes(r.id_peserta_kompetisi));

  // Shuffle active participants
  const shuffledActive = [...activeParticipants].sort(() => Math.random() - 0.5);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   🧩 BYE positions:`, byePositions);
  
  // Determine fight positions
  const fightPositions = Array.from({ length: r1Matches.length }, (_, i) => i)
    .filter(pos => !byePositions.includes(pos));
  
  console.log(`   ⚔️ FIGHT positions (before distribution):`, fightPositions);

  // Balance fights between left and right
  const halfSize = r1Matches.length / 2;
  const leftFights = fightPositions.filter(p => p < halfSize);
  const rightFights = fightPositions.filter(p => p >= halfSize);

  console.log(`   📐 Original fight distribution:`);
  console.log(`      LEFT fights (${leftFights.length}):`, leftFights);
  console.log(`      RIGHT fights (${rightFights.length}):`, rightFights);

  let balancedFightPositions = fightPositions;
  
  if (Math.abs(leftFights.length - rightFights.length) > 1) {
    console.log(`   ⚠️ Fights unbalanced - rebalancing...`);
    balancedFightPositions = BracketService.balanceFights(fightPositions, halfSize);
  } else {
    console.log(`   ✅ Fight distribution already balanced!`);
  }

  console.log(`   ✅ FIGHT positions (after distribution):`, balancedFightPositions);

  // Populate matches
  let activeIndex = 0;
  let byeIndex = 0;

  for (let i = 0; i < r1Matches.length; i++) {
    const match = r1Matches[i];
    const isByePosition = byePositions.includes(i);

    if (isByePosition) {
      // BYE match
      const byeParticipant = byeParticipants[byeIndex++];
      
      await prisma.tb_match.update({
        where: { id_match: match.id_match },
        data: {
          id_peserta_a: byeParticipant.id_peserta_kompetisi,
          id_peserta_b: null
        }
      });

      const name = byeParticipant.is_team
        ? byeParticipant.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ')
        : byeParticipant.atlet?.nama_atlet;

      console.log(`   🎮 R1 match position ${i}: ${name} vs BYE (bye)`);

      // ⭐ AUTO-ADVANCE BYE WINNER
      await BracketService.advanceWinnerToNextRound(match, byeParticipant.id_peserta_kompetisi);
      console.log(`   ⚡ Auto-advanced BYE winner ${name}`);

    } else {
      // Normal fight
      const p1 = shuffledActive[activeIndex++];
      const p2 = shuffledActive[activeIndex++];

      if (!p1 || !p2) {
        console.error(`   ❌ Not enough active participants for position ${i}`);
        continue;
      }

      await prisma.tb_match.update({
        where: { id_match: match.id_match },
        data: {
          id_peserta_a: p1.id_peserta_kompetisi,
          id_peserta_b: p2.id_peserta_kompetisi
        }
      });

      const name1 = p1.is_team ? p1.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') : p1.atlet?.nama_atlet;
      const name2 = p2.is_team ? p2.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') : p2.atlet?.nama_atlet;

      console.log(`   🎮 R1 match position ${i}: ${name1} vs ${name2} (pending)`);
    }
  }

  // Debug summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔍 FINAL DEBUG SUMMARY FOR BRACKET`);
  console.log(`🎯 Total peserta: ${participantCount}`);
  console.log(`📦 Total targetSize: ${targetSize}`);
  console.log(`💤 Total BYE needed: ${byesNeeded}`);
  console.log(`🙋‍♂️ Active participants count: ${shuffledActive.length}`);
  console.log(`😴 Bye participants count: ${byeParticipants.length}`);
  console.log(`👥 Semua peserta:`, registrations.map(r => r.is_team ? r.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') : r.atlet?.nama_atlet));
  console.log(`✅ Yang masuk ke R1:`, [...shuffledActive, ...byeParticipants].map(r => r.is_team ? r.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ') : r.atlet?.nama_atlet));
  
  if (shuffledActive.length + byeParticipants.length === participantCount) {
    console.log(`🎉 Semua peserta terpakai di R1`);
  } else {
    console.log(`⚠️ WARNING: Participant count mismatch!`);
  }

  const byeMatchCount = byePositions.length;
  const fightMatchCount = balancedFightPositions.length;
  console.log(`🟡 Total BYE matches di R1: ${byeMatchCount}`);
  console.log(`⚔️ Total FIGHT matches di R1: ${fightMatchCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Recalculate structure for display
  BracketService.calculateBracketStructure(participantCount);
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
 * 🎯 Distribute BYE positions for LEFT-RIGHT mirrored bracket
 * CRITICAL: Untuk bracket yang render kiri-kanan (mirrored)
 */
static distributeBYEForMirroredBracket(
  participantCount: number,
  targetSize: number
): number[] {
  const byesNeeded = targetSize - participantCount;
  if (byesNeeded <= 0) return [];
  
  const totalMatchesR1 = targetSize / 2;
  const halfSize = totalMatchesR1 / 2; // Split point kiri-kanan
  
  console.log(`\n🎯 === BYE DISTRIBUTION (MIRRORED BRACKET) ===`);
  console.log(`   Participants: ${participantCount}`);
  console.log(`   Target Size: ${targetSize}`);
  console.log(`   Total R1 Matches: ${totalMatchesR1}`);
  console.log(`   Half Size (split point): ${halfSize}`);
  console.log(`   BYEs Needed: ${byesNeeded}`);
  
  const byePositions: number[] = [];
  
  // Tracking untuk LEFT (0 to halfSize-1) dan RIGHT (halfSize to totalMatchesR1-1)
  let leftTop = 0;
  let leftBottom = halfSize - 1;
  let rightTop = halfSize;
  let rightBottom = totalMatchesR1 - 1;
  
  // Pattern: LEFT-top, RIGHT-top, LEFT-bottom, RIGHT-bottom (alternating)
  for (let i = 0; i < byesNeeded; i++) {
    const side = i % 2 === 0 ? 'LEFT' : 'RIGHT';
    const isFromTop = Math.floor(i / 2) % 2 === 0;
    
    if (side === 'LEFT') {
      if (isFromTop && leftTop <= leftBottom) {
        byePositions.push(leftTop);
        console.log(`   BYE ${i + 1}: LEFT-top position ${leftTop}`);
        leftTop++;
      } else if (!isFromTop && leftBottom >= leftTop) {
        byePositions.push(leftBottom);
        console.log(`   BYE ${i + 1}: LEFT-bottom position ${leftBottom}`);
        leftBottom--;
      } else {
        // Fallback jika LEFT penuh, masuk RIGHT
        if (rightTop <= rightBottom) {
          byePositions.push(rightTop);
          console.log(`   BYE ${i + 1}: RIGHT-top position ${rightTop} (LEFT full)`);
          rightTop++;
        }
      }
    } else {
      if (isFromTop && rightTop <= rightBottom) {
        byePositions.push(rightTop);
        console.log(`   BYE ${i + 1}: RIGHT-top position ${rightTop}`);
        rightTop++;
      } else if (!isFromTop && rightBottom >= rightTop) {
        byePositions.push(rightBottom);
        console.log(`   BYE ${i + 1}: RIGHT-bottom position ${rightBottom}`);
        rightBottom--;
      } else {
        // Fallback jika RIGHT penuh, masuk LEFT
        if (leftTop <= leftBottom) {
          byePositions.push(leftTop);
          console.log(`   BYE ${i + 1}: LEFT-top position ${leftTop} (RIGHT full)`);
          leftTop++;
        }
      }
    }
  }
  
  // Sort positions untuk processing yang lebih mudah
  byePositions.sort((a, b) => a - b);
  
  console.log(`\n   📊 Final BYE Positions:`, byePositions);
  console.log(`   LEFT side (0-${halfSize-1}):`, byePositions.filter(p => p < halfSize));
  console.log(`   RIGHT side (${halfSize}-${totalMatchesR1-1}):`, byePositions.filter(p => p >= halfSize));
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  return byePositions;
}

/**
 * 🆕 Distribute FIGHT positions untuk merata kiri-kanan
 * Memastikan fight matches tidak menumpuk di satu sisi
 */
static distributeFightPositions(
  fightPositions: number[],
  totalMatchesR1: number
): number[] {
  if (fightPositions.length === 0) return [];
  
  const halfSize = totalMatchesR1 / 2;
  const leftFights: number[] = [];
  const rightFights: number[] = [];
  
  // Pisahkan fight positions berdasarkan sisi
  fightPositions.forEach(pos => {
    if (pos < halfSize) {
      leftFights.push(pos);
    } else {
      rightFights.push(pos);
    }
  });
  
  console.log(`\n   📐 Original fight distribution:`);
  console.log(`      LEFT fights (${leftFights.length}):`, leftFights);
  console.log(`      RIGHT fights (${rightFights.length}):`, rightFights);
  
  // ⭐ Jika sudah seimbang (±1), keep as is
  if (Math.abs(leftFights.length - rightFights.length) <= 1) {
    console.log(`   ✅ Fight distribution already balanced!\n`);
    return fightPositions;
  }
  
  // ⚠️ Jika tidak seimbang, redistribute
  console.log(`   ⚠️ Unbalanced (diff: ${Math.abs(leftFights.length - rightFights.length)})! Redistributing...`);
  
  const targetPerSide = Math.floor(fightPositions.length / 2);
  const redistributed: number[] = [];
  
  // Ambil semua available positions dan sort
  const sortedFights = [...fightPositions].sort((a, b) => a - b);
  
  // Distribute secara alternating kiri-kanan
  let leftCount = 0;
  let rightCount = 0;
  
  for (const pos of sortedFights) {
    const isLeftPos = pos < halfSize;
    
    if (isLeftPos && leftCount < targetPerSide) {
      redistributed.push(pos);
      leftCount++;
    } else if (!isLeftPos && rightCount < targetPerSide) {
      redistributed.push(pos);
      rightCount++;
    } else {
      // Sisa dimasukkan ke yang kurang
      if (leftCount < rightCount) {
        redistributed.push(pos);
        leftCount++;
      } else {
        redistributed.push(pos);
        rightCount++;
      }
    }
  }
  
  // Verify hasil
  const finalLeft = redistributed.filter(p => p < halfSize).length;
  const finalRight = redistributed.filter(p => p >= halfSize).length;
  
  console.log(`   ✅ Redistributed:`);
  console.log(`      LEFT fights: ${finalLeft}`);
  console.log(`      RIGHT fights: ${finalRight}`);
  console.log(`      Positions:`, redistributed.sort((a, b) => a - b));
  console.log();
  
  return redistributed;
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

static async generatePrestasiBracket(
  baganId: number,
  participants: Participant[],
  byeParticipantIds?: number[]
): Promise<Match[]> {
  const matches: Match[] = [];

  const participantCount = participants.length;
  
  // ✅ PERBAIKAN: Support 2-3 participants
  if (participantCount < 2) {
    throw new Error("Minimal 2 peserta diperlukan untuk bracket prestasi");
  }

  // ✅ HANDLE 2 PARTICIPANTS (langsung final)
  if (participantCount === 2) {
    console.log(`🎯 PRESTASI: 2 participants → Direct Final`);
    
    const shuffled = this.shuffleArray([...participants]);
    
    const finalMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1, // Langsung final (round 1)
        id_peserta_a: shuffled[0].id,
        id_peserta_b: shuffled[1].id,
        skor_a: 0,
        skor_b: 0,
      },
    });

    matches.push({
      id: finalMatch.id_match,
      round: 1,
      position: 0,
      participant1: shuffled[0],
      participant2: shuffled[1],
      status: "pending",
      scoreA: 0,
      scoreB: 0,
    });

    console.log(`   ✅ Final match created: ${shuffled[0].name} vs ${shuffled[1].name}`);
    return matches;
  }

  // ✅ HANDLE 3 PARTICIPANTS (1 bye + 1 match → final)
  if (participantCount === 3) {
    console.log(`🎯 PRESTASI: 3 participants → 1 BYE + 1 Match → Final`);
    
    const shuffled = this.shuffleArray([...participants]);
    
    // Round 1: 1 match
    const round1Match = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: shuffled[0].id,
        id_peserta_b: shuffled[1].id,
        skor_a: 0,
        skor_b: 0,
      },
    });

    matches.push({
      id: round1Match.id_match,
      round: 1,
      position: 0,
      participant1: shuffled[0],
      participant2: shuffled[1],
      status: "pending",
      scoreA: 0,
      scoreB: 0,
    });

    console.log(`   🥊 R1 Match: ${shuffled[0].name} vs ${shuffled[1].name}`);

    // Round 2: Final (BYE participant vs winner of R1)
    const finalMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 2,
        id_peserta_a: shuffled[2].id, // BYE participant
        id_peserta_b: null, // TBD - winner of R1
        skor_a: 0,
        skor_b: 0,
      },
    });

    matches.push({
      id: finalMatch.id_match,
      round: 2,
      position: 0,
      participant1: shuffled[2],
      participant2: null,
      status: "pending",
      scoreA: 0,
      scoreB: 0,
    });

    console.log(`   🏆 Final: ${shuffled[2].name} (BYE) vs Winner of R1`);
    return matches;
  }

  // ✅ EXISTING LOGIC for 4+ participants
  const targetSize = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  const byesNeeded = targetSize - participantCount;
  const totalMatchesR1 = targetSize / 2;
  
  console.log(`📊 PRESTASI: participants=${participantCount}, targetSize=${targetSize}, byesNeeded=${byesNeeded}`);
  console.log(`   Total R1 matches: ${totalMatchesR1}`);

  // 2️⃣ Tentukan peserta BYE
  let byeParticipants: Participant[] = [];
  let activeParticipants: Participant[] = [...participants];

  if (byeParticipantIds && byeParticipantIds.length > 0) {
    byeParticipants = participants.filter(p => byeParticipantIds.includes(p.id));
    activeParticipants = participants.filter(p => !byeParticipantIds.includes(p.id));
    console.log("   Using provided BYE IDs:", byeParticipantIds);
  } else if (byesNeeded > 0) {
    const shuffled = this.shuffleArray([...participants]);
    byeParticipants = shuffled.slice(0, byesNeeded);
    activeParticipants = shuffled.slice(byesNeeded);
    console.log("   Auto-selected BYE participants:", byeParticipants.map(p => p.name));
  }

  // 3️⃣ Tentukan posisi BYE dengan distribusi kiri-kanan
  const byePositions = this.distributeBYEForMirroredBracket(
    participantCount,
    targetSize
  );

  console.log(`   🧩 BYE positions:`, byePositions);

  // 4️⃣ Tentukan posisi FIGHT (yang BUKAN BYE)
  const allPositions = Array.from({ length: totalMatchesR1 }, (_, i) => i);
  const fightPositions = allPositions.filter(pos => !byePositions.includes(pos));

  console.log(`   ⚔️ FIGHT positions (before distribution):`, fightPositions);

  // 5️⃣ DISTRIBUTE fight positions untuk merata kiri-kanan
  const distributedFightPositions = this.distributeFightPositions(
    fightPositions,
    totalMatchesR1
  );

  console.log(`   ✅ FIGHT positions (after distribution):`, distributedFightPositions);

  // 6️⃣ Shuffle peserta aktif
  const shuffledActive = this.shuffleArray([...activeParticipants]);
  let pIndex = 0;
  let byeIndex = 0;

  // 7️⃣ CREATE MATCHES dengan posisi yang sudah didistribusi
  const allSortedPositions = [...byePositions, ...distributedFightPositions].sort((a, b) => a - b);

  for (const pos of allSortedPositions) {
    let p1: Participant | null = null;
    let p2: Participant | null = null;
    let status: Match["status"] = "pending";

    if (byePositions.includes(pos)) {
      // BYE match
      if (byeIndex < byeParticipants.length) {
        p1 = byeParticipants[byeIndex++];
        p2 = null;
        status = "bye";
      }
    } else {
      // FIGHT match
      p1 = shuffledActive[pIndex++] || null;
      p2 = shuffledActive[pIndex++] || null;
      
      if (p1 && !p2) {
        status = "bye";
      }
    }

    const created = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: p1 ? p1.id : null,
        id_peserta_b: p2 ? p2.id : null,
        skor_a: 0,
        skor_b: 0,
      },
    });

    matches.push({
      id: created.id_match,
      round: 1,
      position: pos,
      participant1: p1,
      participant2: p2,
      status,
      scoreA: 0,
      scoreB: 0,
    });

    console.log(`   🎮 R1 match position ${pos}: ${p1 ? p1.name : "BYE"} vs ${p2 ? p2.name : "BYE"} (${status})`);
  }

  // 8️⃣ Pastikan tidak ada peserta tersisa (Safety check)
  while (pIndex < shuffledActive.length) {
    const leftover = shuffledActive[pIndex++];
    
    console.warn(`   ⚠️ LEFTOVER PARTICIPANT DETECTED: ${leftover.name}`);
    
    // Cari slot kosong atau buat match baru
    const created = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: leftover.id,
        id_peserta_b: null,
        skor_a: 0,
        skor_b: 0,
      },
    });

    matches.push({
      id: created.id_match,
      round: 1,
      position: matches.length, // Append to end
      participant1: leftover,
      participant2: null,
      status: "bye",
      scoreA: 0,
      scoreB: 0,
    });

    console.log(`   🩹 Added leftover participant as BYE: ${leftover.name}`);
  }

  // 9️⃣ Buat placeholder ronde berikutnya
  const totalRounds = Math.log2(targetSize);
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      const created = await prisma.tb_match.create({
        data: {
          id_bagan: baganId,
          ronde: round,
          id_peserta_a: null,
          id_peserta_b: null,
          skor_a: 0,
          skor_b: 0,
        },
      });

      matches.push({
        id: created.id_match,
        round,
        position: i,
        participant1: null,
        participant2: null,
        status: "pending",
        scoreA: 0,
        scoreB: 0,
      });
    }
  }

  // 🔟 Auto-advance peserta yang BYE
  const createdR1Matches = matches.filter(m => m.round === 1);
  for (const m of createdR1Matches) {
    if (m.participant1 && !m.participant2 && m.id) {
      await this.advanceWinnerToNextRound(
        { id_bagan: baganId, ronde: 1, id_match: m.id },
        m.participant1.id
      );
      console.log(`   ⚡ Auto-advanced BYE winner ${m.participant1.name}`);
    }
  }

  // 1️⃣1️⃣ Debug summary akhir
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 FINAL DEBUG SUMMARY FOR BRACKET");
  console.log(`🎯 Total peserta: ${participantCount}`);
  console.log(`📦 Total targetSize: ${targetSize}`);
  console.log(`💤 Total BYE needed: ${byesNeeded}`);
  console.log(`🙋‍♂️ Active participants count: ${activeParticipants.length}`);
  console.log(`😴 Bye participants count: ${byeParticipants.length}`);

  const allUsed = matches
    .filter(m => m.round === 1)
    .flatMap(m => [m.participant1, m.participant2])
    .filter(Boolean)
    .map(p => (p as Participant).name);

  const allNames = participants.map(p => p.name);
  const missing = allNames.filter(n => !allUsed.includes(n));

  console.log("👥 Semua peserta:", allNames);
  console.log("✅ Yang masuk ke R1:", allUsed);
  
  if (missing.length > 0) {
    console.log("⚠️ MISSING PESERTA:", missing);
    console.log("❌ ERROR: Ada peserta yang hilang!");
  } else {
    console.log("🎉 Semua peserta terpakai di R1");
  }

  const byeCountR1 = matches.filter(
    m => m.round === 1 && (m.status === "bye" || !m.participant2)
  ).length;
  console.log(`🟡 Total BYE matches di R1: ${byeCountR1}`);
  
  // Hitung fight matches
  const fightCountR1 = matches.filter(
    m => m.round === 1 && m.participant1 && m.participant2
  ).length;
  console.log(`⚔️ Total FIGHT matches di R1: ${fightCountR1}`);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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
  if (byesNeeded <= 0) return [];

  const totalMatches = targetSize / 2;
  const positions: number[] = [];

  // Zigzag pattern (top → bottom → mid-top → mid-bottom)
  const pattern = [
    0,
    totalMatches - 1,
    Math.floor(totalMatches / 4),
    Math.floor((totalMatches * 3) / 4),
  ];

  for (let i = 0; i < byesNeeded; i++) {
    const pos = pattern[i] !== undefined
      ? pattern[i]
      : Math.floor((i / byesNeeded) * totalMatches);
    if (pos < totalMatches && !positions.includes(pos)) positions.push(pos);
  }

  return positions.sort((a, b) => a - b);
}

static calculateByePositionsZigzag(participantCount: number, targetSize: number): number[] {
  const byesNeeded = targetSize - participantCount;
  if (byesNeeded <= 0) return [];

  const positions: number[] = [];
  const top = 0;
  const bottom = targetSize - 1;
  let up = true;
  let step = Math.floor(targetSize / (byesNeeded + 1));

  for (let i = 0; i < byesNeeded; i++) {
    const pos = up
      ? Math.floor((i / byesNeeded) * (targetSize / 2))
      : bottom - Math.floor((i / byesNeeded) * (targetSize / 2));
    positions.push(Math.max(0, Math.min(targetSize - 1, pos)));
    up = !up;
  }

  return [...new Set(positions)].sort((a, b) => a - b);
}

static async generatePemulaBracket(
  baganId: number, 
  participants: Participant[],
  byeParticipantIds?: number[] // ⭐ IGNORED - BYE otomatis
): Promise<Match[]> {
  const matches: Match[] = [];
  
  console.log(`\n🥋 === GENERATING PEMULA BRACKET (3 CARDS STRUCTURE) ===`);
  console.log(`Total participants: ${participants.length}`);

  // ⭐ SHUFFLE all participants
  const shuffled = this.shuffleArray([...participants]);
  
  const totalParticipants = shuffled.length;
  const isOdd = totalParticipants % 2 === 1;
  
  if (isOdd) {
    // ═══════════════════════════════════════════════════════
    // 🎯 SCENARIO: ODD NUMBER (3, 5, 7, 9, etc.)
    // Structure: 
    //   Round 1: 
    //     - Match A: P1 vs P2 (normal fight)
    //     - Match B: P_last vs BYE (auto-win)
    //   Round 2:
    //     - Additional Match: Winner_A vs Winner_B (P_last)
    // ═══════════════════════════════════════════════════════
    
    console.log(`\n📊 ODD participants detected → 3 cards structure`);
    
    // ⭐ STEP 1: Create normal fight matches (semua pasangan normal)
    const normalPairs = Math.floor((totalParticipants - 1) / 2);
    
    console.log(`\n🥊 Creating ${normalPairs} normal fight match(es)...`);
    
    for (let i = 0; i < normalPairs; i++) {
      const p1 = shuffled[i * 2];
      const p2 = shuffled[i * 2 + 1];
      
      const match = await prisma.tb_match.create({
        data: {
          id_bagan: baganId,
          ronde: 1,
          id_peserta_a: p1.id,
          id_peserta_b: p2.id,
          skor_a: 0,
          skor_b: 0
        }
      });
      
      matches.push({
        id: match.id_match,
        round: 1,
        position: matches.length,
        participant1: p1,
        participant2: p2,
        status: 'pending',
        scoreA: 0,
        scoreB: 0
      });
      
      console.log(`  ✅ Match ${match.id_match}: ${p1.name} vs ${p2.name}`);
    }
    
    // ⭐ STEP 2: Create BYE match (peserta terakhir vs BYE)
    const byeParticipant = shuffled[totalParticipants - 1];
    
    console.log(`\n🎁 Creating BYE match...`);
    
    const byeMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 1,
        id_peserta_a: byeParticipant.id,
        id_peserta_b: null, // BYE
        skor_a: 0,
        skor_b: 0
      }
    });
    
    matches.push({
      id: byeMatch.id_match,
      round: 1,
      position: matches.length,
      participant1: byeParticipant,
      participant2: null,
      status: 'bye',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  ✅ Match ${byeMatch.id_match}: ${byeParticipant.name} vs BYE`);
    
    // ⭐ STEP 3: Create Additional Match (Round 2)
    console.log(`\n⭐ Creating ADDITIONAL match (Round 2)...`);
    
    const additionalMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId,
        ronde: 2,
        id_peserta_a: null, // TBD - winner dari normal match
        id_peserta_b: byeParticipant.id, // Auto-advanced (BYE winner)
        skor_a: 0,
        skor_b: 0
      }
    });
    
    matches.push({
      id: additionalMatch.id_match,
      round: 2,
      position: 0,
      participant1: null,
      participant2: byeParticipant,
      status: 'pending',
      scoreA: 0,
      scoreB: 0
    });
    
    console.log(`  ✅ Additional Match ${additionalMatch.id_match}:`);
    console.log(`     Slot A: [TBD - Winner of Match ${matches[0].id}]`);
    console.log(`     Slot B: ${byeParticipant.name} (AUTO from BYE)`);
    
  } else {
    // ═══════════════════════════════════════════════════════
    // 🎯 SCENARIO: EVEN NUMBER (2, 4, 6, 8, etc.)
    // Structure: Normal matches only, NO additional match
    // ═══════════════════════════════════════════════════════
    
    console.log(`\n📊 EVEN participants → Normal matches only`);
    
    const normalPairs = totalParticipants / 2;
    
    for (let i = 0; i < normalPairs; i++) {
      const p1 = shuffled[i * 2];
      const p2 = shuffled[i * 2 + 1];
      
      const match = await prisma.tb_match.create({
        data: {
          id_bagan: baganId,
          ronde: 1,
          id_peserta_a: p1.id,
          id_peserta_b: p2.id,
          skor_a: 0,
          skor_b: 0
        }
      });
      
      matches.push({
        id: match.id_match,
        round: 1,
        position: matches.length,
        participant1: p1,
        participant2: p2,
        status: 'pending',
        scoreA: 0,
        scoreB: 0
      });
      
      console.log(`  ✅ Match ${match.id_match}: ${p1.name} vs ${p2.name}`);
    }
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
  winnerId?: number | null,             
  scoreA?: number | null,               
  scoreB?: number | null,               
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
    
    // ⭐ AUTO-GENERATE nomor_partai HANYA jika KEDUA field diisi
    if (nomorAntrian !== null && nomorAntrian !== undefined && 
        nomorLapangan !== null && nomorLapangan !== undefined) {
      updateData.nomor_partai = `${nomorAntrian}${nomorLapangan}`;
      console.log(`   🎯 Auto-generated nomor_partai: ${updateData.nomor_partai}`);
    } else if (nomorAntrian === null && nomorLapangan === null) {
      // ⭐ CLEAR nomor_partai jika kedua field di-clear
      updateData.nomor_partai = null;
      console.log(`   🗑️ Clearing nomor_partai`);
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
 * Calculate bracket structure based on participant count
 * Returns array of rounds with match counts
 */
static calculateBracketStructure(participantCount: number): any[] {
  console.log(`📐 === CALCULATING BRACKET STRUCTURE ===`);
  console.log(`   Participant Count: ${participantCount}`);

  const rounds: any[] = [];
  let currentParticipants = 2;
  let roundNumber = 1;

  // Build rounds from Final up to required size
  const roundNames = ['Final', 'Semi Final', 'Quarter Final', 'Round 1', 'Round 2', 'Round 3'];
  let nameIndex = 0;

  while (currentParticipants < participantCount) {
    const matchCount = currentParticipants / 2;
    rounds.unshift({
      round: roundNumber,
      name: roundNames[nameIndex] || `Round ${roundNumber}`,
      participants: currentParticipants,
      matchCount: matchCount
    });

    console.log(`   ✅ Round ${roundNumber}: ${roundNames[nameIndex]} (${currentParticipants} → ${matchCount})`);

    currentParticipants *= 2;
    roundNumber++;
    nameIndex++;
  }

  // Add first round to reach next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  const firstRoundMatches = nextPowerOf2 / 2;

  rounds.unshift({
    round: roundNumber,
    name: roundNames[nameIndex] || 'Round 1',
    participants: nextPowerOf2,
    matchCount: firstRoundMatches
  });

  console.log(`   ✅ Round ${roundNumber}: ${roundNames[nameIndex] || 'Round 1'} (${nextPowerOf2} → ${firstRoundMatches})`);
  console.log(`      Next Power of 2: ${nextPowerOf2}`);

  // Update round 1 target
  if (rounds.length > 1) {
    rounds[1].participants = firstRoundMatches * 2;
    console.log(`      → Round 1 target changed to: ${firstRoundMatches * 2}`);
  }

  // Reverse to get correct order (R1, R2, R3, Final)
  const orderedRounds = rounds.reverse().map((r, idx) => ({
    ...r,
    round: idx + 1
  }));

  console.log(`   📊 FINAL STRUCTURE:`);
  orderedRounds.forEach(r => {
    console.log(`      Round ${r.round}: ${r.name} - ${r.participants} participants, ${r.matchCount} matches`);
  });

  const byesNeeded = nextPowerOf2 - participantCount;
  console.log(`   💡 Recommended BYE: ${byesNeeded}`);
  console.log(`   🎯 Total Rounds: ${orderedRounds.length}`);

  return orderedRounds;
}

/**
 * Distribute BYEs across bracket positions
 * Returns array of positions that should be BYE matches
 */
static distributeBYEs(totalMatches: number, byesNeeded: number): number[] {
  console.log(`🎯 === BYE DISTRIBUTION (MIRRORED BRACKET) ===`);
  console.log(`   Total R1 Matches: ${totalMatches}`);
  console.log(`   BYEs Needed: ${byesNeeded}`);

  const byePositions: number[] = [];
  const halfSize = totalMatches / 2;

  console.log(`   Half Size (split point): ${halfSize}`);

  // Distribute BYEs alternating between top and bottom of each half
  for (let i = 0; i < byesNeeded; i++) {
    let position: number;

    if (i % 4 === 0) {
      // BYE 1, 5, 9... → LEFT top
      position = Math.floor(i / 4);
      console.log(`   BYE ${i + 1}: LEFT-top position ${position}`);
    } else if (i % 4 === 1) {
      // BYE 2, 6, 10... → RIGHT top
      position = halfSize + Math.floor(i / 4);
      console.log(`   BYE ${i + 1}: RIGHT-top position ${position}`);
    } else if (i % 4 === 2) {
      // BYE 3, 7, 11... → LEFT bottom
      position = (halfSize - 1) - Math.floor(i / 4);
      console.log(`   BYE ${i + 1}: LEFT-bottom position ${position}`);
    } else {
      // BYE 4, 8, 12... → RIGHT bottom
      position = (totalMatches - 1) - Math.floor(i / 4);
      console.log(`   BYE ${i + 1}: RIGHT-bottom position ${position}`);
    }

    byePositions.push(position);
  }

  byePositions.sort((a, b) => a - b);
  console.log(`   📊 Final BYE Positions:`, byePositions);

  // Debug: show distribution
  const leftByes = byePositions.filter(p => p < halfSize);
  const rightByes = byePositions.filter(p => p >= halfSize);
  console.log(`   LEFT side (0-${halfSize - 1}):`, leftByes);
  console.log(`   RIGHT side (${halfSize}-${totalMatches - 1}):`, rightByes);

  return byePositions;
}

/**
 * Balance fight matches between left and right bracket
 */
static balanceFights(fightPositions: number[], halfSize: number): number[] {
  console.log(`   🔄 Balancing fights...`);

  const leftFights = fightPositions.filter(p => p < halfSize);
  const rightFights = fightPositions.filter(p => p >= halfSize);

  const diff = Math.abs(leftFights.length - rightFights.length);

  if (diff <= 1) {
    console.log(`   ✅ Already balanced (diff: ${diff})`);
    return fightPositions;
  }

  // If left has more, move some to right
  if (leftFights.length > rightFights.length) {
    const toMove = Math.floor(diff / 2);
    console.log(`   → Moving ${toMove} fights from LEFT to RIGHT`);

    const movedFights = leftFights.splice(-toMove, toMove);
    const newRightPositions = movedFights.map(p => p + halfSize);

    return [...leftFights, ...rightFights, ...newRightPositions].sort((a, b) => a - b);
  }

  // If right has more, move some to left
  if (rightFights.length > leftFights.length) {
    const toMove = Math.floor(diff / 2);
    console.log(`   → Moving ${toMove} fights from RIGHT to LEFT`);

    const movedFights = rightFights.splice(0, toMove);
    const newLeftPositions = movedFights.map(p => p - halfSize);

    return [...leftFights, ...newLeftPositions, ...rightFights].sort((a, b) => a - b);
  }

  return fightPositions;
}

/**
 * Populate PEMULA bracket (supports any ODD number of participants)
 * Structure: Normal fights + 1 BYE → Additional Match
 */
static async populatePemulaBracket(
  baganId: number,
  registrations: any[],
  allMatches: any[],
  bracketStructure: any[]
): Promise<void> {
  console.log(`\n🥋 === POPULATING PEMULA BRACKET ===`);
  console.log(`   Total participants: ${registrations.length}`);

  const participantCount = registrations.length;

  // ⭐ VALIDATE: Must be ODD number
  if (participantCount % 2 === 0) {
    throw new Error('PEMULA bracket requires ODD number of participants');
  }

  // ⭐ VALIDATE: Minimum 3 participants
  if (participantCount < 3) {
    throw new Error('PEMULA bracket requires at least 3 participants');
  }

  // Shuffle participants
  const shuffled = [...registrations].sort(() => Math.random() - 0.5);

  // ⭐ GET LAST ROUND (actual Round 1)
  const firstRound = bracketStructure[bracketStructure.length - 1];
  
  // Round 1 matches
  const r1Matches = allMatches
    .filter(m => m.ronde === firstRound.round)
    .sort((a, b) => a.position - b.position);

  console.log(`   📊 Round 1 has ${r1Matches.length} matches`);

  // ⭐ CALCULATE: How many normal fights + 1 BYE
  const normalFights = Math.floor(participantCount / 2);  // e.g., 29 → 14 fights
  const byeParticipantIndex = participantCount - 1;       // Last participant gets BYE

  console.log(`   🥊 Normal fights: ${normalFights}`);
  console.log(`   🎁 BYE participant: ${shuffled[byeParticipantIndex].atlet?.nama_atlet || 'Team'}`);

  // ⭐ POPULATE NORMAL FIGHTS (positions 0 to normalFights-1)
  for (let i = 0; i < normalFights; i++) {
    const match = r1Matches[i];
    const p1 = shuffled[i * 2];
    const p2 = shuffled[i * 2 + 1];

    await prisma.tb_match.update({
      where: { id_match: match.id_match },
      data: {
        id_peserta_a: p1.id_peserta_kompetisi,
        id_peserta_b: p2.id_peserta_kompetisi
      }
    });

    const name1 = p1.is_team 
      ? p1.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ')
      : p1.atlet?.nama_atlet;
    const name2 = p2.is_team
      ? p2.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ')
      : p2.atlet?.nama_atlet;

    console.log(`   🥊 R1 Match ${i}: ${name1} vs ${name2}`);
  }

  // ⭐ POPULATE BYE MATCH (last position in Round 1)
  const byeMatch = r1Matches[normalFights];
  const byeParticipant = shuffled[byeParticipantIndex];

  await prisma.tb_match.update({
    where: { id_match: byeMatch.id_match },
    data: {
      id_peserta_a: byeParticipant.id_peserta_kompetisi,
      id_peserta_b: null
    }
  });

  const byeName = byeParticipant.is_team
    ? byeParticipant.anggota_tim?.map((t: any) => t.atlet.nama_atlet).join(', ')
    : byeParticipant.atlet?.nama_atlet;

  console.log(`   🎁 R1 Match ${normalFights}: ${byeName} vs BYE (auto-advance)`);

  // ⭐ POPULATE ADDITIONAL MATCH (Round 2)
  const r2Matches = allMatches.filter(m => m.ronde === firstRound.round - 1);  // Round sebelum Round 1
  
  if (r2Matches.length > 0) {
    const additionalMatch = r2Matches[0];  // Should only be 1 match in Round 2
    
    await prisma.tb_match.update({
      where: { id_match: additionalMatch.id_match },
      data: {
        id_peserta_b: byeParticipant.id_peserta_kompetisi  // BYE winner in Slot B
      }
    });

    console.log(`   ✅ ${byeName} auto-advanced to Additional Match (Slot B)`);
  }

  console.log(`   🎉 PEMULA bracket populated successfully`);
}

/**
 * Advance winner to next round
 */
static async advanceWinnerToNextRound(match: any, winnerId: number): Promise<void> {
  const currentRound = match.ronde;
  const nextRound = currentRound + 1;
  
  console.log(`\n🎯 === ADVANCE WINNER TO NEXT ROUND ===`);
  console.log(`   Winner ID: ${winnerId}`);
  console.log(`   From: Round ${currentRound} Match ${match.id_match} Position ${match.position}`);
  console.log(`   To: Round ${nextRound}`);
  
  // Determine if PEMULA or PRESTASI
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
  
  if (!bagan) {
    console.error(`   ❌ Bagan not found`);
    return;
  }
  
  const kategoriName = bagan.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || '';
  const isPemula = kategoriName.includes('pemula');
  
  console.log(`   📊 Category: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ PEMULA LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isPemula && currentRound === 1) {
    console.log(`\n🥋 === PEMULA ADVANCE LOGIC (R1 → Additional Match) ===`);
    
    const round1Matches = await prisma.tb_match.findMany({
      where: {
        id_bagan: match.id_bagan,
        ronde: 1
      },
      orderBy: { position: 'asc' }  // ⭐ SORT BY POSITION
    });
    
    console.log(`   Total Round 1 matches: ${round1Matches.length}`);
    
    const byeMatch = round1Matches.find(m => m.id_peserta_a && !m.id_peserta_b);
    
    if (!byeMatch) {
      console.log(`   ℹ️ No BYE match found`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    }
    
    const byeIndex = round1Matches.findIndex(m => m.id_match === byeMatch.id_match);
    console.log(`   📍 BYE match at index: ${byeIndex} (ID: ${byeMatch.id_match})`);
    
    if (byeIndex <= 0) {
      console.log(`   ⚠️ BYE is first match - invalid structure`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    }
    
    const lastNormalFightMatch = round1Matches[byeIndex - 1];
    console.log(`   🥊 Last normal fight match ID: ${lastNormalFightMatch.id_match}`);
    console.log(`   🔍 Current match ID: ${match.id_match}`);
    
    if (match.id_match === lastNormalFightMatch.id_match) {
      console.log(`   ✅ YES! This is the LAST normal fight`);
      
      const round2Match = await prisma.tb_match.findFirst({
        where: {
          id_bagan: match.id_bagan,
          ronde: 2
        }
      });
      
      if (!round2Match) {
        console.error(`   ❌ Round 2 not found!`);
        console.log(`═══════════════════════════════════════\n`);
        return;
      }
      
      await prisma.tb_match.update({
        where: { id_match: round2Match.id_match },
        data: { id_peserta_a: winnerId }
      });
      
      console.log(`   ✅ Winner ${winnerId} placed in Additional Match (Slot A)`);
      console.log(`═══════════════════════════════════════\n`);
      return;
      
    } else {
      console.log(`   ❌ NO - This is NOT the last normal fight`);
      console.log(`   → Winner ${winnerId} does NOT advance`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ PRESTASI LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n🏆 === PRESTASI ADVANCE LOGIC (Standard Bracket) ===`);
  
  // ⭐ GET MATCHES SORTED BY POSITION
  const currentRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: currentRound
    },
    orderBy: { position: 'asc' }  // ⭐ CRITICAL: Sort by position
  });

  const nextRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: nextRound
    },
    orderBy: { position: 'asc' }  // ⭐ CRITICAL: Sort by position
  });

  console.log(`   Current Round ${currentRound}: ${currentRoundMatches.length} matches`);
  console.log(`   Next Round ${nextRound}: ${nextRoundMatches.length} matches`);

  if (nextRoundMatches.length === 0) {
    console.log(`   🏁 No next round - this was the FINAL`);
    console.log(`   🎊 Winner ${winnerId} is the CHAMPION!`);
    console.log(`═══════════════════════════════════════\n`);
    return;
  }

  // ⭐ USE POSITION FIELD DIRECTLY (not findIndex)
  const currentMatchPosition = match.position;
  
  if (currentMatchPosition === null || currentMatchPosition === undefined) {
    console.error(`   ❌ ERROR: Match has no position set`);
    console.log(`═══════════════════════════════════════\n`);
    return;
  }

  console.log(`   📍 Current match position: ${currentMatchPosition}`);

  // ⭐ Calculate next match using bracket tree logic
  const nextMatchPosition = Math.floor(currentMatchPosition / 2);
  const nextMatch = nextRoundMatches[nextMatchPosition];

  if (!nextMatch) {
    console.error(`   ❌ ERROR: Could not find next match at position ${nextMatchPosition}`);
    console.log(`   Available positions:`, nextRoundMatches.map(m => m.position));
    console.log(`═══════════════════════════════════════\n`);
    return;
  }

  console.log(`   🎯 Target: Round ${nextRound} Match ${nextMatch.id_match} Position ${nextMatchPosition}`);

  // ⭐ Determine slot: EVEN = Slot A, ODD = Slot B
  const isSlotA = currentMatchPosition % 2 === 0;
  const targetSlot = isSlotA ? 'A' : 'B';
  
  console.log(`   📍 Placement: Slot ${targetSlot} (position ${currentMatchPosition} is ${isSlotA ? 'EVEN' : 'ODD'})`);

  // Update next match with winner
  if (isSlotA) {
    if (nextMatch.id_peserta_a) {
      console.log(`   ⚠️ WARNING: Slot A already occupied by ${nextMatch.id_peserta_a}`);
      console.log(`   → SKIPPING to avoid overwrite`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    }
    
    await prisma.tb_match.update({
      where: { id_match: nextMatch.id_match },
      data: { id_peserta_a: winnerId }
    });
    
    console.log(`   ✅ SUCCESS: Winner ${winnerId} → Match ${nextMatch.id_match} Slot A`);
    
  } else {
    if (nextMatch.id_peserta_b) {
      console.log(`   ⚠️ WARNING: Slot B already occupied by ${nextMatch.id_peserta_b}`);
      console.log(`   → SKIPPING to avoid overwrite`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    }
    
    await prisma.tb_match.update({
      where: { id_match: nextMatch.id_match },
      data: { id_peserta_b: winnerId }
    });
    
    console.log(`   ✅ SUCCESS: Winner ${winnerId} → Match ${nextMatch.id_match} Slot B`);
  }
  
  console.log(`═══════════════════════════════════════\n`);
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

    const totalParticipants = shuffled.length;
    const isOdd = totalParticipants % 2 === 1;

    console.log(`\n   📝 Re-assigning participants to matches...`);

    if (isOdd) {
      // ⭐ ODD: Need normal fights + BYE match + additional match
      const normalPairs = Math.floor((totalParticipants - 1) / 2);
      
      // Update normal fight matches
      // Update Round 1 matches
for (let i = 0; i < normalPairs; i++) {
  const match = round1Matches[i];
  const participant1 = shuffled[i * 2];
  const participant2 = shuffled[i * 2 + 1];

  await prisma.tb_match.update({
    where: { id_match: match.id_match },
    data: {
      id_peserta_a: participant1.id,
      id_peserta_b: participant2.id,
      skor_a: 0,
      skor_b: 0,
      // ⭐ PERBAIKAN 4: Clear metadata
      tanggal_pertandingan: null,
      nomor_partai: null,
      nomor_antrian: null,
      nomor_lapangan: null
    }
  });

  console.log(`      Match ${match.id_match}: ${participant1.name} vs ${participant2.name}`);
}

// ⭐ Update BYE match (last match in Round 1)
const byeParticipant = shuffled[totalParticipants - 1];
const byeMatch = round1Matches[normalPairs];

if (byeMatch) {
  await prisma.tb_match.update({
    where: { id_match: byeMatch.id_match },
    data: {
      id_peserta_a: byeParticipant.id,
      id_peserta_b: null,
      skor_a: 0,
      skor_b: 0,
      // ⭐ Clear metadata
      tanggal_pertandingan: null,
      nomor_partai: null,
      nomor_antrian: null,
      nomor_lapangan: null
    }
  });
  
  console.log(`      BYE Match ${byeMatch.id_match}: ${byeParticipant.name} vs BYE`);
}

// ⭐ Update Additional Match (Round 2)
if (round2Matches.length > 0) {
  const additionalMatch = round2Matches[0];
  
  await prisma.tb_match.update({
    where: { id_match: additionalMatch.id_match },
    data: {
      id_peserta_a: null,
      id_peserta_b: byeParticipant.id,
      skor_a: 0,
      skor_b: 0,
      // ⭐ Clear metadata
      tanggal_pertandingan: null,
      nomor_partai: null,
      nomor_antrian: null,
      nomor_lapangan: null
    }
  });
  
  console.log(`      Additional Match ${additionalMatch.id_match}: TBD vs ${byeParticipant.name} (BYE)`);
}
      
    } else {
      // ⭐ EVEN: Only normal fights, no BYE, no additional match
      const normalPairs = totalParticipants / 2;
      
      for (let i = 0; i < normalPairs; i++) {
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

static calculateTotalRounds(participantCount: number): number {
  // ✅ PERBAIKAN: Support 2-3 participants
  if (participantCount < 2) {
    throw new Error('Minimal 2 peserta diperlukan untuk bracket turnamen');
  }
  
  // ✅ SPECIAL CASES
  if (participantCount === 2) return 1; // Langsung final
  if (participantCount === 3) return 2; // 1 match + final
  
  try {
    const rounds = BracketService.calculateBracketStructure(participantCount);
    return rounds.length;  // ✅ FIX: Add return statement
  } catch (error) {
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
    console.log(`🧹 === CLEARING MATCH RESULTS ===`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);

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
        kelas_kejuaraan: {
          include: {
            kategori_event: true
          }
        }
      }
    });

    if (!bagan) {
      throw new Error('Bagan tidak ditemukan');
    }

    // ⭐ Detect if PEMULA
    const isPemula = bagan.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase().includes('pemula') || false;

    console.log(`   Category: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);
    console.log(`   Total matches: ${bagan.match.length}`);

    const updatePromises = bagan.match.map((match) => {
      console.log(`\n   Processing Match ${match.id_match} (Round ${match.ronde}):`);
      console.log(`      Before: peserta_a=${match.id_peserta_a}, peserta_b=${match.id_peserta_b}`);
      
      if (match.ronde === 1) {
        // ⭐ Round 1: KEEP ALL participants, reset scores only
        console.log(`      Action: Keep participants, reset scores`);
        return prisma.tb_match.update({
          where: { id_match: match.id_match },
          data: {
            skor_a: 0,
            skor_b: 0
          }
        });
      } else if (isPemula && match.ronde === 2) {
        // ⭐ PEMULA Round 2 (Additional Match):
        // - KEEP peserta_b (BYE participant - auto advanced)
        // - CLEAR peserta_a (TBD - winner from fight match)
        console.log(`      Action: PEMULA R2 - Keep peserta_b (BYE), clear peserta_a (TBD)`);
        return prisma.tb_match.update({
          where: { id_match: match.id_match },
          data: {
            skor_a: 0,
            skor_b: 0,
            id_peserta_a: null  // Clear TBD slot
            // id_peserta_b is KEPT (BYE participant)
          }
        });
      } else {
        // ⭐ PRESTASI Round 2+: Clear both participants (will be filled by winners)
        console.log(`      Action: PRESTASI R${match.ronde} - Clear both participants`);
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

    console.log(`\n✅ Successfully cleared ${bagan.match.length} matches\n`);

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