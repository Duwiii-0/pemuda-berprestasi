export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any
  meta?: {
    timestamp: string
    path?: string
    method?: string
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: PaginationMeta & {
    timestamp: string
    path?: string
    method?: string
  }
}

export const successResponse = <T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const createdResponse = <T>(
  data: T,
  message: string = 'Resource created successfully'
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const paginatedResponse = <T>(
  data: T[],
  pagination: PaginationMeta,
  message: string = 'Data retrieved successfully'
): PaginatedResponse<T[]> => ({
  success: true,
  message,
  data,
  meta: {
    ...pagination,
    timestamp: new Date().toISOString()
  }
})

export const errorResponse = (
  message: string,
  errors?: any,
  statusCode: number = 400
): ApiResponse => ({
  success: false,
  message,
  errors,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const validationErrorResponse = (
  errors: any,
  message: string = 'Validation failed'
): ApiResponse => ({
  success: false,
  message,
  errors,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const unauthorizedResponse = (
  message: string = 'Unauthorized access'
): ApiResponse => ({
  success: false,
  message,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const notFoundResponse = (
  message: string = 'Resource not found'
): ApiResponse => ({
  success: false,
  message,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const serverErrorResponse = (
  message: string = 'Internal server error',
  error?: any
): ApiResponse => ({
  success: false,
  message,
  errors: process.env.NODE_ENV === 'development' ? error : undefined,
  meta: {
    timestamp: new Date().toISOString()
  }
})

import { Response } from 'express'

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    return res.status(statusCode).json(successResponse(data, message))
  }

  static created<T>(res: Response, data: T, message?: string) {
    return res.status(201).json(createdResponse(data, message))
  }

  static paginated<T>(res: Response, data: T[], pagination: PaginationMeta, message?: string) {
    return res.status(200).json(paginatedResponse(data, pagination, message))
  }

  static error(res: Response, message: string, errors?: any, statusCode: number = 400) {
    return res.status(statusCode).json(errorResponse(message, errors, statusCode))
  }

  static validationError(res: Response, errors: any, message?: string) {
    return res.status(400).json(validationErrorResponse(errors, message))
  }

  static unauthorized(res: Response, message?: string) {
    return res.status(401).json(unauthorizedResponse(message))
  }

  static forbidden(res: Response, message: string = 'Access forbidden') {
    return res.status(403).json(errorResponse(message, null, 403))
  }

  static notFound(res: Response, message?: string) {
    return res.status(404).json(notFoundResponse(message))
  }

  static serverError(res: Response, message?: string, error?: any) {
    return res.status(500).json(serverErrorResponse(message, error))
  }
}