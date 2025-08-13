import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return ApiResponse.error(res, 'Data sudah ada (duplicate)', 409);
      case 'P2014':
        return ApiResponse.error(res, 'Data yang diperlukan tidak ditemukan', 400);
      case 'P2003':
        return ApiResponse.error(res, 'Referensi data tidak valid', 400);
      case 'P2025':
        return ApiResponse.error(res, 'Data tidak ditemukan', 404);
      default:
        return ApiResponse.error(res, 'Database error', 500);
    }
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return ApiResponse.error(res, 'File terlalu besar (maksimal 5MB)', 400);
  }

  if (error.message && error.message.includes('files are allowed')) {
    return ApiResponse.error(res, error.message, 400);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Token tidak valid', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token sudah expired', 401);
  }

  // Default error
  return ApiResponse.error(res, 'Internal server error', 500);
};