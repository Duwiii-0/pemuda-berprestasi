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


// Update validateRequest function untuk handle FormData
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // DEBUGGING: Log data yang masuk
    console.log('🔍 Validation - Content-Type:', req.headers['content-type']);
    console.log('🔍 Validation - Raw data:', req[property]);
    console.log('🔍 Validation - Data keys:', Object.keys(req[property] || {}));
    
    // PERBAIKAN: Handle FormData - convert empty strings untuk optional fields
    let dataToValidate = { ...req[property] };
    
    // Jika Content-Type adalah multipart/form-data, process empty strings
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log('📦 Processing FormData...');
      
      // Convert empty strings to null/undefined untuk optional fields
      Object.keys(dataToValidate).forEach(key => {
        if (dataToValidate[key] === '' || dataToValidate[key] === 'undefined') {
          dataToValidate[key] = undefined;
        }
      });
      
      console.log('✅ Processed FormData:', dataToValidate);
    }
    
    const { error } = schema.validate(dataToValidate, { 
      abortEarly: false,
      allowUnknown: true,    // Allow unknown fields
      stripUnknown: false    // Don't remove unknown fields
    });
    
    if (error) {
      console.log('❌ Validation failed:', error.details);
      
      return res.status(400).json({
        success: false,
        message: 'Request validation error',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    
    console.log('✅ Validation passed');
    next();
  }
}
