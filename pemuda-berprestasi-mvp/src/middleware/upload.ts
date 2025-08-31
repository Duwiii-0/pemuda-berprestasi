// src/middleware/upload.ts
import { Request, Response, NextFunction } from 'express'
import { upload } from '../config/multer'
import { sendError } from '../utils/response'

// File validation configuration
const FILE_CONFIG = {
  maxSizes: {
    ktp: 5 * 1024 * 1024,        // 5MB for KTP
    foto_ktp: 5 * 1024 * 1024,   // 5MB for KTP
    akte_kelahiran: 5 * 1024 * 1024, // 5MB for Akte
    pas_foto: 2 * 1024 * 1024,   // 2MB for Pas Foto
    sertifikat_belt: 10 * 1024 * 1024,  // 10MB for Sertifikat Belt
    sertifikat_sabuk: 10 * 1024 * 1024, // 10MB for Sertifikat Sabuk
  },
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
}

// Validate file type and size
const validateFile = (file: Express.Multer.File, fieldName: string) => {
  // Check file type
  if (!FILE_CONFIG.allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type for ${fieldName}. Only JPEG, PNG, and PDF files are allowed`)
  }

  // Check file size based on field
  const maxSize = FILE_CONFIG.maxSizes[fieldName as keyof typeof FILE_CONFIG.maxSizes] || 5 * 1024 * 1024
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    throw new Error(`File size too large for ${fieldName}. Maximum ${maxSizeMB}MB allowed`)
  }

  // Check file extension
  const fileExt = file.originalname.toLowerCase().match(/\.[^.]+$/)
  if (!fileExt || !FILE_CONFIG.allowedExtensions.includes(fileExt[0])) {
    throw new Error(`Invalid file extension for ${fieldName}. Allowed: ${FILE_CONFIG.allowedExtensions.join(', ')}`)
  }
}

// Handle multer upload errors for multiple fields
export const handleUploadError = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 },
    { name: 'foto_ktp', maxCount: 1 },
    { name: 'sertifikat_sabuk', maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      console.error('Upload error:', err)
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size too large. Check individual file size limits', 400)
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return sendError(res, 'Too many files. Only one file per field allowed', 400)
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendError(res, 'Invalid file field. Check allowed field names', 400)
      }
      
      return sendError(res, err.message || 'Upload error occurred', 400)
    }

    // Validate uploaded files
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      
      if (files) {
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            validateFile(fileArray[0], fieldName)
          }
        }
      }

      next()
    } catch (validationError: any) {
      return sendError(res, validationError.message, 400)
    }
  })
}

// Single file upload for specific field
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        console.error(`Upload error for ${fieldName}:`, err)
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxSize = FILE_CONFIG.maxSizes[fieldName as keyof typeof FILE_CONFIG.maxSizes]
          const maxSizeMB = maxSize ? Math.round(maxSize / (1024 * 1024)) : 5
          return sendError(res, `File size too large for ${fieldName}. Maximum ${maxSizeMB}MB allowed`, 400)
        }
        
        return sendError(res, err.message || 'Upload error occurred', 400)
      }

      // Validate the uploaded file
      try {
        if (req.file) {
          validateFile(req.file, fieldName)
        }
        next()
      } catch (validationError: any) {
        return sendError(res, validationError.message, 400)
      }
    })
  }
}

// Flexible upload middleware for custom field configurations
export const uploadMiddleware = {
  fields: (fields: { name: string; maxCount: number }[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      upload.fields(fields)(req, res, (err: any) => {
        if (err) {
          console.error('Upload middleware error:', err)
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            return sendError(res, 'File size too large. Check individual file size limits', 400)
          }
          
          if (err.code === 'LIMIT_FILE_COUNT') {
            return sendError(res, 'Too many files uploaded', 400)
          }
          
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return sendError(res, 'Unexpected file field', 400)
          }
          
          return sendError(res, err.message || 'Upload error occurred', 400)
        }

        // Validate all uploaded files
        try {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] }
          
          if (files) {
            for (const [fieldName, fileArray] of Object.entries(files)) {
              if (fileArray && fileArray.length > 0) {
                for (const file of fileArray) {
                  validateFile(file, fieldName)
                }
              }
            }
          }

          next()
        } catch (validationError: any) {
          return sendError(res, validationError.message, 400)
        }
      })
    }
  },

  // Helper for athlete files
  atletFiles: () => {
    return uploadMiddleware.fields([
      { name: 'akte_kelahiran', maxCount: 1 },
      { name: 'pas_foto', maxCount: 1 },
      { name: 'sertifikat_belt', maxCount: 1 },
      { name: 'ktp', maxCount: 1 }
    ])
  },

  // Helper for coach files
  pelatihFiles: () => {
    return uploadMiddleware.fields([
      { name: 'foto_ktp', maxCount: 1 },
      { name: 'sertifikat_sabuk', maxCount: 1 }
    ])
  }
}

// File cleanup middleware (for handling failed uploads)
export const cleanupFiles = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send

  res.send = function(data) {
    // If response is an error and there are files, clean them up
    if (res.statusCode >= 400) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      
      if (files) {
        for (const fileArray of Object.values(files)) {
          if (fileArray) {
            for (const file of fileArray) {
              // Note: Cleanup will be handled by Google Drive service
              console.log(`Should cleanup file: ${file.path}`)
            }
          }
        }
      }

      if (req.file) {
        console.log(`Should cleanup file: ${req.file.path}`)
      }
    }

    return originalSend.call(this, data)
  }

  next()
}