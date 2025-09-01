// src/middleware/upload.ts
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { sendError } from '../utils/response'

// File validation configuration
const FILE_CONFIG = {
  maxSizes: {
    ktp: 5 * 1024 * 1024,        // 5MB for KTP atlet
    foto_ktp: 5 * 1024 * 1024,   // 5MB for KTP pelatih
    akte_kelahiran: 5 * 1024 * 1024, // 5MB for Akte
    pas_foto: 2 * 1024 * 1024,   // 2MB for Pas Foto
    sertifikat_belt: 10 * 1024 * 1024,  // 10MB for Sertifikat Belt
    sertifikat_sabuk: 10 * 1024 * 1024, // 10MB for Sertifikat Sabuk
    file: 10 * 1024 * 1024       // 10MB default for generic file uploads
  },
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
}

// Create upload directories
const createUploadDirs = () => {
  const dirs = [
    'uploads/temp',  // Temporary storage before Google Drive
    'uploads/atlet/ktp',
    'uploads/atlet/akte_kelahiran',
    'uploads/atlet/pas_foto',
    'uploads/atlet/sertifikat_belt',
    'uploads/pelatih/ktp',
    'uploads/pelatih/sertifikat'
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// Initialize directories
createUploadDirs()

// Dynamic storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For single file uploads, use temp directory
    const isGeneric = file.fieldname === 'file'
    
    if (isGeneric) {
      cb(null, 'uploads/temp')
      return
    }

    // For specific field uploads, use appropriate directory
    const { userType } = req.params
    const fieldName = file.fieldname

    let folder = 'uploads/temp' // fallback

    if (userType === 'atlet') {
      switch (fieldName) {
        case 'ktp': folder = 'uploads/atlet/ktp'; break
        case 'akte_kelahiran': folder = 'uploads/atlet/akte_kelahiran'; break
        case 'pas_foto': folder = 'uploads/atlet/pas_foto'; break
        case 'sertifikat_belt': folder = 'uploads/atlet/sertifikat_belt'; break
      }
    } else if (userType === 'pelatih') {
      switch (fieldName) {
        case 'foto_ktp': folder = 'uploads/pelatih/ktp'; break
        case 'sertifikat_sabuk': folder = 'uploads/pelatih/sertifikat'; break
      }
    }

    cb(null, folder)
  },
  
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_')
    
    // For generic uploads or when no user ID available
    if (file.fieldname === 'file' || !req.params.userId) {
      cb(null, `temp_${timestamp}_${baseName}${ext}`)
      return
    }

    const userId = req.params.userId || req.params.id_atlet || req.params.id_pelatih
    const fileType = req.params.fileType || file.fieldname
    
    cb(null, `${userId}_${fileType}_${timestamp}_${baseName}${ext}`)
  }
})

// File filter validation
const fileFilter = (req: any, file: any, cb: any) => {
  try {
    // Check mime type
    if (!FILE_CONFIG.allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and PDF allowed`), false)
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase()
    if (!FILE_CONFIG.allowedExtensions.includes(ext)) {
      return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${FILE_CONFIG.allowedExtensions.join(', ')}`), false)
    }

    cb(null, true)
  } catch (error: any) {
    cb(error, false)
  }
}

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
})

// Validate uploaded file
const validateFile = (file: Express.Multer.File, fieldName: string) => {
  // Check file type
  if (!FILE_CONFIG.allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type for ${fieldName}. Only JPEG, PNG, and PDF files are allowed`)
  }

  // Check file size based on field
  const maxSize = FILE_CONFIG.maxSizes[fieldName as keyof typeof FILE_CONFIG.maxSizes] || 10 * 1024 * 1024
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    throw new Error(`File size too large for ${fieldName}. Maximum ${maxSizeMB}MB allowed`)
  }

  // Validate file exists
  if (!fs.existsSync(file.path)) {
    throw new Error(`Uploaded file not found: ${file.path}`)
  }
}

// Middleware for multiple files upload
export const uploadMultipleFiles = (fields: { name: string; maxCount: number }[]) => {
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
          return sendError(res, 'Unexpected file field. Check allowed field names', 400)
        }
        
        return sendError(res, err.message || 'Upload error occurred', 400)
      }

      // Validate all uploaded files
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        
        if (files && Object.keys(files).length > 0) {
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
}

// Middleware for single file upload
export const uploadSingleFile = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        console.error(`Upload error for ${fieldName}:`, err)
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxSize = FILE_CONFIG.maxSizes[fieldName as keyof typeof FILE_CONFIG.maxSizes] || 10 * 1024 * 1024
          const maxSizeMB = Math.round(maxSize / (1024 * 1024))
          return sendError(res, `File size too large for ${fieldName}. Maximum ${maxSizeMB}MB allowed`, 400)
        }
        
        return sendError(res, err.message || 'Upload error occurred', 400)
      }

      // Validate the uploaded file
      try {
        if (req.file) {
          // For dynamic file types, use fileType from params if available
          const fileTypeToValidate = req.params.fileType || fieldName
          validateFile(req.file, fileTypeToValidate)
        }
        next()
      } catch (validationError: any) {
        return sendError(res, validationError.message, 400)
      }
    })
  }
}

// Predefined middleware configurations
export const uploadMiddleware = {
  // For athlete files
  atletFiles: () => uploadMultipleFiles([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]),

  // For coach files  
  pelatihFiles: () => uploadMultipleFiles([
    { name: 'foto_ktp', maxCount: 1 },
    { name: 'sertifikat_sabuk', maxCount: 1 }
  ]),

  // For single file with dynamic field name
  singleFile: () => uploadSingleFile('file'),

  // For specific field names
  specificField: (fieldName: string) => uploadSingleFile(fieldName)
}

// File cleanup middleware
export const cleanupFiles = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send

  res.send = function(data) {
    // Cleanup files on error responses
    if (res.statusCode >= 400) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      
      if (files) {
        Object.values(files).forEach(fileArray => {
          if (fileArray) {
            fileArray.forEach(file => {
              fs.unlink(file.path, (err) => {
                if (err) console.warn(`Failed to cleanup: ${file.path}`)
              })
            })
          }
        })
      }

      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.warn(`Failed to cleanup: ${req.file!.path}`)
        })
      }
    }

    return originalSend.call(this, data)
  }

  next()
}

// Validation helpers
export const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { fileType } = req.params

    if (fileType && !allowedTypes.includes(fileType)) {
      return sendError(res, `Invalid file type: ${fileType}. Allowed: ${allowedTypes.join(', ')}`, 400)
    }

    next()
  }
}

// Export legacy functions for backward compatibility
export const handleUploadError = uploadMiddleware.atletFiles()
export const uploadSingle = uploadSingleFile