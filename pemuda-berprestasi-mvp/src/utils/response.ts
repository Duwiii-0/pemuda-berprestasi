// src/utils/response.ts
import { Response } from 'express'

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any
}

export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message: string = 'Success',
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  }
  return res.status(statusCode).json(response)
}

export const sendError = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = 400,
  errors?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    errors
  }
  return res.status(statusCode).json(response)
}

export const sendUnauthorized = (res: Response, message: string = 'Unauthorized') => {
  return sendError(res, message, 401)
}

export const sendForbidden = (res: Response, message: string = 'Forbidden') => {
  return sendError(res, message, 403)
}

export const sendNotFound = (res: Response, message: string = 'Resource not found') => {
  return sendError(res, message, 404)
}

export const sendValidationError = (res: Response, errors: any) => {
  return sendError(res, 'Validation error', 422, errors)
}