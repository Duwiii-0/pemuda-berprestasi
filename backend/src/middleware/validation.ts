import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '@/utils/response';

/**
 * Validation middleware factory
 * Creates middleware to validate request data against Zod schemas
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      // Validate request body
      if (schema.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          return sendValidationError(res, 'Invalid request body', errors);
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (schema.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          return sendValidationError(res, 'Invalid query parameters', errors);
        }
        req.query = result.data;
      }

      // Validate route parameters
      if (schema.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          return sendValidationError(res, 'Invalid route parameters', errors);
        }
        req.params = result.data;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return sendValidationError(res, 'Validation error occurred');
    }
  };
};

/**
 * Format Zod validation errors
 */
const formatZodErrors = (error: ZodError): Array<{ field: string; message: string }> => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/**
 * Validate file upload middleware
 */
export const validateFileUpload = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  fieldName?: string;
}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    fieldName = 'file'
  } = options;

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const file = req.file;
    const files = req.files;

    // Check if file is required
    if (required && !file && !files) {
      return sendValidationError(res, 'File is required', [
        { field: fieldName, message: 'File is required' }
      ]);
    }

    // Validate single file
    if (file) {
      const validationResult = validateSingleFile(file, maxSize, allowedTypes);
      if (!validationResult.isValid) {
        return sendValidationError(res, 'Invalid file', [
          { field: fieldName, message: validationResult.error! }
        ]);
      }
    }

    // Validate multiple files
    if (files && Array.isArray(files)) {
      for (let i = 0; i < files.length; i++) {
        const validationResult = validateSingleFile(files[i], maxSize, allowedTypes);
        if (!validationResult.isValid) {
          return sendValidationError(res, 'Invalid file', [
            { field: `${fieldName}[${i}]`, message: validationResult.error! }
          ]);
        }
      }
    }

    next();
  };
};

/**
 * Validate single file
 */
const validateSingleFile = (
  file: Express.Multer.File,
  maxSize: number,
  allowedTypes: string[]
): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { page, limit, sort, order } = req.query;

  const errors: Array<{ field: string; message: string }> = [];

  // Validate page
  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    req.query.page = pageNum.toString();
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }
    req.query.limit = limitNum.toString();
  }

  // Validate sort
  if (sort !== undefined) {
    const sortStr = sort as string;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sortStr)) {
      errors.push({ field: 'sort', message: 'Invalid sort field format' });
    }
  }

  // Validate order
  if (order !== undefined) {
    const orderStr = (order as string).toLowerCase();
    if (!['asc', 'desc'].includes(orderStr)) {
      errors.push({ field: 'order', message: 'Order must be either "asc" or "desc"' });
    }
    req.query.order = orderStr;
  }

  if (errors.length > 0) {
    return sendValidationError(res, 'Invalid pagination parameters', errors);
  }

  next();
};

/**
 * Validate ID parameter
 */
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const id = req.params[paramName];
    
    if (!id) {
      return sendValidationError(res, 'ID parameter is required', [
        { field: paramName, message: 'ID is required' }
      ]);
    }

    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum < 1) {
      return sendValidationError(res, 'Invalid ID parameter', [
        { field: paramName, message: 'ID must be a positive integer' }
      ]);
    }

    // Replace with parsed integer
    req.params[paramName] = idNum.toString();
    next();
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const errors: Array<{ field: string; message: string }> = [];

    if (isNaN(start.getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }

    if (isNaN(end.getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }

    if (errors.length === 0 && start >= end) {
      errors.push({ 
        field: 'dateRange', 
        message: 'Start date must be before end date' 
      });
    }

    if (errors.length > 0) {
      return sendValidationError(res, 'Invalid date range', errors);
    }
  }

  next();
};

/**
 * Sanitize input middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize object
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Custom validation middleware for specific business rules
 */
export const validateBusinessRules = {
  /**
   * Validate competition dates
   */
  competitionDates: (req: Request, res: Response, next: NextFunction): Response | void => {
    const { tanggal_mulai, tanggal_selesai } = req.body;

    if (tanggal_mulai && tanggal_selesai) {
      const startDate = new Date(tanggal_mulai);
      const endDate = new Date(tanggal_selesai);
      const now = new Date();

      const errors: Array<{ field: string; message: string }> = [];

      // Competition must be in the future
      if (startDate <= now) {
        errors.push({
          field: 'tanggal_mulai',
          message: 'Competition start date must be in the future'
        });
      }

      // End date must be after start date
      if (endDate <= startDate) {
        errors.push({
          field: 'tanggal_selesai',
          message: 'Competition end date must be after start date'
        });
      }

      if (errors.length > 0) {
        return sendValidationError(res, 'Invalid competition dates', errors);
      }
    }

    next();
  },

  /**
   * Validate athlete age for competition
   */
  athleteAge: (req: Request, res: Response, next: NextFunction): Response | void => {
    const { tanggal_lahir, id_kelas_kejuaraan } = req.body;

    // This would need to check against the age requirements for the competition class
    // For now, just validate that birth date is reasonable
    if (tanggal_lahir) {
      const birthDate = new Date(tanggal_lahir);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();

      if (age < 5 || age > 100) {
        return sendValidationError(res, 'Invalid athlete age', [
          { field: 'tanggal_lahir', message: 'Athlete age must be between 5 and 100 years' }
        ]);
      }
    }

    next();
  }
};