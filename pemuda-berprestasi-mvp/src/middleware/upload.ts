// src/middleware/upload.ts
import { Request, Response, NextFunction } from 'express'
import { upload } from '../config/multer'
import { sendError } from '../utils/response'

// Handle multer upload errors
export const handleUploadError = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([
    { name: 'foto_ktp', maxCount: 1 },
    { name: 'sertifikat_sabuk', maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size too large. Maximum 5MB allowed', 400)
      }
      
      if (err.message.includes('Only JPEG, PNG, and PDF')) {
        return sendError(res, 'Invalid file type. Only JPEG, PNG, and PDF files are allowed', 400)
      }
      
      if (err.message.includes('Invalid file field')) {
        return sendError(res, 'Invalid file field. Use foto_ktp or sertifikat_sabuk', 400)
      }
      
      return sendError(res, err.message || 'Upload error', 400)
    }
    
    next()
  })
}

// Single file upload for specific field
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size too large. Maximum 5MB allowed', 400)
        }
        
        return sendError(res, err.message || 'Upload error', 400)
      }
      
      next()
    })
  }
}

export const uploadMiddleware = {
  fields: (fields: { name: string; maxCount: number }[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      upload.fields(fields)(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return sendError(res, 'File size too large. Maximum 5MB allowed', 400)
          }
          return sendError(res, err.message || 'Upload error', 400)
        }
        next()
      })
    }
  }
}
