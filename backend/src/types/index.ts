// Export all types from individual modules
export * from './response';
export * from './auth';
export * from './competition';
export * from './match';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type Nullable<T> = T | null;
export type ID = number;
export type StringID = string;

// Database operation types
export interface CreateResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateResult<T = any> {
  success: boolean;
  data?: T;
  affected_rows: number;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  affected_rows: number;
  error?: string;
}

// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Common database timestamps (if you decide to add them later)
export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

export interface SoftDelete {
  deleted_at?: Date;
}

// File upload types
export interface UploadedFile {
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface FileUploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

// Common validation types
export interface ValidationRule {
  field: string;
  rules: string[];
  message?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
}

// Date range types
export interface DateRange {
  start_date: Date;
  end_date: Date;
}

export interface TimeRange {
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
}

// Geographic types
export interface Address {
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Contact information types
export interface ContactInfo {
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
}

// Social media types
export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

// System configuration types
export interface SystemConfig {
  key: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
}

// Notification types
export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  recipient_id?: number;
  recipient_type?: RecipientType;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  REMINDER = 'REMINDER',
}

export enum RecipientType {
  USER = 'USER',
  ROLE = 'ROLE',
  ALL = 'ALL',
}

// Export/Import types
export interface ExportOptions {
  format: ExportFormat;
  fields?: string[];
  filters?: any;
  filename?: string;
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
}

export interface ImportResult {
  success: boolean;
  total_records: number;
  imported_records: number;
  failed_records: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

// Dashboard statistics types
export interface DashboardStats {
  total_competitions: number;
  active_competitions: number;
  total_participants: number;
  total_matches: number;
  completed_matches: number;
  upcoming_matches: number;
  total_dojang: number;
  total_athletes: number;
  total_coaches: number;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

// Search and filter types
export interface SearchOptions {
  query: string;
  fields?: string[];
  exact_match?: boolean;
  case_sensitive?: boolean;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// API key types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  last_used_at?: Date;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: Date;
  retry_after?: number;
}