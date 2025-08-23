/**
 * Utility functions for age calculation and age group management
 */

export class AgeCalculator {
  /**
   * Calculate age based on birth date
   * @param birthDate - Date of birth
   * @param referenceDate - Reference date (default: current date)
   * @returns Age in years
   */
  static calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
    const birth = new Date(birthDate);
    const reference = new Date(referenceDate);
    
    let age = reference.getFullYear() - birth.getFullYear();
    const monthDiff = reference.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate age at specific competition date
   * @param birthDate - Date of birth
   * @param competitionDate - Competition start date
   * @returns Age at competition date
   */
  static calculateAgeAtCompetition(birthDate: Date, competitionDate: Date): number {
    return this.calculateAge(birthDate, competitionDate);
  }

  /**
   * Check if athlete is eligible for age group
   * @param birthDate - Athlete's birth date
   * @param ageMin - Minimum age for the group
   * @param ageMax - Maximum age for the group
   * @param competitionDate - Competition date (default: current date)
   * @returns Boolean indicating eligibility
   */
  static isEligibleForAgeGroup(
    birthDate: Date,
    ageMin: number,
    ageMax: number,
    competitionDate: Date = new Date()
  ): boolean {
    const age = this.calculateAgeAtCompetition(birthDate, competitionDate);
    return age >= ageMin && age <= ageMax;
  }

  /**
   * Get age category name based on age
   * @param age - Age in years
   * @returns Age category name
   */
  static getAgeCategory(age: number): string {
    if (age <= 8) return 'Children';
    if (age <= 11) return 'Cadet';
    if (age <= 14) return 'Junior';
    if (age <= 17) return 'Youth';
    if (age <= 32) return 'Senior';
    return 'Master';
  }

  /**
   * Find suitable age groups for athlete
   * @param birthDate - Athlete's birth date
   * @param ageGroups - Available age groups
   * @param competitionDate - Competition date
   * @returns Array of eligible age groups
   */
  static findEligibleAgeGroups(
    birthDate: Date,
    ageGroups: Array<{
      id_kelompok: number;
      nama_kelompok: string;
      usia_min: number;
      usia_max: number;
    }>,
    competitionDate: Date = new Date()
  ) {
    const athleteAge = this.calculateAgeAtCompetition(birthDate, competitionDate);
    
    return ageGroups.filter(group => 
      this.isEligibleForAgeGroup(birthDate, group.usia_min, group.usia_max, competitionDate)
    ).map(group => ({
      ...group,
      athlete_age: athleteAge
    }));
  }

  /**
   * Calculate age distribution for a list of athletes
   * @param athletes - Array of athletes with birth dates
   * @param competitionDate - Competition date
   * @returns Age distribution statistics
   */
  static getAgeDistribution(
    athletes: Array<{ tanggal_lahir: Date; nama_atlet: string }>,
    competitionDate: Date = new Date()
  ) {
    const ageStats = {
      total: athletes.length,
      youngest: Infinity,
      oldest: 0,
      average: 0,
      distribution: {} as Record<string, number>
    };

    if (athletes.length === 0) return ageStats;

    const ages = athletes.map(athlete => 
      this.calculateAgeAtCompetition(athlete.tanggal_lahir, competitionDate)
    );

    ageStats.youngest = Math.min(...ages);
    ageStats.oldest = Math.max(...ages);
    ageStats.average = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);

    // Count distribution by age category
    ages.forEach(age => {
      const category = this.getAgeCategory(age);
      ageStats.distribution[category] = (ageStats.distribution[category] || 0) + 1;
    });

    return ageStats;
  }

  /**
   * Validate birth date
   * @param birthDate - Date to validate
   * @param minAge - Minimum allowed age (default: 5)
   * @param maxAge - Maximum allowed age (default: 80)
   * @returns Validation result
   */
  static validateBirthDate(
    birthDate: Date,
    minAge: number = 5,
    maxAge: number = 80
  ): { isValid: boolean; message?: string; age?: number } {
    const now = new Date();
    const age = this.calculateAge(birthDate, now);

    if (birthDate > now) {
      return {
        isValid: false,
        message: 'Tanggal lahir tidak boleh di masa depan'
      };
    }

    if (age < minAge) {
      return {
        isValid: false,
        message: `Umur minimal ${minAge} tahun`,
        age
      };
    }

    if (age > maxAge) {
      return {
        isValid: false,
        message: `Umur maksimal ${maxAge} tahun`,
        age
      };
    }

    return { isValid: true, age };
  }

  /**
   * Get birth year range for age group
   * @param ageMin - Minimum age
   * @param ageMax - Maximum age
   * @param referenceDate - Reference date (default: current date)
   * @returns Birth year range
   */
  static getBirthYearRange(
    ageMin: number,
    ageMax: number,
    referenceDate: Date = new Date()
  ): { minYear: number; maxYear: number } {
    const currentYear = referenceDate.getFullYear();
    return {
      minYear: currentYear - ageMax,
      maxYear: currentYear - ageMin
    };
  }
}