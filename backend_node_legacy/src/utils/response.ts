import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Support both pagination formats
type PaginationInput = 
  | {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  | {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };

// Updated sendSuccess function to accept optional pagination parameter
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  pagination?: PaginationInput
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    // Normalize pagination format
    if ('currentPage' in pagination) {
      response.pagination = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        total: pagination.totalItems,
        totalPages: pagination.totalPages,
      };
    } else {
      response.pagination = pagination;
    }
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

// Additional utility functions for specific HTTP status codes
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Access forbidden'
): Response => {
  return sendError(res, message, 403);
};

export const sendValidationError = (
  res: Response,
  errors: any,
  message: string = 'Validation error'
): Response => {
  return res.status(400).json({
    success: false,
    message,
    errors
  });
};