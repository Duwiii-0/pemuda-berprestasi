// src/middleware/upload.ts
import { Request, Response, NextFunction } from 'express'
import { upload } from '../config/multer'
import { sendError } from '../utils/response'

// Handle multer upload errors
export const handleUploadError = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 },
    { name: 'foto_ktp', maxCount: 1 },
    { name: 'sertifikat_sabuk', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'bukti_transfer', maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size too large. Maximum 5MB allowed', 400)
      }
      
      if (err.message.includes('Only JPEG, PNG, and PDF')) {
        return sendError(res, 'Invalid file type. Only JPEG, PNG, and PDF files are allowed', 400)
      }
      
      if (err.message.includes('Invalid file field')) {
        return sendError(res, 'Invalid file field. Use foto_ktp, sertifikat_sabuk, or logo', 400)
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

// Specific middleware for dojang logo upload
export const uploadDojangLogo = (req: Request, res: Response, next: NextFunction) => {
  upload.single('logo')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Logo file size too large. Maximum 5MB allowed', 400)
      }
      
      if (err.message.includes('Only JPEG, PNG')) {
        return sendError(res, 'Invalid logo file type. Only JPEG, PNG, JPG, and WebP files are allowed', 400)
      }
      
      return sendError(res, err.message || 'Logo upload error', 400)
    }
    
    next()
  })
}

// ⬅️ TAMBAH: Specific middleware untuk bukti transfer upload
export const uploadBuktiTransfer = (req: Request, res: Response, next: NextFunction) => {
  upload.single('bukti_transfer')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Bukti transfer file size too large. Maximum 5MB allowed', 400)
      }
      
      if (err.message.includes('Only JPEG, PNG')) {
        return sendError(res, 'Invalid bukti transfer file type. Only JPEG, PNG, JPG, and WebP files are allowed', 400)
      }
      
      return sendError(res, err.message || 'Bukti transfer upload error', 400)
    }
    
    next()
  })
}
