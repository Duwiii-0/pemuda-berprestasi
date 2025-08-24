// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ObjectSchema } from 'joi'
import { sendValidationError } from '../utils/response'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      
      return sendValidationError(res, errors, 'Validation error')
    }
    
    next()
  }
}

// Validate params (untuk validasi URL parameters)
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params)
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      
      return sendValidationError(res, errors, 'Parameter validation error')
    }
    
    next()
  }
}


// Validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query)
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      
      return sendValidationError(res, errors, 'Query validation error')
    }
    
    next()
  }
}


export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Request validation error',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    next();
  }
}
