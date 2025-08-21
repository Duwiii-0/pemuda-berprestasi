import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

/**
 * File handling utilities
 */

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

/**
 * Allowed file types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

/**
 * File size limits (in bytes)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload directories
 */
export const UPLOAD_DIRS = {
  PHOTOS: 'uploads/photos',
  CERTIFICATES: 'uploads/certificates', 
  DOCUMENTS: 'uploads/documents'
};

/**
 * Generate unique filename
 */
export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `${timestamp}_${random}${extension}`;
};

/**
 * Get file extension from mimetype
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };
  return mimeToExt[mimeType] || '';
};

/**
 * Validate file type
 */
export const isValidImageType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
};

export const isValidDocumentType = (mimeType: string): boolean => {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
};

/**
 * Validate file size
 */
export const isValidImageSize = (size: number): boolean => {
  return size <= MAX_IMAGE_SIZE;
};

export const isValidDocumentSize = (size: number): boolean => {
  return size <= MAX_DOCUMENT_SIZE;
};

/**
 * Format file size to human readable
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Ensure directory exists
 */
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    if (!(await existsAsync(dirPath))) {
      await mkdirAsync(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating directory:', error);
    throw new Error('Failed to create upload directory');
  }
};

/**
 * Save file to disk
 */
export const saveFileToDisk = async (
  buffer: Buffer,
  fileName: string,
  directory: string
): Promise<string> => {
  try {
    await ensureDirectoryExists(directory);
    const filePath = path.join(directory, fileName);
    await writeFileAsync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
};

/**
 * Delete file from disk
 */
export const deleteFileFromDisk = async (filePath: string): Promise<void> => {
  try {
    if (await existsAsync(filePath)) {
      await unlinkAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for delete operations
  }
};

/**
 * Get file URL for serving
 */
export const getFileUrl = (filePath: string, baseUrl: string): string => {
  const relativePath = filePath.replace(/^uploads\//, '');
  return `${baseUrl}/uploads/${relativePath}`;
};

/**
 * Validate and process upload file
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileName?: string;
  filePath?: string;
}

export const validateAndProcessFile = async (
  file: Express.Multer.File,
  fileType: 'image' | 'document',
  uploadDir: string
): Promise<FileValidationResult> => {
  try {
    // Validate file type
    const isValidType = fileType === 'image' 
      ? isValidImageType(file.mimetype)
      : isValidDocumentType(file.mimetype);
    
    if (!isValidType) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${
          fileType === 'image' 
            ? ALLOWED_IMAGE_TYPES.join(', ')
            : ALLOWED_DOCUMENT_TYPES.join(', ')
        }`
      };
    }

    // Validate file size
    const isValidSize = fileType === 'image'
      ? isValidImageSize(file.size)
      : isValidDocumentSize(file.size);
    
    if (!isValidSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${
          formatFileSize(fileType === 'image' ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE)
        }`
      };
    }

    // Generate filename and save
    const fileName = generateFileName(file.originalname);
    const filePath = await saveFileToDisk(file.buffer, fileName, uploadDir);
    
    return {
      isValid: true,
      fileName,
      filePath
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to process file'
    };
  }
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (filePaths: string[]): Promise<void> => {
  await Promise.all(
    filePaths.map(filePath => deleteFileFromDisk(filePath))
  );
};