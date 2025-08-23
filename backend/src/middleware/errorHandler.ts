import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpStatus, ErrorCode } from '@/types';
import { generateRequestId } from '@/utils/response';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: string = ErrorCode.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(
      `${resource} not found`,
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND
    );
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      true,
      details
    );
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      ErrorCode.AUTHENTICATION_ERROR
    );
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(
      message,
      HttpStatus.FORBIDDEN,
      ErrorCode.AUTHORIZATION_ERROR
    );
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.CONFLICT,
      ErrorCode.RESOURCE_CONFLICT,
      true,
      details
    );
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }
}

/**
 * Handle Prisma errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2000':
      return new ValidationError('Value too long for column', {
        field: error.meta?.column_name,
        constraint: 'length'
      });
    
    case 'P2001':
      return new NotFoundError('Record');
    
    case 'P2002':
      return new ConflictError('Unique constraint violation', {
        field: error.meta?.target,
        constraint: 'unique'
      });
    
    case 'P2003':
      return new ValidationError('Foreign key constraint violation', {
        field: error.meta?.field_name,
        constraint: 'foreign_key'
      });
    
    case 'P2004':
      return new ValidationError('Constraint violation', {
        constraint: error.meta?.constraint
      });
    
    case 'P2005':
      return new ValidationError('Invalid value for field', {
        field: error.meta?.field_name,
        value: error.meta?.field_value
      });
    
    case 'P2006':
      return new ValidationError('Invalid value provided', {
        field: error.meta?.field_name
      });
    
    case 'P2007':
      return new ValidationError('Data validation error', {
        constraint: error.meta?.database_error
      });
    
    case 'P2008':
      return new AppError('Failed to parse query', HttpStatus.BAD_REQUEST);
    
    case 'P2009':
      return new AppError('Failed to validate query', HttpStatus.BAD_REQUEST);
    
    case 'P2010':
      return new AppError('Raw query failed', HttpStatus.INTERNAL_SERVER_ERROR);
    
    case 'P2011':
      return new ValidationError('Null constraint violation', {
        field: error.meta?.constraint
      });
    
    case 'P2012':
      return new ValidationError('Missing required value', {
        field: error.meta?.path
      });
    
    case 'P2013':
      return new ValidationError('Missing required argument', {
        argument: error.meta?.argument_name
      });
    
    case 'P2014':
      return new ValidationError('Invalid ID', {
        relation: error.meta?.relation_name
      });
    
    case 'P2015':
      return new NotFoundError('Related record');
    
    case 'P2016':
      return new AppError('Query interpretation error', HttpStatus.BAD_REQUEST);
    
    case 'P2017':
      return new ValidationError('Records not connected', {
        relation: error.meta?.relation_name
      });
    
    case 'P2018':
      return new ValidationError('Required connected records not found', {
        relation: error.meta?.relation_name
      });
    
    case 'P2019':
      return new ValidationError('Input error', {
        details: error.meta?.details
      });
    
    case 'P2020':
      return new ValidationError('Value out of range', {
        field: error.meta?.field_name
      });
    
    case 'P2021':
      return new NotFoundError('Table');
    
    case 'P2022':
      return new NotFoundError('Column');
    
    case 'P2023':
      return new ValidationError('Inconsistent column data', {
        column: error.meta?.column_name
      });
    
    case 'P2024':
      return new AppError('Connection timeout', HttpStatus.REQUEST_TIMEOUT);
    
    case 'P2025':
      return new NotFoundError('Operation target record');
    
    default:
      return new AppError('Database error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR);
  }
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): ValidationError => {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.input
  }));

  return new ValidationError('Validation failed', details);
};

/**
 * Log error for monitoring
 */
const logError = (error: Error, req: Request): void => {
  const requestId = generateRequestId();
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };

  if (error instanceof AppError && !error.isOperational) {
    console.error('🚨 Programming Error:', JSON.stringify(logData, null, 2));
  } else {
    console.error('⚠️ Operational Error:', JSON.stringify(logData, null, 2));
  }
};

/**
 * Send error response
 */
const sendErrorResponse = (error: AppError, req: Request, res: Response): void => {
  const requestId = generateRequestId();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    requestId,
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details }),
    ...(isDevelopment && error.stack && { stack: error.stack })
  };

  res.status(error.statusCode).json(response);
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    appError = new AppError('Unknown database error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR);
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    appError = new AppError('Database connection error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR);
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    appError = new AppError('Database initialization error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Database validation error');
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.name === 'MulterError') {
    appError = new ValidationError(`File upload error: ${error.message}`);
  } else {
    // Unknown error - this is a programming error
    appError = new AppError(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      false // Not operational
    );
  }

  // Log error
  logError(error, req);

  // Send response
  sendErrorResponse(appError, req, res);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  sendErrorResponse(error, req, res);
};

/**
 * Async error wrapper
 */
export const asyncHandler = <T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('💥 Unhandled Rejection:', reason);
    process.exit(1);
  });
};