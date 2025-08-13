import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { ApiResponse } from '../utils/response';

export const validateRequest = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return ApiResponse.error(res, 'Validation error', 400, errorDetails);
    }
    
    next();
  };
};