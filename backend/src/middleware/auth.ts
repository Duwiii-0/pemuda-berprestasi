import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { ApiResponse } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return ApiResponse.error(res, 'Token tidak ditemukan', 401);
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return ApiResponse.error(res, 'Format token tidak valid', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return ApiResponse.error(res, 'Token tidak valid', 401);
  }
};