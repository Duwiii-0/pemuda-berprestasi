// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/jwt'
import { sendUnauthorized, sendForbidden } from '../utils/response'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Token not provided')
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = verifyToken(token)
    
    req.user = decoded
    next()
  } catch (error) {
    return sendUnauthorized(res, 'Invalid or expired token')
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required')
    }
    
    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions')
    }
    
    next()
  }
}

// Middleware khusus untuk pelatih (harus punya pelatihId)
export const requirePelatih = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required')
  }
  
  if (req.user.role !== 'PELATIH' || !req.user.pelatihId) {
    return sendForbidden(res, 'Pelatih access required')
  }
  
  next()
}

// Middleware untuk admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required')
  }
  
  if (req.user.role !== 'ADMIN' || !req.user.adminId) {
    return sendForbidden(res, 'Admin access required')
  }
  
  next()
}