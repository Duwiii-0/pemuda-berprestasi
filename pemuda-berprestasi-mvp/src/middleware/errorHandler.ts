// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

// Global error handler
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err

  // Prisma errors
  if (err.message.includes('Unique constraint')) {
    statusCode = 409
    message = 'Resource already exists'
  }
  
  if (err.message.includes('Record not found')) {
    statusCode = 404
    message = 'Resource not found'
  }
  
  if (err.message.includes('Foreign key constraint')) {
    statusCode = 400
    message = 'Invalid reference data'
  }

  // Log error in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
  }

  // Don't expose stack trace in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  }

  res.status(statusCode).json(response)
}

// Handle async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404)
}