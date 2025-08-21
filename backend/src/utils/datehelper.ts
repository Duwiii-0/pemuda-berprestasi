/**
 * Date helper utilities for Indonesian timezone and formatting
 */

/**
 * Indonesian timezone offset
 */
export const TIMEZONE_OFFSET = 7; // UTC+7 for WIB

/**
 * Get current date in Indonesian timezone
 */
export const getCurrentDateWIB = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (TIMEZONE_OFFSET * 3600000));
  return wib;
};

/**
 * Convert date to Indonesian timezone
 */
export const toWIB = (date: Date): Date => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (TIMEZONE_OFFSET * 3600000));
};

/**
 * Format date to Indonesian format (DD/MM/YYYY)
 */
export const formatDateID = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format datetime to Indonesian format (DD/MM/YYYY HH:mm)
 */
export const formatDateTimeID = (date: Date): string => {
  const dateStr = formatDateID(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};

/**
 * Parse Indonesian date format (DD/MM/YYYY) to Date
 */
export const parseDateID = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date > getCurrentDateWIB();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  return date < getCurrentDateWIB();
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = getCurrentDateWIB();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get date range (start and end of day)
 */
export const getDateRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date): number => {
  const today = getCurrentDateWIB();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from date
 */
export const subtractDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

/**
 * Check if date is within range
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Get days between two dates
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay));
};

/**
 * Indonesian month names
 */
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Indonesian day names
 */
export const INDONESIAN_DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format date to Indonesian long format (Senin, 21 Agustus 2025)
 */
export const formatDateLongID = (date: Date): string => {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
};