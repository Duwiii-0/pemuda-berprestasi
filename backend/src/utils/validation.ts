import { JenisKelamin } from '@/types';

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex (Indonesian format)
 */
export const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;

/**
 * Strong password validation regex
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Username validation regex (alphanumeric, underscore, hyphen)
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

/**
 * Indonesian ID number (KTP) validation regex
 */
export const KTP_REGEX = /^[0-9]{16}$/;

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate phone number (Indonesian format)
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
};

/**
 * Validate strong password
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  return STRONG_PASSWORD_REGEX.test(password);
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  return USERNAME_REGEX.test(username);
};

/**
 * Validate Indonesian ID number (KTP)
 */
export const isValidKTP = (ktp: string): boolean => {
  if (!ktp || typeof ktp !== 'string') return false;
  return KTP_REGEX.test(ktp);
};

/**
 * Validate date is not in future
 */
export const isValidBirthDate = (date: Date): boolean => {
  if (!date || !(date instanceof Date)) return false;
  return date < new Date();
};

/**
 * Validate age range
 */
export const isValidAge = (birthDate: Date, minAge: number = 0, maxAge: number = 100): boolean => {
  if (!isValidBirthDate(birthDate)) return false;
  
  const age = calculateAge(birthDate);
  return age >= minAge && age <= maxAge;
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date): number => {
  if (!birthDate || !(birthDate instanceof Date)) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate weight (in kg)
 */
export const isValidWeight = (weight: number, minWeight: number = 10, maxWeight: number = 200): boolean => {
  if (typeof weight !== 'number' || isNaN(weight)) return false;
  return weight >= minWeight && weight <= maxWeight;
};

/**
 * Validate height (in cm)
 */
export const isValidHeight = (height: number, minHeight: number = 50, maxHeight: number = 250): boolean => {
  if (typeof height !== 'number' || isNaN(height)) return false;
  return height >= minHeight && height <= maxHeight;
};

/**
 * Validate gender enum
 */
export const isValidGender = (gender: string): boolean => {
  return Object.values(JenisKelamin).includes(gender as JenisKelamin);
};

/**
 * Validate required string field
 */
export const isValidRequiredString = (value: string, minLength: number = 1, maxLength: number = 255): boolean => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Validate optional string field
 */
export const isValidOptionalString = (value?: string, maxLength: number = 255): boolean => {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  return value.trim().length <= maxLength;
};

/**
 * Validate numeric ID
 */
export const isValidId = (id: any): boolean => {
  const numId = Number(id);
  return !isNaN(numId) && Number.isInteger(numId) && numId > 0;
};

/**
 * Validate array of IDs
 */
export const isValidIdArray = (ids: any[]): boolean => {
  if (!Array.isArray(ids)) return false;
  return ids.every(id => isValidId(id));
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
    return false;
  }
  return startDate <= endDate;
};

/**
 * Validate future date
 */
export const isValidFutureDate = (date: Date, minDaysFromNow: number = 0): boolean => {
  if (!date || !(date instanceof Date)) return false;
  
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + minDaysFromNow);
  
  return date >= minDate;
};

/**
 * Validate file extension
 */
export const isValidFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  if (!filename || typeof filename !== 'string') return false;
  
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return false;
  
  return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
};

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (size: number, maxSizeInMB: number): boolean => {
  if (typeof size !== 'number' || size < 0) return false;
  return size <= maxSizeInMB * 1024 * 1024;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate competition date constraints
 */
export const isValidCompetitionDates = (
  registrationStart: Date,
  registrationEnd: Date,
  competitionStart: Date,
  competitionEnd: Date
): boolean => {
  if (!registrationStart || !registrationEnd || !competitionStart || !competitionEnd) {
    return false;
  }

  // Registration dates must be valid range
  if (!isValidDateRange(registrationStart, registrationEnd)) return false;
  
  // Competition dates must be valid range
  if (!isValidDateRange(competitionStart, competitionEnd)) return false;
  
  // Registration must end before or on competition start
  if (registrationEnd > competitionStart) return false;
  
  // All dates should be in future
  const now = new Date();
  return registrationStart >= now;
};

/**
 * Validate weight category constraints
 */
export const isValidWeightCategory = (minWeight: number, maxWeight: number): boolean => {
  if (!isValidWeight(minWeight) || !isValidWeight(maxWeight)) return false;
  return minWeight < maxWeight;
};

/**
 * Validate age group constraints
 */
export const isValidAgeGroup = (minAge: number, maxAge: number): boolean => {
  if (typeof minAge !== 'number' || typeof maxAge !== 'number') return false;
  if (minAge < 0 || maxAge < 0) return false;
  return minAge <= maxAge;
};

/**
 * Validate athlete eligibility for competition class
 */
export interface AthleteEligibility {
  isEligible: boolean;
  reasons: string[];
}

export const validateAthleteEligibility = (
  athlete: {
    tanggal_lahir: Date;
    berat_badan: number;
    jenis_kelamin: JenisKelamin;
  },
  competitionClass: {
    usia_min?: number;
    usia_max?: number;
    batas_min?: number;
    batas_max?: number;
    gender?: JenisKelamin;
  }
): AthleteEligibility => {
  const reasons: string[] = [];
  
  // Check age eligibility
  if (competitionClass.usia_min !== undefined || competitionClass.usia_max !== undefined) {
    const age = calculateAge(athlete.tanggal_lahir);
    
    if (competitionClass.usia_min !== undefined && age < competitionClass.usia_min) {
      reasons.push(`Usia terlalu muda (minimal ${competitionClass.usia_min} tahun)`);
    }
    
    if (competitionClass.usia_max !== undefined && age > competitionClass.usia_max) {
      reasons.push(`Usia terlalu tua (maksimal ${competitionClass.usia_max} tahun)`);
    }
  }
  
  // Check weight eligibility
  if (competitionClass.batas_min !== undefined && athlete.berat_badan < competitionClass.batas_min) {
    reasons.push(`Berat badan terlalu ringan (minimal ${competitionClass.batas_min} kg)`);
  }
  
  if (competitionClass.batas_max !== undefined && athlete.berat_badan > competitionClass.batas_max) {
    reasons.push(`Berat badan terlalu berat (maksimal ${competitionClass.batas_max} kg)`);
  }
  
  // Check gender eligibility
  if (competitionClass.gender && athlete.jenis_kelamin !== competitionClass.gender) {
    const genderText = competitionClass.gender === JenisKelamin.L ? 'Laki-laki' : 'Perempuan';
    reasons.push(`Kategori hanya untuk ${genderText}`);
  }
  
  return {
    isEligible: reasons.length === 0,
    reasons
  };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>\"'&]/g, ''); // Remove potentially harmful characters
};

/**
 * Validate and sanitize form data
 */
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = isNaN(value) ? null : value;
    } else if (value instanceof Date) {
      sanitized[key] = isNaN(value.getTime()) ? null : value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};