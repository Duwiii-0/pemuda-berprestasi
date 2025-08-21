// Generic API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: ResponseMeta;
  timestamp: string;
  requestId?: string;
}

// Success Response
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

// Error Response
export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  data: null;
  errors: ApiError[];
}

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// Validation Error structure
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

// Response metadata
export interface ResponseMeta {
  pagination?: PaginationMeta;
  filters?: FilterMeta;
  sorting?: SortingMeta;
  execution_time?: number;
  version?: string;
}

// Pagination metadata
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_page?: number;
  prev_page?: number;
}

// Filter metadata
export interface FilterMeta {
  applied_filters: Record<string, any>;
  available_filters: string[];
  filter_count: number;
}

// Sorting metadata
export interface SortingMeta {
  sort_by: string;
  sort_order: 'asc' | 'desc';
  available_sorts: string[];
}

// Pagination request parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Sorting request parameters
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter request parameters
export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
  dateFrom?: string;
  dateTo?: string;
}

// Combined query parameters
export interface QueryParams extends PaginationParams, SortParams, FilterParams {
  include?: string[];
  fields?: string[];
}

// List response wrapper
export interface ListResponse<T> {
  items: T[];
  meta: {
    pagination: PaginationMeta;
    filters?: FilterMeta;
    sorting?: SortingMeta;
  };
}

// HTTP Status codes enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Error codes enum
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  VALUE_TOO_SHORT = 'VALUE_TOO_SHORT',
  VALUE_TOO_LONG = 'VALUE_TOO_LONG',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Business logic errors
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  COMPETITION_NOT_ACTIVE = 'COMPETITION_NOT_ACTIVE',
  ATHLETE_NOT_ELIGIBLE = 'ATHLETE_NOT_ELIGIBLE',
  BRACKET_ALREADY_GENERATED = 'BRACKET_ALREADY_GENERATED',
  MATCH_ALREADY_COMPLETED = 'MATCH_ALREADY_COMPLETED',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Request context interface
export interface RequestContext {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
  ip?: string;
  userAgent?: string;
  requestId: string;
  timestamp: string;
}