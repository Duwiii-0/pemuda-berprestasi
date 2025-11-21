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
    stageName?: string; // 'ROUND_1', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'
    bracketParticipantCount?: number; // Total participants in this bracket
    kelasKejuaraanId?: number; // For grouping
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

   static async createBracket(
    kompetisiId: number, 
    kelasKejuaraanId: number,
    dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' }
  ): Promise<Bracket> {
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

    // Call the existing generateBracket method
    return this.generateBracket(kompetisiId, kelasKejuaraanId, undefined, dojangSeparation);
  }
  
static async generateBracket(
  kompetisiId: number, 
  kelasKejuaraanId: number,
  byeParticipantIds?: number[],
  dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' } // ⭐ TAMBAHKAN INI
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
      ? await this.generatePemulaBracket(bagan.id_bagan, participants, dojangSeparation)
      : await this.generatePrestasiBracket(bagan.id_bagan, participants, finalByeIds, dojangSeparation);
    
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

  // ⭐ TAMBAHKAN DI SINI - FUNGSI DOJANG SEPARATION
/**
 * Group participants by their dojang
 */
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

/**
 * Validate PRESTASI dojang separation for Round 1
 * Formula: If maxDojangSize > halfSize (pool capacity), same-dojang R1 match is UNAVOIDABLE
 */
static validatePrestasiR1Separation(
  participants: Participant[],
  targetSize: number
): {
  canSeparateR1: boolean;
  largestDojang: { name: string; size: number };
  poolCapacity: number;
  totalR1Matches: number;
  warnings: string[];
  isUnavoidable: boolean;
} {
  const dojangGroups = this.groupByDojang(participants);
  const totalR1Matches = targetSize / 2;
  const poolCapacity = totalR1Matches / 2; // LEFT and RIGHT pool capacity (in matches)
  const maxParticipantsPerPool = poolCapacity * 2; // Each match has 2 participants
  
  let largestDojang = { name: '', size: 0 };
  
  for (const [dojangName, members] of dojangGroups) {
    if (members.length > largestDojang.size) {
      largestDojang = { name: dojangName || 'UNKNOWN', size: members.length };
    }
  }
  
  const warnings: string[] = [];
  
  // ⭐ CRITICAL CHECK: If any dojang has MORE than pool capacity
  // → Impossible to fit all in one pool → Must spread to both pools → R1 same-dojang unavoidable
  const isUnavoidable = largestDojang.size > maxParticipantsPerPool;
  
  console.log(`\n📊 === PRESTASI R1 STRICT VALIDATION ===`);
  console.log(`   Total participants: ${participants.length}`);
  console.log(`   Target bracket size: ${targetSize}`);
  console.log(`   Total R1 matches: ${totalR1Matches}`);
  console.log(`   Pool capacity: ${poolCapacity} matches per side`);
  console.log(`   Max participants per pool: ${maxParticipantsPerPool}`);
  console.log(`   Largest dojang: "${largestDojang.name}" (${largestDojang.size} members)`);
  console.log(`   Unavoidable same-dojang R1? ${isUnavoidable ? 'YES ⚠️' : 'NO ✅'}`);
  
  if (isUnavoidable) {
    const overflow = largestDojang.size - maxParticipantsPerPool;
    warnings.push(
      `⚠️ PRESTASI STRICT MODE - Round 1 Same-Dojang Match Unavoidable:`,
      ``,
      `   📊 Breakdown:`,
      `      • Dojang "${largestDojang.name}": ${largestDojang.size} members`,
      `      • Pool capacity: ${maxParticipantsPerPool} participants per side`,
      `      • Overflow: ${overflow} member(s) must go to opposite pool`,
      ``,
      `   💡 Explanation:`,
      `      Dengan ${largestDojang.size} members dan pool capacity ${maxParticipantsPerPool},`,
      `      ${overflow} member(s) HARUS masuk ke pool lawan (LEFT/RIGHT),`,
      `      sehingga minimal ada ${Math.ceil(overflow / 2)} same-dojang match(es) di R1.`,
      ``,
      `   ✅ Status: DIPERBOLEHKAN (mathematically impossible to avoid)`,
      ``
    );
  }
  
  // ⭐ Special case: All from same dojang
  if (dojangGroups.size === 1) {
    warnings.push(
      `ℹ️ Semua peserta berasal dari dojang yang sama ("${largestDojang.name}")`,
      `   → Round 1 akan penuh dengan same-dojang matches`,
      `   → STRICT mode tidak dapat menghindari ini`,
      `   → Shuffle tidak akan mengubah hasil`,
      ``
    );
  }
  
  return {
    canSeparateR1: !isUnavoidable,
    largestDojang,
    poolCapacity,
    totalR1Matches,
    warnings,
    isUnavoidable
  };
}

/**
 * Distribute participants with dojang separation
 * STRICT mode: Split same-dojang members between left/right
 * BALANCED mode: Keep same-dojang together, distribute groups evenly
 */
/**
 * Distribute participants with STRICT dojang separation
 * Goal: Split same-dojang members between LEFT and RIGHT pools
 * Result: They cannot meet until Semi-Final (when pools merge)
 */
static distributeDojangSeparatedStrict(
  participants: Participant[]
): [Participant[], Participant[]] {
  const dojangGroups = this.groupByDojang(participants);
  const left: Participant[] = [];
  const right: Participant[] = [];
  
  console.log(`\n🏛️ === STRICT DOJANG SEPARATION ===`);
  console.log(`   Splitting same-dojang members between LEFT and RIGHT pools...`);
  
  // Sort dojangs by member count (largest first) for better distribution
  const sortedDojangs = Array.from(dojangGroups.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  console.log(`\n   📊 Dojang distribution:`);
  sortedDojangs.forEach(([dojang, members]) => {
    console.log(`      ${dojang}: ${members.length} member(s)`);
  });
  
  console.log(`\n   🔀 Distribution process:`);
  
  sortedDojangs.forEach(([dojang, members]) => {
    if (members.length === 1) {
      // ⭐ Single member: Put in smaller pool for balance
      if (left.length <= right.length) {
        left.push(members[0]);
        console.log(`      • ${members[0].name} (${dojang}) → LEFT (single member)`);
      } else {
        right.push(members[0]);
        console.log(`      • ${members[0].name} (${dojang}) → RIGHT (single member)`);
      }
      
    } else {
      // ⭐ Multiple members: SPLIT between pools (STRICT behavior)
      const mid = Math.ceil(members.length / 2);
      const leftMembers = members.slice(0, mid);
      const rightMembers = members.slice(mid);
      
      left.push(...leftMembers);
      right.push(...rightMembers);
      
      console.log(`      • ${dojang} SPLIT (${members.length} members):`);
      console.log(`         LEFT  (${leftMembers.length}): ${leftMembers.map(m => m.name).join(', ')}`);
      console.log(`         RIGHT (${rightMembers.length}): ${rightMembers.map(m => m.name).join(', ')}`);
    }
  });
  
  console.log(`\n   ✅ Final distribution:`);
  console.log(`      LEFT pool:  ${left.length} participants`);
  console.log(`      RIGHT pool: ${right.length} participants`);
  console.log(``);
  
  return [left, right];
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
  
  // ✅ PERBAIKAN: Support 2-3 participants
  if (participantCount < 2) {
    throw new Error('Minimal 2 peserta diperlukan untuk bracket turnamen');
  }
  
  // ✅ SPECIAL CASE: 2 participants (langsung final)
  if (participantCount === 2) {
    console.log(`   ✅ 2 participants → Direct Final`);
    return {
      totalRounds: 1,
      rounds: [
        {
          round: 1,
          name: 'Final',
          participants: 2,
          matches: 1
        }
      ],
      round1Target: 2,
      byesRecommended: 0
    };
  }
  
  // ✅ SPECIAL CASE: 3 participants (1 match + final)
  if (participantCount === 3) {
    console.log(`   ✅ 3 participants → Round 1 + Final`);
    return {
      totalRounds: 2,
      rounds: [
        {
          round: 1,
          name: 'Round 1',
          participants: 2,
          matches: 1
        },
        {
          round: 2,
          name: 'Final',
          participants: 2,
          matches: 1
        }
      ],
      round1Target: 2,
      byesRecommended: 1 // 1 peserta dapat BYE ke final
    };
  }
  
  // ✅ EXISTING LOGIC for 4+ participants (tetap sama)
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

/**
 * Validate Round 1 matches for same-dojang violations
 * Called AFTER matches are created
 */
static validateR1MatchesStrict(
  matches: Match[],
  isUnavoidable: boolean
): {
  hasViolation: boolean;
  violations: { position: number; p1: string; p2: string; dojang: string }[];
  totalR1Matches: number;
  sameDojangCount: number;
  differentDojangCount: number;
  byeCount: number;
  summary: string;
} {
  const r1Matches = matches.filter(m => m.round === 1);
  const violations: { position: number; p1: string; p2: string; dojang: string }[] = [];
  let sameDojangCount = 0;
  let differentDojangCount = 0;
  let byeCount = 0;
  
  console.log(`\n🔍 === VALIDATING ROUND 1 MATCHES ===`);
  console.log(`   Total R1 matches: ${r1Matches.length}\n`);
  
  for (const match of r1Matches) {
    // ⭐ Skip BYE matches
    if (!match.participant1 || !match.participant2) {
      byeCount++;
      console.log(`   Match ${match.position + 1}: BYE (skipped)`);
      continue;
    }
    
    const isSameDojang = match.participant1.dojang === match.participant2.dojang;
    
    if (isSameDojang) {
      sameDojangCount++;
      violations.push({
        position: match.position,
        p1: match.participant1.name,
        p2: match.participant2.name,
        dojang: match.participant1.dojang || 'UNKNOWN'
      });
      console.log(
        `   ❌ Match ${match.position + 1}: ${match.participant1.name} vs ${match.participant2.name} ` +
        `(both from "${match.participant1.dojang}")`
      );
    } else {
      differentDojangCount++;
      console.log(
        `   ✅ Match ${match.position + 1}: ${match.participant1.name} (${match.participant1.dojang}) vs ` +
        `${match.participant2.name} (${match.participant2.dojang})`
      );
    }
  }
  
  const hasViolation = violations.length > 0;
  
  // ⭐ Generate summary
  let summary = '';
  if (hasViolation) {
    if (isUnavoidable) {
      summary = `⚠️ ${sameDojangCount} same-dojang match(es) in R1 (UNAVOIDABLE - diperbolehkan)`;
    } else {
      summary = `❌ ${sameDojangCount} same-dojang match(es) in R1 (SHOULD BE AVOIDABLE!)`;
    }
  } else {
    summary = `✅ All Round 1 matches have different dojangs`;
  }
  
  console.log(`\n   📊 Summary:`);
  console.log(`      • Different dojang: ${differentDojangCount} match(es) ✅`);
  console.log(`      • Same dojang: ${sameDojangCount} match(es) ${hasViolation ? '⚠️' : ''}`);
  console.log(`      • BYE: ${byeCount} match(es)`);
  console.log(`      • ${summary}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  return {
    hasViolation,
    violations,
    totalR1Matches: r1Matches.length,
    sameDojangCount,
    differentDojangCount,
    byeCount,
    summary
  };
}

static determineAbsoluteStageName(
  matchCountInRound: number
): 'ROUND_OF_64' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' {
  
  console.log(`   🎯 determineAbsoluteStageName: ${matchCountInRound} matches`);
  
  switch (matchCountInRound) {
    case 32:
      return 'ROUND_OF_64';
    case 16:
      return 'ROUND_OF_32';
    case 8:
      return 'ROUND_OF_16';
    case 4:
      return 'QUARTER_FINAL';
    case 2:
      return 'SEMI_FINAL';
    case 1:
      return 'FINAL';
    default:
      // Fallback untuk edge cases (BYE membuat jumlah tidak genap)
      if (matchCountInRound > 32) return 'ROUND_OF_64';
      if (matchCountInRound > 16) return 'ROUND_OF_32';
      if (matchCountInRound > 8) return 'ROUND_OF_16';
      if (matchCountInRound > 4) return 'QUARTER_FINAL';
      if (matchCountInRound > 2) return 'SEMI_FINAL';
      return 'FINAL';
  }
}

/**
 * Get stage priority for scheduling order
 * Lower number = earlier in schedule
 */
static getStagePriority(stageName: string): number {
  const priorities: Record<string, number> = {
    'ROUND_OF_64': 1,
    'ROUND_OF_32': 2,
    'ROUND_OF_16': 3,
    'QUARTER_FINAL': 4,
    'SEMI_FINAL': 5,
    'FINAL': 6,
  };
  
  return priorities[stageName] || 99;
}

static async generatePrestasiBracket(
  baganId: number,
  participants: Participant[],
  byeParticipantIds?: number[],
  dojangSeparation?: { enabled: boolean; mode?: 'STRICT' | 'BALANCED' }
): Promise<Match[]> {
  const matches: Match[] = [];
  const participantCount = participants.length;
  
  if (participantCount < 2) {
    throw new Error("Minimal 2 peserta diperlukan");
  }

  // ⭐ HANDLE SPECIAL CASES (2-3 participants)
  if (participantCount === 2) {
    const shuffled = this.shuffleArray([...participants]);
    const finalMatch = await prisma.tb_match.create({
      data: {
        id_bagan: baganId, ronde: 1, position: 0,
        stage_name: 'FINAL', // ← 1 match = FINAL
        id_peserta_a: shuffled[0].id, id_peserta_b: shuffled[1].id,
        skor_a: 0, skor_b: 0,
      },
    });
    matches.push({
      id: finalMatch.id_match, round: 1, position: 0,
      participant1: shuffled[0], participant2: shuffled[1],
      status: "pending", scoreA: 0, scoreB: 0,
    });
    return matches;
  }

  if (participantCount === 3) {
    const shuffled = this.shuffleArray([...participants]);
    // R1 = SEMI_FINAL (2 matches worth of participants, but 1 actual match + 1 BYE)
    const r1 = await prisma.tb_match.create({
      data: {
        id_bagan: baganId, ronde: 1, position: 0,
        stage_name: 'SEMI_FINAL', // ← Feeds into final
        id_peserta_a: shuffled[0].id, id_peserta_b: shuffled[1].id,
        skor_a: 0, skor_b: 0,
      },
    });
    matches.push({
      id: r1.id_match, round: 1, position: 0,
      participant1: shuffled[0], participant2: shuffled[1],
      status: "pending", scoreA: 0, scoreB: 0,
    });
    // R2 = FINAL
    const r2 = await prisma.tb_match.create({
      data: {
        id_bagan: baganId, ronde: 2, position: 0,
        stage_name: 'FINAL',
        id_peserta_a: shuffled[2].id, id_peserta_b: null,
        skor_a: 0, skor_b: 0,
      },
    });
    matches.push({
      id: r2.id_match, round: 2, position: 0,
      participant1: shuffled[2], participant2: null,
      status: "pending", scoreA: 0, scoreB: 0,
    });
    return matches;
  }

  // ⭐ 4+ PARTICIPANTS - FULL BRACKET
  const targetSize = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  const totalRounds = Math.log2(targetSize);
  const byesNeeded = targetSize - participantCount;
  const totalMatchesR1 = targetSize / 2;
  const halfSize = totalMatchesR1 / 2;

  console.log(`\n🏆 PRESTASI BRACKET: ${participantCount} → ${targetSize} (${totalRounds} rounds)`);

  // Get stage name for R1
  const r1Stage = this.determineAbsoluteStageName(totalMatchesR1);

  console.log(`\n🏆 PRESTASI BRACKET: ${participantCount} → ${targetSize} (${totalRounds} rounds)`);
  console.log(`   R1: ${totalMatchesR1} matches → Stage: ${r1Stage}`);

  // ... [REST OF EXISTING LOGIC: validation, distribution, etc.] ...
  
  // Simplified version - create R1 matches with stage_name
    let isUnavoidable = false;
  if (dojangSeparation?.enabled) {
    const validation = this.validatePrestasiR1Separation(participants, targetSize);
    isUnavoidable = validation.isUnavoidable;
  }

  let byeParticipants: Participant[] = [];
  let activeParticipants = [...participants];

  if (byeParticipantIds?.length) {
    byeParticipants = participants.filter(p => byeParticipantIds.includes(p.id));
    activeParticipants = participants.filter(p => !byeParticipantIds.includes(p.id));
  } else if (byesNeeded > 0) {
    const shuffled = this.shuffleArray([...participants]);
    byeParticipants = shuffled.slice(0, byesNeeded);
    activeParticipants = shuffled.slice(byesNeeded);
  }

  const byePositions = this.distributeBYEForMirroredBracket(participantCount, targetSize);
  const allPositions = Array.from({ length: totalMatchesR1 }, (_, i) => i);
  const fightPositions = allPositions.filter(pos => !byePositions.includes(pos));

  const leftFightPositions = fightPositions.filter(pos => pos < halfSize);
  const rightFightPositions = fightPositions.filter(pos => pos >= halfSize);
  const leftNeeded = leftFightPositions.length * 2;
  const rightNeeded = rightFightPositions.length * 2;

  let leftPool: Participant[], rightPool: Participant[];
  if (dojangSeparation?.enabled) {
    [leftPool, rightPool] = this.distributeDojangSeparatedStrict(activeParticipants);
    leftPool = this.shuffleArray(leftPool);
    rightPool = this.shuffleArray(rightPool);
    if (leftPool.length !== leftNeeded || rightPool.length !== rightNeeded) {
      const all = [...leftPool, ...rightPool];
      leftPool = all.slice(0, leftNeeded);
      rightPool = all.slice(leftNeeded);
    }
  } else {
    const shuffled = this.shuffleArray([...activeParticipants]);
    leftPool = shuffled.slice(0, leftNeeded);
    rightPool = shuffled.slice(leftNeeded, leftNeeded + rightNeeded);
  }

  // ⭐ CREATE R1 MATCHES WITH ABSOLUTE STAGE NAME
  let leftIdx = 0, rightIdx = 0, byeIdx = 0;
  const sorted = [...byePositions, ...fightPositions].sort((a, b) => a - b);

  for (const pos of sorted) {
    let p1: Participant | null = null, p2: Participant | null = null;
    let status: Match["status"] = "pending";

    if (byePositions.includes(pos)) {
      if (byeIdx < byeParticipants.length) {
        p1 = byeParticipants[byeIdx++];
        status = "bye";
      }
    } else {
      const isLeft = pos < halfSize;
      
      if (isLeft) {
        if (leftIdx + 1 < leftPool.length) {
          p1 = leftPool[leftIdx++];
          p2 = leftPool[leftIdx++];
        }
      } else {
        if (rightIdx + 1 < rightPool.length) {
          p1 = rightPool[rightIdx++];
          p2 = rightPool[rightIdx++];
        }
      }
    }

    const created = await prisma.tb_match.create({
      data: {
        id_bagan: baganId, ronde: 1, position: pos,
        stage_name: r1Stage, // ⭐ ABSOLUTE STAGE NAME!
        id_peserta_a: p1?.id ?? null, id_peserta_b: p2?.id ?? null,
        skor_a: 0, skor_b: 0,
      },
    });

    matches.push({
      id: created.id_match, round: 1, position: pos,
      participant1: p1, participant2: p2, status,
      scoreA: 0, scoreB: 0,
    });
  }

  // ⭐ CREATE PLACEHOLDER ROUNDS (R2+) WITH ABSOLUTE STAGE NAME
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = Math.pow(2, totalRounds - round);
    const stageName = this.determineAbsoluteStageName(matchCount); // ⭐ ABSOLUTE!
    
    console.log(`   Round ${round}: ${matchCount} matches → Stage: ${stageName}`);
    
    for (let i = 0; i < matchCount; i++) {
      const created = await prisma.tb_match.create({
        data: {
          id_bagan: baganId, ronde: round, position: i,
          stage_name: stageName, // ⭐ ABSOLUTE STAGE NAME!
          id_peserta_a: null, id_peserta_b: null,
          skor_a: 0, skor_b: 0,
        },
      });
      matches.push({
        id: created.id_match, round, position: i,
        participant1: null, participant2: null,
        status: "pending", scoreA: 0, scoreB: 0,
      });
    }
  }

  // Auto-advance BYEs
  for (const m of matches.filter(x => x.round === 1)) {
    if (m.participant1 && !m.participant2 && m.id) {
      await this.advanceWinnerToNextRound(
        { id_bagan: baganId, ronde: 1, id_match: m.id },
        m.participant1.id
      );
    }
  }

  console.log(`✅ Generated ${matches.length} matches\n`);
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

/**
 * Validate PEMULA dojang separation
 * Formula: If maxDojangSize >= ceil(n/2) + 1, same-dojang match is UNAVOIDABLE
 */
static validatePemulaSeparation(participants: Participant[]): {
  isUnavoidable: boolean;
  maxDojangName: string;
  maxDojangSize: number;
  threshold: number;
  minSameDojangMatches: number;
  warnings: string[];
} {
  const dojangGroups = this.groupByDojang(participants);
  const totalParticipants = participants.length;
  
  // ⭐ THRESHOLD: ceil(n/2) + 1
  const threshold = Math.ceil(totalParticipants / 2) + 1;
  
  let maxDojangSize = 0;
  let maxDojangName = '';
  
  for (const [dojangName, members] of dojangGroups) {
    if (members.length > maxDojangSize) {
      maxDojangSize = members.length;
      maxDojangName = dojangName || 'UNKNOWN';
    }
  }
  
  const isUnavoidable = maxDojangSize >= threshold;
  const minSameDojangMatches = isUnavoidable 
    ? maxDojangSize - (totalParticipants - maxDojangSize)
    : 0;
  
  const warnings: string[] = [];
  
  if (isUnavoidable) {
    warnings.push(
      `⚠️ PEMULA STRICT MODE - Same-Dojang Match Unavoidable:`,
      ``,
      `   📊 Breakdown:`,
      `      • Total participants: ${totalParticipants}`,
      `      • Threshold: ceil(${totalParticipants}/2) + 1 = ${threshold}`,
      `      • Dojang "${maxDojangName}": ${maxDojangSize} members (≥ ${threshold})`,
      `      • Minimal ${minSameDojangMatches} same-dojang match(es) TIDAK DAPAT DIHINDARI`,
      ``,
      `   ✅ Status: DIPERBOLEHKAN (mathematically impossible)`,
      ``
    );
  }
  
  // ⭐ Special case: All from same dojang
  if (dojangGroups.size === 1) {
    warnings.push(
      `ℹ️ Semua peserta berasal dari dojang yang sama ("${maxDojangName}")`,
      `   → Shuffle tidak akan mengubah hasil (semua match pasti same-dojang)`,
      ``
    );
  }
  
  return {
    isUnavoidable,
    maxDojangName,
    maxDojangSize,
    threshold,
    minSameDojangMatches,
    warnings
  };
}

// ==========================================
// 2️⃣ OPTIMAL PAIRING ALGORITHM
// ==========================================

/**
 * Find optimal pairing for PEMULA
 * Uses maximum matching approach to minimize same-dojang matches
 */
static findOptimalPemulaPairing(
  participants: Participant[]
): {
  pairs: [Participant, Participant][]; // Matched pairs
  byeParticipant: Participant | null;  // Odd one out
  hasSameDojangMatch: boolean;         // Any same-dojang pairs?
  sameDojangCount: number;             // How many same-dojang pairs
  summary: string;
} {
  const totalParticipants = participants.length;
  const isOdd = totalParticipants % 2 === 1;
  
  console.log(`\n🎯 === PEMULA OPTIMAL PAIRING (STRICT) ===`);
  console.log(`   Total participants: ${totalParticipants}`);
  
  // ⭐ STEP 1: Separate BYE participant (if odd)
  let workingList = [...participants];
  let byeParticipant: Participant | null = null;
  
  if (isOdd) {
    // Random selection for BYE
    const byeIndex = Math.floor(Math.random() * workingList.length);
    byeParticipant = workingList.splice(byeIndex, 1)[0];
    console.log(`   🎲 BYE participant: ${byeParticipant.name} (${byeParticipant.dojang})`);
  }
  
  // ⭐ STEP 2: Group by dojang
  const dojangGroups = this.groupByDojang(workingList);
  
  console.log(`\n   📊 Dojang distribution:`);
  for (const [dojang, members] of dojangGroups) {
    console.log(`      ${dojang}: ${members.length} members`);
  }
  
  // ⭐ STEP 3: Build pairing with priority (different dojangs first)
  const pairs: [Participant, Participant][] = [];
  const used = new Set<number>();
  
  console.log(`\n   🔄 Phase 1: Pairing DIFFERENT dojangs...`);
  
  // Phase 1: Pair DIFFERENT dojangs
  for (const [dojang1, members1] of dojangGroups) {
    for (const p1 of members1) {
      if (used.has(p1.id)) continue;
      
      // Find best partner from DIFFERENT dojang
      let bestPartner: Participant | null = null;
      
      for (const [dojang2, members2] of dojangGroups) {
        if (dojang1 === dojang2) continue; // Skip same dojang
        
        const availablePartner = members2.find(p2 => !used.has(p2.id));
        if (availablePartner) {
          bestPartner = availablePartner;
          break;
        }
      }
      
      if (bestPartner) {
        pairs.push([p1, bestPartner]);
        used.add(p1.id);
        used.add(bestPartner.id);
        console.log(`      ✅ ${p1.name} (${p1.dojang}) vs ${bestPartner.name} (${bestPartner.dojang})`);
      }
    }
  }
  
  // Phase 2: Handle remaining (same-dojang if necessary)
  const remaining = workingList.filter(p => !used.has(p.id));
  
  if (remaining.length > 0) {
    console.log(`\n   ⚠️ Phase 2: Pairing remaining ${remaining.length} participants...`);
    
    for (let i = 0; i < remaining.length - 1; i += 2) {
      const p1 = remaining[i];
      const p2 = remaining[i + 1];
      pairs.push([p1, p2]);
      
      const isSameDojang = p1.dojang === p2.dojang;
      console.log(
        `      ${isSameDojang ? '⚠️' : '✅'} ${p1.name} (${p1.dojang}) vs ${p2.name} (${p2.dojang})`
      );
    }
  }
  
  // ⭐ STEP 4: Calculate results
  const sameDojangPairs = pairs.filter(([p1, p2]) => p1.dojang === p2.dojang);
  const hasSameDojangMatch = sameDojangPairs.length > 0;
  
  const summary = [
    `Total pairs: ${pairs.length}`,
    `Same-dojang: ${sameDojangPairs.length}`,
    `Different-dojang: ${pairs.length - sameDojangPairs.length}`,
    byeParticipant ? `BYE: ${byeParticipant.name}` : ''
  ].filter(Boolean).join(' | ');
  
  console.log(`\n   📊 Summary: ${summary}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  return {
    pairs,
    byeParticipant,
    hasSameDojangMatch,
    sameDojangCount: sameDojangPairs.length,
    summary
  };
}


static async generatePemulaBracket(
  baganId: number, 
  participants: Participant[],
  dojangSeparation?: { enabled: boolean; mode?: 'STRICT' | 'BALANCED' }
): Promise<Match[]> {
  const matches: Match[] = [];
  console.log(`\n🥋 === GENERATING PEMULA BRACKET (STRICT) ===`);

  // ⭐ FORCE STRICT mode for Pemula (ignore mode parameter)
  const separationEnabled = dojangSeparation?.enabled || false;
  
  console.log(`   Dojang Separation: ${separationEnabled ? 'ENABLED (STRICT)' : 'DISABLED'}`);
  console.log(`   Total participants: ${participants.length}\n`);

  // ⭐ STEP 1: VALIDATE separation possibility
  let isUnavoidable = false;
  
  if (separationEnabled) {
    const validation = this.validatePemulaSeparation(participants);
    isUnavoidable = validation.isUnavoidable;
    
    // Show warnings (if unavoidable or all same dojang)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(w => console.log(w));
    }
  }

  // ⭐ STEP 2: PAIRING
  let workingList: Participant[] = [];
  let byeParticipant: Participant | null = null;
  
  if (separationEnabled) {
    // ⭐ Use optimal pairing algorithm
    const pairingResult = this.findOptimalPemulaPairing(participants);
    
    // Convert pairs to flat list for match creation
    for (const [p1, p2] of pairingResult.pairs) {
      workingList.push(p1, p2);
    }
    
    byeParticipant = pairingResult.byeParticipant;
    
    // ⭐ CRITICAL CHECK: If STRICT mode + has same-dojang + NOT unavoidable → ERROR
    if (pairingResult.hasSameDojangMatch && !isUnavoidable) {
      throw new Error(
        `❌ STRICT MODE ERROR: Terdeteksi ${pairingResult.sameDojangCount} same-dojang match(es)!\n\n` +
        `Pairing algorithm gagal menghindari same-dojang match.\n` +
        `Ini tidak seharusnya terjadi (seharusnya bisa dihindari).\n\n` +
        `Saran:\n` +
        `  • Coba shuffle ulang bracket\n` +
        `  • Atau disable dojang separation\n` +
        `  • Atau hubungi developer jika masalah terus terjadi`
      );
    }
    
  } else {
    // ⭐ No dojang separation - random shuffle
    console.log(`   🎲 Random shuffle (no dojang separation)...`);
    workingList = this.shuffleArray([...participants]);
    
    if (participants.length % 2 === 1) {
      byeParticipant = workingList.pop() || null;
    }
  }

  // ⭐ STEP 3: CREATE MATCHES (existing logic)
  const totalParticipants = workingList.length;
  const normalPairsCount = Math.floor(totalParticipants / 2);
  
  console.log(`\n   🎮 Creating matches...`);
  
  for (let i = 0; i < normalPairsCount; i++) {
    const p1 = workingList[i * 2];
    const p2 = workingList[i * 2 + 1];
    
    // ⭐⭐⭐ CRITICAL FIX: ADD POSITION FIELD! ⭐⭐⭐
    const match = await prisma.tb_match.create({
      data: { 
        id_bagan: baganId, 
        ronde: 1,
        position: i,  // ← ⭐ ADD THIS LINE!
        id_peserta_a: p1.id, 
        id_peserta_b: p2.id, 
        skor_a: 0, 
        skor_b: 0 
      }
    });
    
    matches.push({ 
      id: match.id_match, 
      round: 1, 
      position: i, 
      participant1: p1, 
      participant2: p2, 
      status: 'pending', 
      scoreA: 0, 
      scoreB: 0 
    });
    
    const isSameDojang = p1.dojang === p2.dojang;
    console.log(
      `   Match ${i + 1}: ${p1.name} (${p1.dojang}) vs ${p2.name} (${p2.dojang}) ` +
      `${isSameDojang ? '⚠️ SAME DOJANG' : '✅'}`
    );
  }

  // Handle BYE participant (if exists)
  if (byeParticipant) {
    // ⭐ FIX: ADD POSITION FIELD!
    const byeMatch = await prisma.tb_match.create({
      data: { 
        id_bagan: baganId, 
        ronde: 1,
        position: normalPairsCount,  // ← ⭐ ADD THIS LINE!
        id_peserta_a: byeParticipant.id, 
        id_peserta_b: null, 
        skor_a: 0, 
        skor_b: 0 
      }
    });
    
    matches.push({ 
      id: byeMatch.id_match, 
      round: 1, 
      position: normalPairsCount, 
      participant1: byeParticipant, 
      participant2: null, 
      status: 'bye', 
      scoreA: 0, 
      scoreB: 0 
    });
    
    console.log(`   Match ${normalPairsCount + 1}: ${byeParticipant.name} (BYE)`);
    
    // Create additional match for BYE winner (if more than 1 match exists)
    if (matches.length > 1) {
      // ⭐ FIX: ADD POSITION FIELD!
      const additionalMatch = await prisma.tb_match.create({
        data: { 
          id_bagan: baganId, 
          ronde: 2,
          position: 0,  // ← ⭐ ADD THIS LINE!
          id_peserta_a: null, 
          id_peserta_b: byeParticipant.id, 
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
      
      console.log(`   Round 2: TBD vs ${byeParticipant.name} (BYE advanced)`);
    }
  }
  
  console.log(`\n✅ PEMULA bracket generated: ${matches.length} total matches`);
  console.log(`   Dojang separation: ${separationEnabled ? 'STRICT ✅' : 'DISABLED'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
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
            { position: 'asc' }  // ⭐ IMPORTANT: Sort by position
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

    // ⭐ Transform matches WITH metadata
    const matches: Match[] = bagan.match.map(match => {
      const hasParticipant1 = !!match.peserta_a;
      const hasParticipant2 = !!match.peserta_b;
      
      return {
        id: match.id_match,
        round: match.ronde,
        position: match.position ?? 0,
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
        nomorAntrian: match.nomor_antrian,
        nomorLapangan: match.nomor_lapangan,
        
        // ⭐ ADD METADATA FOR SCHEDULING
        stageName: match.stage_name || undefined,
        bracketParticipantCount: participants.length,
        kelasKejuaraanId: kelasKejuaraanId
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
 * 🆕 HELPER: Remove participant from next round
 * Called when winner changes (score edited)
 */
static async removeFromNextRound(match: any, participantId: number): Promise<void> {
  const nextRound = match.ronde + 1;
  
  console.log(`\n🗑️ === REMOVING OLD WINNER FROM NEXT ROUND ===`);
  console.log(`   Participant ID: ${participantId}`);
  console.log(`   Current Round: ${match.ronde}`);
  console.log(`   Next Round: ${nextRound}`);
  
  // ⭐ Check if this is final round (no next round)
  const nextRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: nextRound
    },
    orderBy: { position: 'asc' }
  });
  
  if (nextRoundMatches.length === 0) {
    console.log(`   ℹ️ No next round (this was the final) - nothing to remove`);
    return;
  }
  
  // Find which match contains this participant
  for (const nextMatch of nextRoundMatches) {
    let removed = false;
    
    if (nextMatch.id_peserta_a === participantId) {
      await prisma.tb_match.update({
        where: { id_match: nextMatch.id_match },
        data: { id_peserta_a: null, skor_a: 0 } // Reset score too!
      });
      console.log(`   ✅ Removed from Match ${nextMatch.id_match} (Slot A)`);
      removed = true;
    }
    
    if (nextMatch.id_peserta_b === participantId) {
      await prisma.tb_match.update({
        where: { id_match: nextMatch.id_match },
        data: { id_peserta_b: null, skor_b: 0 } // Reset score too!
      });
      console.log(`   ✅ Removed from Match ${nextMatch.id_match} (Slot B)`);
      removed = true;
    }
    
    if (removed) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      return;
    }
  }
  
  console.log(`   ⚠️ Participant not found in next round (might be BYE or not advanced yet)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

static async clearScheduling(
  kompetisiId: number, 
  kelasKejuaraanId: number
): Promise<{
  success: boolean;
  message: string;
  clearedMatches: number;
}> {
  try {
    console.log(`\n🧹 === CLEARING SCHEDULING DATA ===`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);

    // Find bagan
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

    console.log(`   Total matches: ${bagan.match.length}`);

    // Update ALL matches - clear scheduling data
    await prisma.tb_match.updateMany({
      where: { id_bagan: bagan.id_bagan },
      data: {
        nomor_antrian: null,
        nomor_lapangan: null,
        nomor_partai: null,
        tanggal_pertandingan: null
      }
    });

    console.log(`   ✅ Cleared scheduling for ${bagan.match.length} matches`);
    console.log(`      • nomor_antrian → NULL`);
    console.log(`      • nomor_lapangan → NULL`);
    console.log(`      • nomor_partai → NULL`);
    console.log(`      • tanggal_pertandingan → NULL`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      success: true,
      message: `Berhasil menghapus scheduling untuk ${bagan.match.length} pertandingan`,
      clearedMatches: bagan.match.length
    };
  } catch (error: any) {
    console.error('❌ Error clearing scheduling:', error);
    throw new Error(error.message || 'Gagal menghapus scheduling');
  }
}

/**
 * 🔄 UPDATED: Update match with smart winner replacement
 * Supports:
 * - Result updates (scores + winner detection)
 * - Schedule updates (queue fields)
 * - Automatic winner replacement when scores change
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
    console.log(`\n🔄 === UPDATE MATCH ${matchId} ===`);
    
    // ⭐ STEP 0: Fetch ORIGINAL match data (before update)
    const matchBeforeUpdate = await prisma.tb_match.findUnique({
      where: { id_match: matchId },
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

    if (!matchBeforeUpdate) {
      throw new Error('Match tidak ditemukan');
    }

    // ⭐ Calculate OLD winner (before update)
    const oldWinnerId = matchBeforeUpdate.skor_a > matchBeforeUpdate.skor_b
      ? matchBeforeUpdate.id_peserta_a
      : matchBeforeUpdate.skor_b > matchBeforeUpdate.skor_a
        ? matchBeforeUpdate.id_peserta_b
        : null;

    console.log(`   📊 Before update:`);
    console.log(`      Scores: ${matchBeforeUpdate.skor_a} - ${matchBeforeUpdate.skor_b}`);
    console.log(`      Old Winner: ${oldWinnerId || 'NONE'}`);

    const updateData: any = {};
    
    // ⭐ MODE DETECTION
    const isResultUpdate = scoreA !== undefined || scoreB !== undefined;
    const isScheduleUpdate = nomorAntrian !== undefined || nomorLapangan !== undefined || tanggalPertandingan !== undefined;
    
    console.log(`   🎯 Update mode: ${isResultUpdate ? 'RESULT' : ''} ${isScheduleUpdate ? 'SCHEDULE' : ''}`);

    // ⭐ RESULT UPDATE - Update scores
    if (isResultUpdate) {
      updateData.skor_a = scoreA ?? matchBeforeUpdate.skor_a;
      updateData.skor_b = scoreB ?? matchBeforeUpdate.skor_b;
      
      console.log(`   📊 New scores: ${updateData.skor_a} - ${updateData.skor_b}`);
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
    
    // ⭐ AUTO-GENERATE nomor_partai
    if (nomorAntrian !== null && nomorAntrian !== undefined && 
        nomorLapangan !== null && nomorLapangan !== undefined) {
      updateData.nomor_partai = `${nomorAntrian}${nomorLapangan}`;
      console.log(`   🎯 Auto-generated nomor_partai: ${updateData.nomor_partai}`);
    } else if (nomorAntrian === null && nomorLapangan === null) {
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

    // ⭐⭐⭐ SMART WINNER REPLACEMENT LOGIC ⭐⭐⭐
    if (isResultUpdate) {
      // ⭐ Calculate NEW winner (from updated scores)
      const newWinnerId = updatedMatch.skor_a > updatedMatch.skor_b
        ? updatedMatch.id_peserta_a
        : updatedMatch.skor_b > updatedMatch.skor_a
          ? updatedMatch.id_peserta_b
          : null;

      console.log(`\n   🏆 Winner analysis:`);
      console.log(`      Old Winner: ${oldWinnerId || 'NONE'}`);
      console.log(`      New Winner: ${newWinnerId || 'NONE'}`);

      // ⭐ CRITICAL CHECK: Did winner change?
      if (oldWinnerId !== newWinnerId) {
        console.log(`   ⚠️ WINNER CHANGED! Updating next round...`);

        // STEP 1: Remove old winner from next round (if exists)
        if (oldWinnerId) {
          console.log(`   🗑️ Removing old winner ${oldWinnerId}...`);
          await this.removeFromNextRound(updatedMatch, oldWinnerId);
        }

        // STEP 2: Advance new winner to next round (if exists)
        if (newWinnerId) {
          console.log(`   ➡️ Advancing new winner ${newWinnerId}...`);
          await this.advanceWinnerToNextRound(updatedMatch, newWinnerId);
        } else {
          console.log(`   ℹ️ No new winner (draw or 0-0) - next round remains empty`);
        }

        console.log(`   ✅ Winner replacement completed!`);
      } else {
        console.log(`   ✅ Winner unchanged - no next round update needed`);
        
        // ⭐ BUT: If this is first time setting scores (0-0 → winner)
        if (oldWinnerId === null && newWinnerId !== null) {
          console.log(`   ℹ️ First score entry - advancing winner...`);
          await this.advanceWinnerToNextRound(updatedMatch, newWinnerId);
        }
      }
    }

    console.log(`\n✅ Match ${matchId} updated successfully\n`);

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
    throw new Error(error.message || 'Failed to update match');
  }
} 

/**
 * 🆕 BONUS: Validate and fix next round consistency
 * Call this after bulk updates or data import
 */
static async validateAndFixNextRound(baganId: number, round: number): Promise<{
  valid: boolean;
  fixed: number;
  errors: string[];
}> {
  console.log(`\n🔍 === VALIDATING NEXT ROUND CONSISTENCY ===`);
  console.log(`   Bagan: ${baganId}, Round: ${round}`);
  
  const errors: string[] = [];
  let fixedCount = 0;
  
  // Get current round matches
  const currentRoundMatches = await prisma.tb_match.findMany({
    where: { id_bagan: baganId, ronde: round },
    orderBy: { position: 'asc' }
  });
  
  // Get next round matches
  const nextRoundMatches = await prisma.tb_match.findMany({
    where: { id_bagan: baganId, ronde: round + 1 },
    orderBy: { position: 'asc' }
  });
  
  if (nextRoundMatches.length === 0) {
    console.log(`   ✅ No next round (final round)`);
    return { valid: true, fixed: 0, errors: [] };
  }
  
  // Validate each current round match
  for (let i = 0; i < currentRoundMatches.length; i++) {
    const match = currentRoundMatches[i];
    const nextMatchIndex = Math.floor(i / 2);
    const isFirstSlot = i % 2 === 0;
    const nextMatch = nextRoundMatches[nextMatchIndex];
    
    if (!nextMatch) continue;
    
    // Determine winner
    const winner = match.skor_a > match.skor_b
      ? match.id_peserta_a
      : match.skor_b > match.skor_a
        ? match.id_peserta_b
        : null;
    
    // Check if winner is correctly placed in next round
    const expectedSlot = isFirstSlot ? nextMatch.id_peserta_a : nextMatch.id_peserta_b;
    
    if (winner !== expectedSlot) {
      errors.push(
        `Match ${match.id_match}: Winner ${winner} not in next round ` +
        `(expected slot ${isFirstSlot ? 'A' : 'B'} of Match ${nextMatch.id_match})`
      );
      
      // Auto-fix
      const updateData = isFirstSlot
        ? { id_peserta_a: winner }
        : { id_peserta_b: winner };
      
      await prisma.tb_match.update({
        where: { id_match: nextMatch.id_match },
        data: updateData
      });
      
      fixedCount++;
      console.log(`   🔧 Fixed: Match ${nextMatch.id_match} slot ${isFirstSlot ? 'A' : 'B'} = ${winner}`);
    }
  }
  
  console.log(`\n   📊 Validation result:`);
  console.log(`      Errors found: ${errors.length}`);
  console.log(`      Auto-fixed: ${fixedCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  return {
    valid: errors.length === 0,
    fixed: fixedCount,
    errors
  };
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
  
if (isPemula && currentRound === 1) {
  console.log(`\n🥋 === PEMULA ADVANCE LOGIC ===`);
  console.log(`   Current match ID: ${match.id_match}`);
  
  const round1Matches = await prisma.tb_match.findMany({
    where: {
      id_bagan: match.id_bagan,
      ronde: 1
    },
    orderBy: { id_match: 'asc' }
  });
  
  console.log(`   Total Round 1 matches: ${round1Matches.length}`);
  console.log(`   Match IDs:`, round1Matches.map(m => m.id_match));
  
  const round2Match = await prisma.tb_match.findFirst({
    where: {
      id_bagan: match.id_bagan,
      ronde: 2
    }
  });
  
  if (round2Match && round1Matches.length > 0) {
    // ⭐ Find BYE match
    const byeMatch = round1Matches.find(m => m.id_peserta_a && !m.id_peserta_b);
    
    if (!byeMatch) {
      console.log(`   ℹ️ No BYE match found - no additional match needed`);
      return;
    }
    
    console.log(`   BYE match ID: ${byeMatch.id_match}`);
    
    // ⭐ Find LAST NORMAL FIGHT match (sebelum BYE)
    const byeIndex = round1Matches.findIndex(m => m.id_match === byeMatch.id_match);
    console.log(`   BYE match index: ${byeIndex}`);
    
    if (byeIndex <= 0) {
      console.log(`   ⚠️ BYE match is first (index ${byeIndex}) - no last normal fight match`);
      return;
    }
    
    const lastNormalFightMatch = round1Matches[byeIndex - 1];
    console.log(`   Last normal fight match ID: ${lastNormalFightMatch.id_match}`);
    console.log(`   Checking: ${match.id_match} === ${lastNormalFightMatch.id_match}?`);
    
    // ⭐ CRITICAL CHECK: Is this match the LAST NORMAL FIGHT?
    if (match.id_match === lastNormalFightMatch.id_match) {
      console.log(`   ✅ YES! This is the LAST normal fight → Advance to Additional Match`);
      
      await prisma.tb_match.update({
        where: { id_match: round2Match.id_match },
        data: { id_peserta_a: winnerId }
      });
      
      console.log(`   ✅ Winner ${winnerId} placed in Additional Match (Slot A)`);
      console.log(`═══════════════════════════════════════\n`);
      return;
    } else {
      console.log(`   ❌ NO! This is NOT the last normal fight`);
      console.log(`      Current match: ${match.id_match}`);
      console.log(`      Last match should be: ${lastNormalFightMatch.id_match}`);
      console.log(`   → Winner stays in Round 1 (DO NOT ADVANCE)`);
      console.log(`═══════════════════════════════════════\n`);
      return;
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

static async shuffleBracket(
  kompetisiId: number, 
  kelasKejuaraanId: number,
  participantIds?: number[],
  dojangSeparation?: { enabled: boolean; mode: 'STRICT' | 'BALANCED' } // ⭐ TAMBAHKAN INI
): Promise<Bracket> {
  try {
    console.log(`\n🔀 Shuffling PRESTASI bracket...`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);
    console.log(`   Dojang Separation:`, dojangSeparation);

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

    // ⭐ STEP 2: GENERATE NEW BRACKET dengan dojang separation
    console.log(`   🎲 Generating new bracket...`);
    const newBracket = await this.generateBracket(
      kompetisiId, 
      kelasKejuaraanId, 
      undefined, 
      dojangSeparation // ⭐ PASS DOJANG SEPARATION
    );
    
    console.log(`   ✅ New bracket generated with ${newBracket.matches.length} matches`);
    return newBracket;

  } catch (error: any) {
    console.error('❌ Error shuffling bracket:', error);
    throw new Error(error.message || 'Failed to shuffle bracket');
  }
}

static async shufflePemulaBracket(
  kompetisiId: number,
  kelasKejuaraanId: number,
  dojangSeparation?: { enabled: boolean; mode?: 'STRICT' | 'BALANCED' }
): Promise<Bracket> {
  try {
    console.log(`\n🔀 === SHUFFLING PEMULA BRACKET ===`);
    console.log(`   Kompetisi: ${kompetisiId}, Kelas: ${kelasKejuaraanId}`);
    console.log(`   ⭐ Dojang Separation Input:`, dojangSeparation);

    // ✅ FIX: Normalize dengan explicit check
    const normalizedSeparation = dojangSeparation?.enabled
      ? { enabled: true, mode: 'STRICT' as const }
      : undefined;

    console.log(`   ⭐ Normalized Separation:`, normalizedSeparation);

    // Check for existing bracket with scores
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
      const hasScores = await prisma.tb_match.findFirst({
        where: {
          id_bagan: existingBagan.id_bagan,
          OR: [
            { skor_a: { gt: 0 } },
            { skor_b: { gt: 0 } }
          ]
        }
      });

      if (hasScores) {
        throw new Error('Tidak dapat shuffle! Ada pertandingan yang sudah memiliki skor.');
      }
      
      console.log(`   🗑️ Deleting existing bracket...`);
      
      await prisma.tb_match.deleteMany({
        where: { id_bagan: existingBagan.id_bagan }
      });

      await prisma.tb_drawing_seed.deleteMany({
        where: { id_bagan: existingBagan.id_bagan }
      });

      await prisma.tb_bagan.delete({
        where: { id_bagan: existingBagan.id_bagan }
      });

      console.log(`   ✅ Bracket deleted`);
    }

    console.log(`   🎲 Generating new bracket with separation:`, normalizedSeparation);
    
    const newBracket = await this.generateBracket(
      kompetisiId,
      kelasKejuaraanId,
      undefined,
      normalizedSeparation // ✅ Now properly passed
    );
    
    console.log(`   ✅ New bracket generated with ${newBracket.matches.length} matches`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return newBracket;

  } catch (error: any) {
    console.error('❌ Error shuffling PEMULA bracket:', error);
    throw new Error(error.message || 'Gagal shuffle bracket');
  }
}

/**
 * 🆕 Assign athlete to match with ROBUST cascading (bidirectional)
 * Handles:
 * - Forward cascade: R1 BYE → R2
 * - Reverse cascade: R2 → R1 BYE
 * - Swap cascade: R1 BYE ↔ R1 BYE
 * - Prevent over-advancement
 */
static async assignAthleteToMatch(
  matchId: number,
  slot: 'A' | 'B',
  newParticipantId: number,
  kelasKejuaraanId: number
): Promise<{
  success: boolean;
  swapped: boolean;
  swappedMatch?: {
    id: number;
    position: number;
    round: number;
  };
  message: string;
  updatedMatches: Match[];
}> {
  try {
    console.log(`\n🔄 === ASSIGN ATHLETE TO MATCH ===`);
    console.log(`   Match ID: ${matchId}`);
    console.log(`   Slot: ${slot}`);
    console.log(`   New Participant ID: ${newParticipantId}`);
    console.log(`   Kelas ID: ${kelasKejuaraanId}`);

    // ⭐ STEP 1: Validate match exists and get full data
    const targetMatch = await prisma.tb_match.findUnique({
      where: { id_match: matchId },
      include: {
        bagan: {
          include: {
            kelas_kejuaraan: {
              include: {
                kategori_event: true
              }
            }
          }
        },
        peserta_a: {
          include: {
            atlet: {
              include: {
                dojang: true
              }
            },
            anggota_tim: {
              include: {
                atlet: true
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
                atlet: true
              }
            }
          }
        }
      }
    });

    if (!targetMatch) {
      throw new Error('Match tidak ditemukan');
    }

    if (targetMatch.bagan.id_kelas_kejuaraan !== kelasKejuaraanId) {
      throw new Error('Match tidak termasuk dalam kelas kejuaraan ini');
    }

    console.log(`   ✅ Match found: Round ${targetMatch.ronde}, Position ${targetMatch.position ?? 0}`);

    // ⭐ STEP 1.5: Detect category (PEMULA or PRESTASI)
    const isPemula = targetMatch.bagan.kelas_kejuaraan?.kategori_event?.nama_kategori
      ?.toLowerCase()
      .includes('pemula') || false;

    console.log(`   📊 Category: ${isPemula ? 'PEMULA' : 'PRESTASI'}`);

    // ⭐ STEP 2: Validate match not started
    if (targetMatch.skor_a > 0 || targetMatch.skor_b > 0) {
      throw new Error('Tidak dapat mengubah peserta - pertandingan sudah dimulai');
    }

    console.log(`   ✅ Match not started (scores: ${targetMatch.skor_a}-${targetMatch.skor_b})`);

    // ⭐ STEP 3: Validate new participant
    const newParticipant = await prisma.tb_peserta_kompetisi.findUnique({
      where: { id_peserta_kompetisi: newParticipantId },
      include: {
        atlet: {
          include: {
            dojang: true
          }
        },
        anggota_tim: {
          include: {
            atlet: true
          }
        }
      }
    });

    if (!newParticipant) {
      throw new Error('Peserta tidak ditemukan');
    }

    if (newParticipant.id_kelas_kejuaraan !== kelasKejuaraanId) {
      throw new Error('Peserta tidak terdaftar di kelas kejuaraan ini');
    }

    if (newParticipant.status !== 'APPROVED') {
      throw new Error('Hanya peserta APPROVED yang dapat di-assign ke match');
    }

    console.log(`   ✅ New participant validated: ${newParticipant.atlet?.nama_atlet || 'Team'}`);

    // ⭐ STEP 4: Check if participant already in this match
    if (targetMatch.id_peserta_a === newParticipantId || targetMatch.id_peserta_b === newParticipantId) {
      throw new Error('Peserta sudah ada di match ini');
    }

    // ⭐ STEP 5: Check for BYE slot
    const isByeMatch = !targetMatch.id_peserta_a || !targetMatch.id_peserta_b;
    
    if (isByeMatch) {
      console.log(`   ⚠️ BYE match detected`);
      
      // Don't allow editing the BYE slot itself
      if (slot === 'A' && !targetMatch.id_peserta_a) {
        throw new Error('Tidak dapat assign ke slot BYE (Slot A kosong)');
      }
      if (slot === 'B' && !targetMatch.id_peserta_b) {
        throw new Error('Tidak dapat assign ke slot BYE (Slot B kosong)');
      }
    }

    // ⭐ STEP 6: Check if participant already in another match (SAME ROUND)
    const existingMatch = await prisma.tb_match.findFirst({
      where: {
        id_bagan: targetMatch.id_bagan,
        ronde: targetMatch.ronde,
        id_match: { not: matchId },
        OR: [
          { id_peserta_a: newParticipantId },
          { id_peserta_b: newParticipantId }
        ]
      }
    });

    let swappedMatchInfo: { id: number; position: number; round: number } | undefined;
    let swapped = false;

    // Store old participant ID for cascade
    const oldParticipantId = slot === 'A' ? targetMatch.id_peserta_a : targetMatch.id_peserta_b;

    if (existingMatch) {
      // ⭐ SMART SWAP LOGIC
      console.log(`\n   🔄 Participant already in Match ${existingMatch.id_match} (Round ${existingMatch.ronde})`);
      console.log(`   Executing SMART SWAP...`);

      const isInSlotA = existingMatch.id_peserta_a === newParticipantId;
      const currentOccupiedSlot = isInSlotA ? 'A' : 'B';

      const swappedOutParticipantId = slot === 'A' 
        ? targetMatch.id_peserta_a 
        : targetMatch.id_peserta_b;

      if (!swappedOutParticipantId) {
        throw new Error('Tidak dapat swap - slot target kosong (BYE)');
      }

      console.log(`   📍 Current participant in target slot: ${swappedOutParticipantId}`);
      console.log(`   📍 Will be moved to Match ${existingMatch.id_match}, Slot ${currentOccupiedSlot}`);

      // Update existing match
      await prisma.tb_match.update({
        where: { id_match: existingMatch.id_match },
        data: {
          [currentOccupiedSlot === 'A' ? 'id_peserta_a' : 'id_peserta_b']: swappedOutParticipantId
        }
      });

      // Update target match
      await prisma.tb_match.update({
        where: { id_match: matchId },
        data: {
          [slot === 'A' ? 'id_peserta_a' : 'id_peserta_b']: newParticipantId
        }
      });

      swappedMatchInfo = {
        id: existingMatch.id_match,
        position: existingMatch.position ?? 0,
        round: existingMatch.ronde
      };
      swapped = true;

      console.log(`   ✅ SWAP completed successfully`);

    } else {
      // ⭐ DIRECT ASSIGNMENT
      console.log(`\n   ✅ No conflict - Direct assignment`);

      await prisma.tb_match.update({
        where: { id_match: matchId },
        data: {
          [slot === 'A' ? 'id_peserta_a' : 'id_peserta_b']: newParticipantId
        }
      });

      console.log(`   ✅ Assignment completed`);
    }

// ⭐ ========================================
// ⭐ ROBUST BIDIRECTIONAL CASCADE SYSTEM
// ⭐ ========================================
    
console.log(`\n🔗 === ROBUST CASCADE SYSTEM ===`);

// ⭐ PHASE 1: COLLECT ALL AFFECTED MATCHES
const affectedMatches = new Map<number, {
  matchId: number;
  position: number;
  round: number;
  beforeParticipantA: number | null;
  beforeParticipantB: number | null;
  afterParticipantA: number | null;
  afterParticipantB: number | null;
}>();

// ⭐ RE-FETCH target match untuk dapat position yang BENAR
const freshTargetMatch = await prisma.tb_match.findUnique({
  where: { id_match: matchId },
  select: {
    id_match: true,
    position: true,
    ronde: true,
    id_peserta_a: true,
    id_peserta_b: true
  }
});

if (!freshTargetMatch) {
  throw new Error('Failed to fetch target match');
}

// Add TARGET match
affectedMatches.set(matchId, {
  matchId,
  position: freshTargetMatch.position ?? 0, // ← USE FRESH DATA!
  round: freshTargetMatch.ronde,
  beforeParticipantA: targetMatch.id_peserta_a,
  beforeParticipantB: targetMatch.id_peserta_b,
  afterParticipantA: slot === 'A' ? newParticipantId : targetMatch.id_peserta_a,
  afterParticipantB: slot === 'B' ? newParticipantId : targetMatch.id_peserta_b
});

// Add EXISTING match (if swapped)
if (swapped && existingMatch) {
  // ⭐ RE-FETCH existing match untuk dapat position yang BENAR
  const freshExistingMatch = await prisma.tb_match.findUnique({
    where: { id_match: existingMatch.id_match },
    select: {
      id_match: true,
      position: true,
      ronde: true,
      id_peserta_a: true,
      id_peserta_b: true
    }
  });

  if (!freshExistingMatch) {
    throw new Error('Failed to fetch existing match');
  }

  const swappedOutId = slot === 'A' ? targetMatch.id_peserta_a : targetMatch.id_peserta_b;
  const isInSlotA = existingMatch.id_peserta_a === newParticipantId;
  
  affectedMatches.set(existingMatch.id_match, {
    matchId: existingMatch.id_match,
    position: freshExistingMatch.position ?? 0, // ← USE FRESH DATA!
    round: freshExistingMatch.ronde,
    beforeParticipantA: existingMatch.id_peserta_a,
    beforeParticipantB: existingMatch.id_peserta_b,
    afterParticipantA: isInSlotA ? swappedOutId : existingMatch.id_peserta_a,
    afterParticipantB: !isInSlotA ? swappedOutId : existingMatch.id_peserta_b
  });
}

console.log(`   📊 Affected matches: ${affectedMatches.size}`);
for (const [id, info] of affectedMatches) {
  console.log(`      Match ${id} (R${info.round} pos ${info.position}):`);
  console.log(`         BEFORE: A=${info.beforeParticipantA}, B=${info.beforeParticipantB}`);
  console.log(`         AFTER:  A=${info.afterParticipantA}, B=${info.afterParticipantB}`);
}

// ⭐ PHASE 2: SYNC FORWARD CASCADE (R1 → R2+)
console.log(`\n   🔽 FORWARD CASCADE: R1 → R2+`);

for (const [id, match] of affectedMatches) {
  if (match.round !== 1) {
    console.log(`      ℹ️ Skip Match ${id} (not R1)`);
    continue;
  }
  
  // Check if this is a BYE match AFTER the changes
  const isAfterBye = 
    (match.afterParticipantA && !match.afterParticipantB) ||
    (!match.afterParticipantA && match.afterParticipantB);
  
  if (isAfterBye) {
    const byeWinner = match.afterParticipantA || match.afterParticipantB;
    console.log(`      🎯 R1 Match ${id} (pos ${match.position}) is BYE → Winner: ${byeWinner}`);
    
    if (isPemula) {
      // PEMULA: Update Additional Match (R2, Slot B)
      const additionalMatch = await prisma.tb_match.findFirst({
        where: {
          id_bagan: targetMatch.id_bagan,
          ronde: 2
        }
      });
      
      if (additionalMatch) {
        await prisma.tb_match.update({
          where: { id_match: additionalMatch.id_match },
          data: { id_peserta_b: byeWinner }
        });
        console.log(`         ✅ PEMULA Additional Match updated (Slot B = ${byeWinner})`);
      }
    } else {
      // PRESTASI: Sync to QF
      await this.syncByeWinnerToNextRound(
        targetMatch.id_bagan,
        match.position,
        byeWinner,
        2
      );
    }
  } else {
    console.log(`      ℹ️ R1 Match ${id} (pos ${match.position}) is NOT BYE - skip`);
  }
}

// ⭐ PHASE 3: SYNC REVERSE CASCADE (R2+ → R1)
console.log(`\n   🔼 REVERSE CASCADE: R2+ → R1`);

for (const [id, match] of affectedMatches) {
  if (match.round === 1) {
    console.log(`      ℹ️ Skip Match ${id} (already R1)`);
    continue;
  }
  
  console.log(`      🔍 Processing R${match.round} Match ${id}...`);
  
  // Track changes in Slot A
  if (match.beforeParticipantA !== match.afterParticipantA) {
    console.log(`         📍 Slot A changed: ${match.beforeParticipantA} → ${match.afterParticipantA}`);
    
    // OLD participant removed - clear its R1 BYE advancement
    if (match.beforeParticipantA) {
      await this.updateR1ByeForParticipant(
        targetMatch.id_bagan,
        match.beforeParticipantA,
        null,
        `R${match.round} Slot A (removed)`
      );
    }
    
    // NEW participant added - set its R1 BYE advancement
    if (match.afterParticipantA) {
      await this.updateR1ByeForParticipant(
        targetMatch.id_bagan,
        match.afterParticipantA,
        match.afterParticipantA,
        `R${match.round} Slot A (added)`
      );
    }
  }
  
  // Track changes in Slot B
  if (match.beforeParticipantB !== match.afterParticipantB) {
    console.log(`         📍 Slot B changed: ${match.beforeParticipantB} → ${match.afterParticipantB}`);
    
    // OLD participant removed
    if (match.beforeParticipantB) {
      await this.updateR1ByeForParticipant(
        targetMatch.id_bagan,
        match.beforeParticipantB,
        null,
        `R${match.round} Slot B (removed)`
      );
    }
    
    // NEW participant added
    if (match.afterParticipantB) {
      await this.updateR1ByeForParticipant(
        targetMatch.id_bagan,
        match.afterParticipantB,
        match.afterParticipantB,
        `R${match.round} Slot B (added)`
      );
    }
  }
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // ⭐ STEP 7: Fetch updated matches for response
    const updatedMatches = await prisma.tb_match.findMany({
      where: {
        id_bagan: targetMatch.id_bagan,
        ronde: targetMatch.ronde
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
      },
      orderBy: { position: 'asc' }
    });

    // Transform to Match[] format
    const transformedMatches: Match[] = updatedMatches.map(m => ({
      id: m.id_match,
      round: m.ronde,
      position: m.position ?? 0,
      participant1: m.peserta_a ? this.transformParticipant(m.peserta_a) : null,
      participant2: m.peserta_b ? this.transformParticipant(m.peserta_b) : null,
      winner: this.determineWinner(m),
      scoreA: m.skor_a,
      scoreB: m.skor_b,
      status: this.determineMatchStatus(m),
      tanggalPertandingan: m.tanggal_pertandingan,
      nomorPartai: m.nomor_partai,
      nomorAntrian: m.nomor_antrian,
      nomorLapangan: m.nomor_lapangan
    }));

    const message = swapped
      ? `Berhasil assign peserta dengan swap ke Match #${(existingMatch!.position ?? 0) + 1}`
      : `Berhasil assign peserta ke Match #${(targetMatch.position ?? 0) + 1}`;

    console.log(`\n✅ === ASSIGNMENT COMPLETED ===`);
    console.log(`   Message: ${message}`);
    console.log(`   Updated ${transformedMatches.length} matches`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      success: true,
      swapped,
      swappedMatch: swappedMatchInfo,
      message,
      updatedMatches: transformedMatches
    };

  } catch (error: any) {
    console.error('❌ Error assigning athlete to match:', error);
    throw new Error(error.message || 'Gagal assign peserta ke match');
  }
}

/**
 * 🆕 Update R1 BYE match for a participant
 * Handles reverse cascade when participant is moved in Round 2+
 */
static async updateR1ByeForParticipant(
  baganId: number,
  participantId: number,
  newValue: number | null,
  label: string
): Promise<void> {
  console.log(`\n   🔍 Checking ${label}: Participant ${participantId}`);

  // Find R1 BYE match where this participant is auto-advanced
  const r1ByeMatch = await prisma.tb_match.findFirst({
    where: {
      id_bagan: baganId,
      ronde: 1,
      OR: [
        { id_peserta_a: participantId, id_peserta_b: null },
        { id_peserta_a: null, id_peserta_b: participantId }
      ]
    }
  });

  if (r1ByeMatch) {
    console.log(`      🎯 Found R1 BYE match: ${r1ByeMatch.id_match}`);

    // Determine which slot (A or B) contains this participant
    const isSlotA = r1ByeMatch.id_peserta_a === participantId;
    const slotName = isSlotA ? 'A' : 'B';

    // Update the R1 BYE match
    const updateData = isSlotA
      ? { id_peserta_a: newValue }
      : { id_peserta_b: newValue };

    await prisma.tb_match.update({
      where: { id_match: r1ByeMatch.id_match },
      data: updateData
    });

    console.log(
      `      ✅ R1 BYE match ${r1ByeMatch.id_match} updated: ` +
      `Slot ${slotName}: ${participantId} → ${newValue || 'NULL'}`
    );
  } else {
    console.log(`      ℹ️ No R1 BYE match found (participant came from normal fight)`);
  }
}

/**
 * 🆕 Helper: Get child match (next round) for a given R1 match
 */
static getChildMatch(
  currentPosition: number
): { childPosition: number; childSlot: 'A' | 'B' } {
  const childPosition = Math.floor(currentPosition / 2);
  const childSlot = currentPosition % 2 === 0 ? 'A' : 'B';
  return { childPosition, childSlot };
}

/**
 * 🆕 Helper: Sync BYE winner to next round
 */
static async syncByeWinnerToNextRound(
  baganId: number,
  r1Position: number,
  byeWinnerId: number | null,
  nextRound: number
): Promise<void> {
  const { childPosition, childSlot } = this.getChildMatch(r1Position);
  
  console.log(`      🔄 Syncing R1 pos ${r1Position} → R${nextRound} pos ${childPosition} slot ${childSlot}`);
  
  const nextRoundMatches = await prisma.tb_match.findMany({
    where: {
      id_bagan: baganId,
      ronde: nextRound
    },
    orderBy: { position: 'asc' }
  });
  
  if (nextRoundMatches[childPosition]) {
    const updateData = childSlot === 'A'
      ? { id_peserta_a: byeWinnerId }
      : { id_peserta_b: byeWinnerId };
    
    await prisma.tb_match.update({
      where: { id_match: nextRoundMatches[childPosition].id_match },
      data: updateData
    });
    
    console.log(`         ✅ R${nextRound} Match ${nextRoundMatches[childPosition].id_match} slot ${childSlot} = ${byeWinnerId}`);
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
  // ✅ PERBAIKAN: Support 2-3 participants
  if (participantCount < 2) {
    throw new Error('Minimal 2 peserta diperlukan untuk bracket turnamen');
  }
  
  // ✅ SPECIAL CASES
  if (participantCount === 2) return 1; // Langsung final
  if (participantCount === 3) return 2; // 1 match + final
  
  try {
    const structure = this.calculateBracketStructure(participantCount);
    return structure.totalRounds;
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

  // =================================================================
  // ⭐ BARU: FUNGSI UNTUK PENJADWALAN GLOBAL
  // =================================================================

  /**
   * Mengurutkan semua pertandingan berdasarkan aturan penjadwalan global.
   * Aturan: stage ASC, participantCount DESC, position ASC, id ASC
   */
  static scheduleMatchesGlobally(matches: Match[]): Match[] {
    const sorted = matches.sort((a, b) => {
      const stageA = a.stageName || '';
      const stageB = b.stageName || '';

      const pa = this.getStagePriority(stageA);
      const pb = this.getStagePriority(stageB);
      if (pa !== pb) return pa - pb;

      const ca = a.bracketParticipantCount || 0;
      const cb = b.bracketParticipantCount || 0;
      if (ca !== cb) return cb - ca;

      if (a.position !== b.position) {
        return a.position - b.position;
      }

      return (a.id || 0) - (b.id || 0);
    });
    return sorted;
  }

  /**
   * Memberikan nomor urut pertandingan baru berdasarkan urutan stage.
   * Nomor akan direset setiap kali stage berubah.
   */
  static renumberMatchesByStage(sortedMatches: Match[]): Match[] {
    const stageCounters: { [key: string]: number } = {};
    let globalMatchNumber = 1;

    return sortedMatches.map(match => {
      // Hanya berikan nomor pada match yang bukan BYE
      if (match.status === 'bye') {
        return {
          ...match,
          nomorAntrian: null, // Hapus nomor antrian untuk BYE
          nomorPartai: null,
        };
      }

      const stage = match.stageName || 'UNKNOWN';
      if (!stageCounters[stage]) {
        stageCounters[stage] = 1;
      }
      
      const nomorAntrianDiStage = stageCounters[stage]++;
      
      return { 
        ...match, 
        // Anda bisa memilih mau pakai nomor urut global atau per-stage
        // Saya akan set `nomorAntrian` sebagai nomor global sesuai urutan jadwal
        nomorAntrian: globalMatchNumber++,
        // `nomorPartai` bisa jadi kombinasi atau sama dengan nomor antrian
        nomorPartai: `${globalMatchNumber - 1}`
      };
    });
  }

  /**
   * Fungsi utama yang dipanggil dari controller untuk mendapatkan jadwal global.
   * Mengambil semua pertandingan, mengurutkan, dan memberi nomor.
   */
  static async getAllMatchesForScheduling(kompetisiId: number): Promise<Match[]> {
    try {
      console.log(`\n🗓️ === GETTING ALL MATCHES FOR GLOBAL SCHEDULING ===`);
      console.log(`   Kompetisi ID: ${kompetisiId}`);

      const bagans = await prisma.tb_bagan.findMany({
        where: { id_kompetisi: kompetisiId },
        include: {
          _count: {
            select: { drawing_seed: true }
          },
          match: {
            include: {
              peserta_a: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: true } } } },
              peserta_b: { include: { atlet: { include: { dojang: true } }, anggota_tim: { include: { atlet: true } } } },
              venue: true
            }
          }
        }
      });

      console.log(`   Found ${bagans.length} bagans (brackets)`);
      if (bagans.length === 0) return [];
      
      let allMatches: Match[] = [];

      for (const bagan of bagans) {
        const participantCount = bagan._count.drawing_seed;
        // Calculate total rounds for this specific bracket to help determine stage names
        const totalRounds = this.calculateTotalRounds(participantCount);
        
        const transformedMatches: Match[] = bagan.match.map(match => {
            const hasParticipant1 = !!match.peserta_a;
            const hasParticipant2 = !!match.peserta_b;

            // --- DYNAMIC STAGE NAME CALCULATION ---
            // If stage_name from DB is null, calculate it on the fly.
            let finalStageName = match.stage_name;
            if (!finalStageName) {
              const matchesInThisRound = Math.pow(2, totalRounds - match.ronde);
              finalStageName = this.determineAbsoluteStageName(matchesInThisRound);
            }
            
            return {
              id: match.id_match,
              round: match.ronde,
              position: match.position ?? 0,
              participant1: match.peserta_a ? this.transformParticipant(match.peserta_a) : null,
              participant2: match.peserta_b ? this.transformParticipant(match.peserta_b) : null,
              winner: this.determineWinner(match),
              scoreA: match.skor_a,
              scoreB: match.skor_b,
              status: (hasParticipant1 && !hasParticipant2) || (!hasParticipant1 && hasParticipant2)
                ? 'bye'
                : this.determineMatchStatus(match),
              venue: match.venue?.nama_venue,
              tanggalPertandingan: match.tanggal_pertandingan,
              nomorPartai: match.nomor_partai,
              nomorAntrian: match.nomor_antrian,
              nomorLapangan: match.nomor_lapangan,
              stageName: finalStageName || undefined, // Use the calculated name
              bracketParticipantCount: participantCount,
              kelasKejuaraanId: bagan.id_kelas_kejuaraan
            };
        });

        allMatches.push(...transformedMatches);
      }
      
      console.log(`   Total matches from all bagans: ${allMatches.length}`);

      const sortedMatches = this.scheduleMatchesGlobally(allMatches);
      console.log(`   ✅ Matches sorted globally.`);

      const finalSchedule = this.renumberMatchesByStage(sortedMatches);
      console.log(`   ✅ Match numbering reset for each stage.`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      return finalSchedule;
    } catch (error: any) {
      console.error('❌ Error getting all matches for scheduling:', error);
      throw new Error(error.message || 'Failed to get and sort all matches');
    }
  }
}