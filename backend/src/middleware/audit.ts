import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { generateRequestId } from '@/utils/response';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  userId?: number;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseStatus: number;
  responseTime: number;
  timestamp: Date;
  metadata?: any;
}

/**
 * Actions that should be audited
 */
const AUDITED_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  
  // Competition Management
  COMPETITION_CREATE: 'COMPETITION_CREATE',
  COMPETITION_UPDATE: 'COMPETITION_UPDATE',
  COMPETITION_DELETE: 'COMPETITION_DELETE',
  COMPETITION_PUBLISH: 'COMPETITION_PUBLISH',
  COMPETITION_CLOSE: 'COMPETITION_CLOSE',
  
  // Registration
  ATHLETE_REGISTER: 'ATHLETE_REGISTER',
  COMPETITION_REGISTER: 'COMPETITION_REGISTER',
  REGISTRATION_APPROVE: 'REGISTRATION_APPROVE',
  REGISTRATION_REJECT: 'REGISTRATION_REJECT',
  
  // Match Management
  MATCH_CREATE: 'MATCH_CREATE',
  MATCH_UPDATE: 'MATCH_UPDATE',
  MATCH_RESULT: 'MATCH_RESULT',
  MATCH_SCHEDULE: 'MATCH_SCHEDULE',
  
  // Data Access
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  REPORT_GENERATE: 'REPORT_GENERATE',
  
  // System
  SYSTEM_CONFIG: 'SYSTEM_CONFIG',
  BACKUP_CREATE: 'BACKUP_CREATE',
  BACKUP_RESTORE: 'BACKUP_RESTORE'
};

/**
 * Resources that should be audited
 */
const AUDITED_RESOURCES = {
  USER: 'USER',
  ATHLETE: 'ATHLETE',
  DOJANG: 'DOJANG',
  COMPETITION: 'COMPETITION',
  MATCH: 'MATCH',
  REGISTRATION: 'REGISTRATION',
  SYSTEM: 'SYSTEM'
};

/**
 * Determine if request should be audited
 */
const shouldAudit = (req: Request): boolean => {
  const { method, path } = req;
  
  // Don't audit GET requests to public endpoints
  if (method === 'GET' && path.startsWith('/api/public')) {
    return false;
  }
  
  // Don't audit health checks
  if (path.includes('/health') || path.includes('/status')) {
    return false;
  }
  
  // Audit all POST, PUT, DELETE requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }
  
  // Audit sensitive GET requests
  const sensitivePatterns = [
    '/api/admin',
    '/api/reports',
    '/api/export',
    '/api/users',
    '/api/competitions/.*/participants'
  ];
  
  return sensitivePatterns.some(pattern => 
    new RegExp(pattern).test(path)
  );
};

/**
 * Extract action from request
 */
const extractAction = (req: Request): string => {
  const { method, path } = req;
  
  // Authentication actions
  if (path.includes('/auth/login')) return AUDITED_ACTIONS.LOGIN;
  if (path.includes('/auth/logout')) return AUDITED_ACTIONS.LOGOUT;
  if (path.includes('/auth/register')) return AUDITED_ACTIONS.REGISTER;
  if (path.includes('/auth/change-password')) return AUDITED_ACTIONS.PASSWORD_CHANGE;
  if (path.includes('/auth/reset-password')) return AUDITED_ACTIONS.PASSWORD_RESET;
  
  // Competition actions
  if (path.includes('/competitions')) {
    if (method === 'POST') return AUDITED_ACTIONS.COMPETITION_CREATE;
    if (method === 'PUT' || method === 'PATCH') return AUDITED_ACTIONS.COMPETITION_UPDATE;
    if (method === 'DELETE') return AUDITED_ACTIONS.COMPETITION_DELETE;
    if (path.includes('/publish')) return AUDITED_ACTIONS.COMPETITION_PUBLISH;
    if (path.includes('/close')) return AUDITED_ACTIONS.COMPETITION_CLOSE;
  }
  
  // Registration actions
  if (path.includes('/register')) {
    if (path.includes('/athletes')) return AUDITED_ACTIONS.ATHLETE_REGISTER;
    if (path.includes('/competitions')) return AUDITED_ACTIONS.COMPETITION_REGISTER;
  }
  
  if (path.includes('/approve')) return AUDITED_ACTIONS.REGISTRATION_APPROVE;
  if (path.includes('/reject')) return AUDITED_ACTIONS.REGISTRATION_REJECT;
  
  // Match actions
  if (path.includes('/matches')) {
    if (method === 'POST') return AUDITED_ACTIONS.MATCH_CREATE;
    if (method === 'PUT' || method === 'PATCH') return AUDITED_ACTIONS.MATCH_UPDATE;
    if (path.includes('/result')) return AUDITED_ACTIONS.MATCH_RESULT;
    if (path.includes('/schedule')) return AUDITED_ACTIONS.MATCH_SCHEDULE;
  }
  
  // User management
  if (path.includes('/users')) {
    if (method === 'POST') return AUDITED_ACTIONS.USER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return AUDITED_ACTIONS.USER_UPDATE;
    if (method === 'DELETE') return AUDITED_ACTIONS.USER_DELETE;
    if (path.includes('/activate')) return AUDITED_ACTIONS.USER_ACTIVATE;
    if (path.includes('/deactivate')) return AUDITED_ACTIONS.USER_DEACTIVATE;
  }
  
  // Data actions
  if (path.includes('/export')) return AUDITED_ACTIONS.DATA_EXPORT;
  if (path.includes('/import')) return AUDITED_ACTIONS.DATA_IMPORT;
  if (path.includes('/reports')) return AUDITED_ACTIONS.REPORT_GENERATE;
  
  // System actions
  if (path.includes('/system')) return AUDITED_ACTIONS.SYSTEM_CONFIG;
  if (path.includes('/backup')) {
    if (path.includes('/create')) return AUDITED_ACTIONS.BACKUP_CREATE;
    if (path.includes('/restore')) return AUDITED_ACTIONS.BACKUP_RESTORE;
  }
  
  // Default action based on method
  return `${method}_${path.split('/')[2]?.toUpperCase() || 'UNKNOWN'}`;
};

