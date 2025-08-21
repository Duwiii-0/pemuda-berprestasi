import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';
import { HttpStatus, ErrorCode } from '@/types';
import { 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  UPLOAD_DIRS,
  generateFileName,
  ensureDirectoryExists
} from '@/utils/filehandler';

/**
 * Storage configuration for different file types
 */
const createStorage = (uploadDir: string) => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
      } catch (error) {
        cb(error, '');
      }
    },
    filename: (req, file, cb) => {
      const fileName = generateFileName(file.originalname);
      cb(null, fileName);
    }
  });
};

/**
 * Memory storage for temporary processing
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter factory
 */
const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      ));
    }
  };
};

/**
 * Image upload configuration
 */
const imageUpload = multer({
  storage: createStorage(UPLOAD_DIRS.PHOTOS),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 5 // Maximum 5 images at once
  },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES)
});

/**
 * Document upload configuration
 */
const documentUpload = multer({
  storage: createStorage(UPLOAD_DIRS.DOCUMENTS),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 3 // Maximum 3 documents at once
  },
  fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES)
});

/**
 * Certificate upload configuration
 */
const certificateUpload = multer({
  storage: createStorage(UPLOAD_DIRS.CERTIFICATES),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1 // Only one certificate at a time
  },
  fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES)
});

/**
 * Memory upload for processing before saving
 */
const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE
  }
});

/**
 * Upload middleware factory
 */
export const upload = {
  /**
   * Single image upload
   */
  singleImage: (fieldName: string = 'image') => {
    return imageUpload.single(fieldName);
  },

  /**
   * Multiple images upload
   */
  multipleImages: (fieldName: string = 'images', maxCount: number = 5) => {
    return imageUpload.array(fieldName, maxCount);
  },

  /**
   * Single document upload
   */
  singleDocument: (fieldName: string = 'document') => {
    return documentUpload.single(fieldName);
  },

  /**
   * Multiple documents upload
   */
  multipleDocuments: (fieldName: string = 'documents', maxCount: number = 3) => {
    return documentUpload.array(fieldName, maxCount);
  },

  /**
   * Certificate upload
   */
  certificate: (fieldName: string = 'certificate') => {
    return certificateUpload.single(fieldName);
  },

  /**
   * Mixed file upload (images and documents)
   */
  mixed: (fields: Array<{ name: string; maxCount: number }>) => {
    return multer({
      storage: memoryStorage,
      limits: {
        fileSize: MAX_DOCUMENT_SIZE
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new AppError(
            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR
          ));
        }
      }
    }).fields(fields);
  },

  /**
   * Avatar upload (profile pictures)
   */
  avatar: (fieldName: string = 'avatar') => {
    return multer({
      storage: createStorage(UPLOAD_DIRS.PHOTOS),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB for avatars
        files: 1
      },
      fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES)
    }).single(fieldName);
  },

  /**
   * Memory upload for processing
   */
  memory: {
    single: (fieldName: string) => memoryUpload.single(fieldName),
    array: (fieldName: string, maxCount: number = 5) => memoryUpload.array(fieldName, maxCount),
    fields: (fields: Array<{ name: string; maxCount?: number }>) => memoryUpload.fields(fields)
  }
};

/**
 * Upload validation middleware
 */
export const validateUpload = (options: {
  required?: boolean;
  maxFiles?: number;
  fieldName?: string;
}) => {
  const { required = false, maxFiles = 1, fieldName = 'file' } = options;

  return (req: Request, res: any, next: any) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file;

    // Check if files are required
    if (required && !file && (!files || files.length === 0)) {
      return next(new AppError(
        'File upload is required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        true,
        { field: fieldName, message: 'File is required' }
      ));
    }

    // Check file count
    if (files && files.length > maxFiles) {
      return next(new AppError(
        `Too many files. Maximum ${maxFiles} files allowed`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        true,
        { field: fieldName, message: `Maximum ${maxFiles} files allowed` }
      ));
    }

    next();
  };
};

/**
 * File cleanup middleware (for error cases)
 */
export const cleanupFiles = (req: Request, res: any, next: any) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    // Clean up uploaded files if request failed
    if (res.statusCode >= 400) {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file;
      
      // TODO: Implement file cleanup logic
      // This would delete files from disk if the request failed
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Athlete registration file upload
 */
export const athleteRegistrationUpload = upload.mixed([
  { name: 'foto_atlit', maxCount: 1 },
  { name: 'sertifikat', maxCount: 3 }
]);

/**
 * Competition banner upload
 */
export const competitionBannerUpload = upload.singleImage('banner');

/**
 * Dojang registration upload
 */
export const dojangRegistrationUpload = upload.mixed([
  { name: 'logo_dojang', maxCount: 1 },
  { name: 'dokumen_legalitas', maxCount: 2 }
]);

/**
 * Match result upload (for certificates/documents)
 */
export const matchResultUpload = upload.multipleDocuments('dokumen_hasil', 2);

/**
 * Export types for TypeScript
 */
export type UploadMiddleware = ReturnType<typeof upload.singleImage>;
export type MulterFile = Express.Multer.File;

/**
 * File processing utilities
 */
export const fileUtils = {
  /**
   * Get file info from request
   */
  getFileInfo: (req: Request, fieldName?: string) => {
    if (fieldName) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      return files?.[fieldName]?.[0] || null;
    }
    return req.file || null;
  },

  /**
   * Get multiple files info
   */
  getFilesInfo: (req: Request, fieldName?: string) => {
    if (fieldName) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      return files?.[fieldName] || [];
    }
    return (req.files as Express.Multer.File[]) || [];
  },

  /**
   * Get file URL for response
   */
  getFileUrl: (file: Express.Multer.File, baseUrl: string) => {
    if (!file.path) return null;
    const relativePath = file.path.replace(/^uploads\//, '');
    return `${baseUrl}/uploads/${relativePath}`;
  }
};