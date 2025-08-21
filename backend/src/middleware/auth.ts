import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '@/utils/jwt';
import { prisma } from '@/config/database';
import { sendUnauthorized, sendForbidden } from '@/utils/response';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        username: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return sendUnauthorized(res, 'Authorization header required');
    }
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return sendUnauthorized(res, 'Token required');
    }
    
    // Verify token
    const decoded = verifyToken(token) as JwtPayload;
    
    if (!decoded || !decoded.userId) {
      return sendUnauthorized(res, 'Invalid token');
    }
    
    // Check if user still exists and is active
    const user = await prisma.tb_akun.findUnique({
      where: { 
        id_akun: decoded.userId,
        is_active: true
      },
      select: {
        id_akun: true,
        username: true,
        email: true,
        role: true,
        is_active: true
      }
    });
    
    if (!user) {
      return sendUnauthorized(res, 'User not found or inactive');
    }
    
    // Attach user to request
    req.user = {
      id: user.id_akun,
      email: user.email,
      role: user.role,
      username: user.username
    };
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return sendUnauthorized(res, 'Invalid token');
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = verifyToken(token) as JwtPayload;
          
          if (decoded && decoded.userId) {
            const user = await prisma.tb_akun.findUnique({
              where: { 
                id_akun: decoded.userId,
                is_active: true
              },
              select: {
                id_akun: true,
                username: true,
                email: true,
                role: true
              }
            });
            
            if (user) {
              req.user = {
                id: user.id_akun,
                email: user.email,
                role: user.role,
                username: user.username
              };
            }
          }
        } catch (error) {
          // Ignore token errors in optional auth
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string | string[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }
    
    next();
  };
};

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Organizer or Admin middleware
 */
export const requireOrganizerOrAdmin = requireRole(['PENYELENGGARA', 'ADMIN']);

/**
 * Authenticated user (any role) middleware
 */
export const requireAuth = authenticate;

/**
 * Check if user owns resource middleware
 */
export const requireOwnership = (
  getResourceUserId: (req: Request) => Promise<number | null>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.user) {
        return sendUnauthorized(res, 'Authentication required');
      }
      
      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }
      
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        return sendForbidden(res, 'Resource not found');
      }
      
      if (req.user.id !== resourceUserId) {
        return sendForbidden(res, 'Access denied - not resource owner');
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return sendForbidden(res, 'Access denied');
    }
  };
};

/**
 * Check if user can manage competition
 */
export const canManageCompetition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    // Admin can manage any competition
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    // Only organizers can manage competitions
    if (req.user.role !== 'PENYELENGGARA') {
      return sendForbidden(res, 'Only organizers can manage competitions');
    }
    
    const competitionId = req.params.id || req.body.id_kompetisi;
    
    if (competitionId) {
      // Check if organizer owns this competition
      const competition = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: parseInt(competitionId) },
        select: { id_penyelenggara: true }
      });
      
      if (!competition) {
        return sendForbidden(res, 'Competition not found');
      }
      
      if (competition.id_penyelenggara !== req.user.id) {
        return sendForbidden(res, 'Access denied - not competition owner');
      }
    }
    
    next();
  } catch (error) {
    console.error('Competition management check error:', error);
    return sendForbidden(res, 'Access denied');
  }
};

/**
 * Check if user can manage athlete
 */
export const canManageAthlete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    // Admin can manage any athlete
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    const athleteId = req.params.id || req.body.id_atlit;
    
    if (athleteId) {
      const athlete = await prisma.tb_atlit.findUnique({
        where: { id_atlit: parseInt(athleteId) },
        include: { 
          tb_dojang: { 
            select: { id_akun: true } 
          } 
        }
      });
      
      if (!athlete) {
        return sendForbidden(res, 'Athlete not found');
      }
      
      // Check if user owns the athlete or the dojang
      if (req.user.role === 'ATLIT' && athlete.id_akun !== req.user.id) {
        return sendForbidden(res, 'Access denied - not athlete owner');
      }
      
      if (req.user.role === 'DOJANG' && athlete.tb_dojang?.id_akun !== req.user.id) {
        return sendForbidden(res, 'Access denied - athlete not from your dojang');
      }
    }
    
    next();
  } catch (error) {
    console.error('Athlete management check error:', error);
    return sendForbidden(res, 'Access denied');
  }
};

/**
 * Rate limiting for authentication attempts
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};