/**
 * Extract resource from request
 */
const extractResource = (req: Request): string => {
  const { path } = req;
  
  if (path.includes('/users') || path.includes('/auth')) return AUDITED_RESOURCES.USER;
  if (path.includes('/athletes')) return AUDITED_RESOURCES.ATHLETE;
  if (path.includes('/dojangs')) return AUDITED_RESOURCES.DOJANG;
  if (path.includes('/competitions')) return AUDITED_RESOURCES.COMPETITION;
  if (path.includes('/matches')) return AUDITED_RESOURCES.MATCH;
  if (path.includes('/register')) return AUDITED_RESOURCES.REGISTRATION;
  if (path.includes('/system')) return AUDITED_RESOURCES.SYSTEM;
  
  return 'UNKNOWN';
};

/**
 * Extract resource ID from request
 */
const extractResourceId = (req: Request): string | undefined => {
  const { params, body } = req;
  
  // Try to get ID from URL parameters
  const idParams = ['id', 'athleteId', 'competitionId', 'matchId', 'userId', 'dojangId'];
  for (const param of idParams) {
    if (params[param]) return params[param];
  }
  
  // Try to get ID from request body
  const idFields = ['id', 'id_atlit', 'id_kompetisi', 'id_pertandingan', 'id_akun', 'id_dojang'];
  for (const field of idFields) {
    if (body[field]) return body[field].toString();
  }
  
  return undefined;
};

/**
 * Sanitize sensitive data from request body
 */
const sanitizeRequestBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'refreshToken',
    'secret',
    'key',
    'creditCard',
    'ssn',
    'socialSecurityNumber'
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Save audit log to database
 */
const saveAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    // In a real application, you might want to save this to a separate audit table
    // For now, we'll use console logging with structured format
    console.log('🔍 AUDIT LOG:', JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      user: entry.userId ? `${entry.userId} (${entry.userRole})` : 'Anonymous',
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      endpoint: `${entry.method} ${entry.endpoint}`,
      ipAddress: entry.ipAddress,
      responseStatus: entry.responseStatus,
      responseTime: `${entry.responseTime}ms`,
      metadata: entry.metadata
    }, null, 2));
    
    // TODO: Implement actual database storage
    // await prisma.auditLog.create({ data: entry });
    
  } catch (error) {
    console.error('Failed to save audit log:', error);
    // Don't throw error to avoid breaking the request
  }
};

/**
 * Audit middleware
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip if not an auditable request
  if (!shouldAudit(req)) {
    return next();
  }
  
  const startTime = Date.now();
  const auditId = generateRequestId();
  
  // Capture original res.end to log response
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any): Response {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      id: auditId,
      userId: req.user?.id,
      userRole: req.user?.role,
      action: extractAction(req),
      resource: extractResource(req),
      resourceId: extractResourceId(req),
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestBody: sanitizeRequestBody(req.body),
      responseStatus: res.statusCode,
      responseTime,
      timestamp: new Date(startTime),
      metadata: {
        query: req.query,