import { Response } from 'express';
import { 
  ApiResponse, 
  SuccessResponse, 
  ErrorResponse, 
  HttpStatus, 
  ErrorCode,
  PaginationMeta,
  ListResponse 
} from '@/types';

/**
 * Generate request ID for tracking
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create success response
 */
export const createSuccessResponse = <T>(
  message: string,
  data: T,
  meta?: any
): SuccessResponse<T> => {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
};

/**
 * Create error response
 */
export const createErrorResponse = (
  message: string,
  errors: any[] = [],
  code: ErrorCode = ErrorCode.INTERNAL_ERROR
): ErrorResponse => {
  return {
    success: false,
    message,
    data: null,
    errors: Array.isArray(errors) ? errors : [{ code, message: errors }],
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: HttpStatus = HttpStatus.OK,
  meta?: any
): Response => {
  const response = createSuccessResponse(message, data, meta);
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  errors: any[] = [],
  code: ErrorCode = ErrorCode.INTERNAL_ERROR
): Response => {
  const response = createErrorResponse(message, errors, code);
  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any[]
): Response => {
  return sendError(
    res,
    'Validation failed',
    HttpStatus.UNPROCESSABLE_ENTITY,
    errors,
    ErrorCode.VALIDATION_FAILED
  );
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  return sendError(
    res,
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    [],
    ErrorCode.RESOURCE_NOT_FOUND
  );
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return sendError(
    res,
    message,
    HttpStatus.UNAUTHORIZED,
    [],
    ErrorCode.UNAUTHORIZED_ACCESS
  );
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Insufficient permissions'
): Response => {
  return sendError(
    res,
    message,
    HttpStatus.FORBIDDEN,
    [],
    ErrorCode.INSUFFICIENT_PERMISSIONS
  );
};

/**
 * Send conflict response
 */
export const sendConflict = (
  res: Response,
  message: string,
  errors: any[] = []
): Response => {
  return sendError(
    res,
    message,
    HttpStatus.CONFLICT,
    errors,
    ErrorCode.RESOURCE_CONFLICT
  );
};

/**
 * Send rate limit response
 */
export const sendRateLimit = (
  res: Response,
  retryAfter?: number
): Response => {
  if (retryAfter) {
    res.set('Retry-After', retryAfter.toString());
  }
  return sendError(
    res,
    'Rate limit exceeded',
    HttpStatus.TOO_MANY_REQUESTS,
    [],
    ErrorCode.RATE_LIMIT_EXCEEDED
  );
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T>(
  items: T[],
  pagination: PaginationMeta
): ListResponse<T> => {
  return {
    items,
    meta: {
      pagination,
    },
  };
};

/**
 * Send paginated success response
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  message: string,
  items: T[],
  pagination: PaginationMeta
): Response => {
  const data = createPaginatedResponse(items, pagination);
  return sendSuccess(res, message, data);
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  currentPage: number,
  perPage: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / perPage);
  
  return {
    current_page: currentPage,
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_prev: currentPage > 1,
    next_page: currentPage < totalPages ? currentPage + 1 : undefined,
    prev_page: currentPage > 1 ? currentPage - 1 : undefined,
  };
};

/**
 * Handle async route errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Format validation errors from Joi/express-validator
 */
export const formatValidationErrors = (errors: any[]): any[] => {
  if (!errors || !Array.isArray(errors)) return [];

  return errors.map((error) => {
    // Handle Joi validation errors
    if (error.details) {
      return error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        code: detail.type || ErrorCode.VALIDATION_FAILED,
      }));
    }

    // Handle express-validator errors
    if (error.param && error.msg) {
      return {
        field: error.param,
        message: error.msg,
        value: error.value,
        code: ErrorCode.VALIDATION_FAILED,
      };
    }

    // Handle custom validation errors
    if (error.field && error.message) {
      return {
        field: error.field,
        message: error.message,
        value: error.value,
        code: error.code || ErrorCode.VALIDATION_FAILED,
      };
    }

    // Fallback for unknown error format
    return {
      field: 'unknown',
      message: error.message || error.toString(),
      code: ErrorCode.VALIDATION_FAILED,
    };
  }).flat();
};

/**
 * Create standardized API error
 */
export const createApiError = (
  code: ErrorCode,
  message: string,
  field?: string,
  details?: any
) => {
  return {
    code,
    message,
    field,
    details,
  };
};

/**
 * Response time middleware helper
 */
export const addResponseTime = (req: any, res: Response) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.set('X-Response-Time', `${duration}ms`);
  });
};

/**
 * Add CORS headers to response
 */
export const addCorsHeaders = (res: Response, origin?: string) => {
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Expose-Headers', 'X-Total-Count,X-Page,X-Per-Page,X-Total-Pages');
};

/**
 * Create health check response
 */
export const createHealthResponse = (services: Record<string, boolean>) => {
  const allHealthy = Object.values(services).every(status => status === true);
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services,
    uptime: process.uptime(),
    version: process.env.API_VERSION || '1.0.0',
  };
};

/**
 * Send health check response
 */
export const sendHealthCheck = (
  res: Response,
  services: Record<string, boolean>
): Response => {
  const health = createHealthResponse(services);
  const statusCode = health.status === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
  
  return res.status(statusCode).json(health);
};

/**
 * Format database error message
 */
export const formatDatabaseError = (error: any): string => {
  // Handle Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        return 'A record with this data already exists';
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Invalid reference to related record';
      case 'P2004':
        return 'Database constraint violation';
      default:
        return 'Database operation failed';
    }
  }

  // Handle MySQL errors
  if (error.errno) {
    switch (error.errno) {
      case 1062:
        return 'Duplicate entry found';
      case 1452:
        return 'Invalid foreign key reference';
      case 1451:
        return 'Cannot delete record due to existing references';
      default:
        return 'Database error occurred';
    }
  }

  return error.message || 'Unknown database error';
};

/**
 * Log and send error response
 */
export const logAndSendError = (
  res: Response,
  error: any,
  message: string = 'An error occurred',
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
): Response => {
  // Log error (you can replace with your logging service)
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Send appropriate error response
  if (error.code && error.code.startsWith('P')) {
    // Prisma error
    return sendError(
      res,
      formatDatabaseError(error),
      HttpStatus.BAD_REQUEST,
      [],
      ErrorCode.DATABASE_ERROR
    );
  }

  return sendError(res, message, statusCode);
};