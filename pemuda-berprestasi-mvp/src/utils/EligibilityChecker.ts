import { PrismaClient } from '@prisma/client';
import { AgeCalculator } from './ageCalculator';

const prisma = new PrismaClient();

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  eligibleClasses: Array<{
    id_kelas_kejuaraan: number;
    cabang: string;
    nama_kategori: string;
    nama_kelompok?: string;
    nama_kelas?: string;
  }>;
}

export interface AthleteData {
  id_atlet: number;
  nama_atlet: string;
  tanggal_lahir: Date;
  berat_badan: number;
  jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN'; // Sesuai enum JenisKelamin
}

export class EligibilityChecker {
  /**
   * Check athlete eligibility for a competition
   * @param athleteId - ID of the athlete
   * @param competitionId - ID of the competition
   * @returns Eligibility result
   */
  static async checkAthleteEligibility(
    athleteId: number,
    competitionId: number
  ): Promise<EligibilityResult> {
    try {
      // Get athlete data
      const athlete = await prisma.tb_atlet.findUnique({
        where: { id_atlet: athleteId },
        include: {
          dojang: true
        }
      });

      if (!athlete) {
        return {
          isEligible: false,
          reasons: ['Atlet tidak ditemukan'],
          eligibleClasses: []
        };
      }

      // Get competition data
      const competition = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: competitionId },
        include: {
          kelas_kejuaraan: {
            include: {
              kategori_event: true,
              kelompok: true,
              kelas_berat: true,
              poomsae: true
            }
          }
        }
      });

      if (!competition) {
        return {
          isEligible: false,
          reasons: ['Kompetisi tidak ditemukan'],
          eligibleClasses: []
        };
      }

      // Check competition status - gunakan enum StatusKompetisi yang sesuai
      if (competition.status !== 'PENDAFTARAN') {
        return {
          isEligible: false,
          reasons: ['Kompetisi belum dibuka untuk pendaftaran'],
          eligibleClasses: []
        };
      }

      // Check registration deadline (assuming registration closes at competition start)
      const now = new Date();
      if (now >= competition.tanggal_mulai) {
        return {
          isEligible: false,
          reasons: ['Pendaftaran sudah ditutup'],
          eligibleClasses: []
        };
      }

      // Check if already registered
      const existingRegistration = await prisma.tb_peserta_kompetisi.findFirst({
        where: {
          id_atlet: athleteId,
          kelas_kejuaraan: {
            id_kompetisi: competitionId
          }
        }
      });

      if (existingRegistration) {
        return {
          isEligible: false,
          reasons: ['Atlet sudah terdaftar dalam kompetisi ini'],
          eligibleClasses: []
        };
      }

      const reasons: string[] = [];
      const eligibleClasses: EligibilityResult['eligibleClasses'] = [];

      // Check each competition class
      for (const competitionClass of competition.kelas_kejuaraan) {
        const classEligibility = await this.checkClassEligibility(
          athlete,
          competitionClass,
          competition.tanggal_mulai
        );

        if (classEligibility.isEligible) {
          eligibleClasses.push({
            id_kelas_kejuaraan: competitionClass.id_kelas_kejuaraan,
            cabang: competitionClass.cabang,
            nama_kategori: competitionClass.kategori_event.nama_kategori,
            nama_kelompok: competitionClass.kelompok?.nama_kelompok,
            nama_kelas: competitionClass.kelas_berat?.nama_kelas
          });
        }
      }

      if (eligibleClasses.length === 0) {
        reasons.push('Tidak ada kelas yang sesuai dengan profil atlet');
      }

      return {
        isEligible: eligibleClasses.length > 0,
        reasons,
        eligibleClasses
      };

    } catch (error) {
      console.error('Error checking eligibility:', error);
      return {
        isEligible: false,
        reasons: ['Terjadi kesalahan sistem'],
        eligibleClasses: []
      };
    }
  }

  /**
   * Check eligibility for specific class
   * @param athlete - Athlete data
   * @param competitionClass - Competition class data
   * @param competitionDate - Competition date
   * @returns Class eligibility result
   */
  private static async checkClassEligibility(
    athlete: any,
    competitionClass: any,
    competitionDate: Date
  ): Promise<{ isEligible: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Check age group eligibility
    if (competitionClass.kelompok) {
      const isAgeEligible = AgeCalculator.isEligibleForAgeGroup(
        athlete.tanggal_lahir,
        competitionClass.kelompok.usia_min,
        competitionClass.kelompok.usia_max,
        competitionDate
      );

      if (!isAgeEligible) {
        const age = AgeCalculator.calculateAgeAtCompetition(athlete.tanggal_lahir, competitionDate);
        reasons.push(
          `Umur tidak sesuai (${age} tahun, requirement: ${competitionClass.kelompok.usia_min}-${competitionClass.kelompok.usia_max} tahun)`
        );
      }
    }

    // Check weight class eligibility (for KYORUGI)
    if (competitionClass.cabang === 'KYORUGI' && competitionClass.kelas_berat) {
      // Check gender - gunakan jenis_kelamin bukan gender
      if (competitionClass.kelas_berat.jenis_kelamin !== athlete.jenis_kelamin) {
        reasons.push('Jenis kelamin tidak sesuai');
      }

      // Check weight
      if (athlete.berat_badan < competitionClass.kelas_berat.batas_min || 
          athlete.berat_badan > competitionClass.kelas_berat.batas_max) {
        reasons.push(
          `Berat badan tidak sesuai (${athlete.berat_badan}kg, requirement: ${competitionClass.kelas_berat.batas_min}-${competitionClass.kelas_berat.batas_max}kg)`
        );
      }
    }

    // Check poomsae level eligibility (for POOMSAE)
    if (competitionClass.cabang === 'POOMSAE' && competitionClass.poomsae) {
      // Additional poomsae eligibility checks can be added here
      // For now, we assume basic eligibility
    }

    return {
      isEligible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get all eligible classes for multiple athletes
   * @param athleteIds - Array of athlete IDs
   * @param competitionId - Competition ID
   * @returns Map of athlete eligibility results
   */
  static async checkMultipleAthletes(
    athleteIds: number[],
    competitionId: number
  ): Promise<Map<number, EligibilityResult>> {
    const results = new Map<number, EligibilityResult>();

    for (const athleteId of athleteIds) {
      const eligibility = await this.checkAthleteEligibility(athleteId, competitionId);
      results.set(athleteId, eligibility);
    }

    return results;
  }

  /**
   * Get weight class recommendations for athlete
   * @param athlete - Athlete data
   * @param competitionId - Competition ID
   * @returns Recommended weight classes
   */
  static async getWeightClassRecommendations(
    athlete: AthleteData,
    competitionId: number
  ) {
    try {
      const recommendations = await prisma.tb_kelas_berat.findMany({
        where: {
          jenis_kelamin: athlete.jenis_kelamin, // Gunakan jenis_kelamin bukan gender
          batas_min: { lte: athlete.berat_badan },
          batas_max: { gte: athlete.berat_badan },
          kelas_kejuaraan: {
            some: {
              id_kompetisi: competitionId,
              cabang: 'KYORUGI'
            }
          }
        },
        include: {
          kelompok: true, // Include kelompok relation
          kelas_kejuaraan: {
            where: {
              id_kompetisi: competitionId
            },
            include: {
              kategori_event: true
            }
          }
        }
      });

      return recommendations.filter(weightClass => {
        if (weightClass.kelompok) {
          return AgeCalculator.isEligibleForAgeGroup(
            athlete.tanggal_lahir,
            weightClass.kelompok.usia_min,
            weightClass.kelompok.usia_max
          );
        }
        return true;
      });

    } catch (error) {
      console.error('Error getting weight class recommendations:', error);
      return [];
    }
  }

  /**
   * Validate registration data
   * @param athleteId - Athlete ID
   * @param classId - Competition class ID
   * @returns Validation result
   */
  static async validateRegistration(
    athleteId: number,
    classId: number
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Get competition class with competition info
      const competitionClass = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan: classId },
        include: {
          kompetisi: true
        }
      });

      if (!competitionClass) {
        return {
          isValid: false,
          message: 'Kelas kompetisi tidak ditemukan'
        };
      }

      // Check athlete eligibility
      const eligibility = await this.checkAthleteEligibility(
        athleteId,
        competitionClass.kompetisi.id_kompetisi
      );

      if (!eligibility.isEligible) {
        return {
          isValid: false,
          message: eligibility.reasons.join(', ')
        };
      }

      // Check if class is in eligible classes
      const isClassEligible = eligibility.eligibleClasses.some(
        ec => ec.id_kelas_kejuaraan === classId
      );

      if (!isClassEligible) {
        return {
          isValid: false,
          message: 'Atlet tidak memenuhi syarat untuk kelas ini'
        };
      }

      return { isValid: true };

    } catch (error) {
      console.error('Error validating registration:', error);
      return {
        isValid: false,
        message: 'Terjadi kesalahan sistem'
      };
    }
  }
}