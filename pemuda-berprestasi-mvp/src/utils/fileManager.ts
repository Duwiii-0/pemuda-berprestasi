import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

export interface FileInfo {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

export class FileManager {
  private static readonly UPLOAD_BASE_DIR = 'uploads';
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Validate uploaded file
   * @param file - Uploaded file info
   * @param fileType - Type of file (photo, document, certificate)
   * @returns Validation result
   */
  static validateFile(
    file: FileInfo,
    fileType: 'photo' | 'document' | 'certificate'
  ): { isValid: boolean; message?: string } {
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        message: `Ukuran file terlalu besar. Maksimal ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file type
    let allowedTypes: string[];
    switch (fileType) {
      case 'photo':
        allowedTypes = this.ALLOWED_IMAGE_TYPES;
        break;
      case 'document':
      case 'certificate':
        allowedTypes = this.ALLOWED_DOCUMENT_TYPES;
        break;
      default:
        return {
          isValid: false,
          message: 'Tipe file tidak dikenali'
        };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        message: `Tipe file tidak diizinkan. Hanya ${allowedTypes.join(', ')} yang diperbolehkan`
      };
    }

    return { isValid: true };
  }

  /**
   * Get file upload directory
   * @param fileType - Type of file
   * @returns Upload directory path
   */
  static getUploadDir(fileType: 'photos' | 'documents' | 'certificates'): string {
    const uploadDir = path.join(this.UPLOAD_BASE_DIR, fileType);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    return uploadDir;
  }

  /**
   * Generate unique filename
   * @param originalName - Original filename
   * @param prefix - Optional prefix
   * @returns Unique filename
   */
  static generateFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const prefixPart = prefix ? `${prefix}_` : '';
    
    return `${prefixPart}${cleanBaseName}_${timestamp}_${random}${extension}`;
  }

  /**
   * Save file to appropriate directory
   * @param file - File buffer or path
   * @param fileName - Target filename
   * @param fileType - Type of file
   * @returns Saved file path
   */
  static async saveFile(
    file: Buffer | string,
    fileName: string,
    fileType: 'photos' | 'documents' | 'certificates'
  ): Promise<string> {
    const uploadDir = this.getUploadDir(fileType);
    const filePath = path.join(uploadDir, fileName);

    if (Buffer.isBuffer(file)) {
      await fs.promises.writeFile(filePath, file);
    } else {
      await fs.promises.copyFile(file, filePath);
    }

    return filePath;
  }

  /**
   * Delete file from filesystem
   * @param filePath - Path to file
   * @returns Success status
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (await existsAsync(filePath)) {
        await unlinkAsync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param filePaths - Array of file paths
   * @returns Results for each file
   */
  static async deleteFiles(filePaths: string[]): Promise<boolean[]> {
    const results = await Promise.all(
      filePaths.map(filePath => this.deleteFile(filePath))
    );
    return results;
  }

  /**
   * Move file from temp to permanent location
   * @param tempPath - Temporary file path
   * @param targetPath - Target file path
   * @returns Success status
   */
  static async moveFile(tempPath: string, targetPath: string): Promise<boolean> {
    try {
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      await fs.promises.rename(tempPath, targetPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  /**
   * Get file info
   * @param filePath - Path to file
   * @returns File information
   */
  static async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    modified?: Date;
    extension?: string;
  }> {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(filePath)
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Clean up old files
   * @param directory - Directory to clean
   * @param maxAge - Maximum age in days
   * @returns Number of files deleted
   */
  static async cleanupOldFiles(directory: string, maxAge: number = 30): Promise<number> {
    try {
      if (!fs.existsSync(directory)) {
        return 0;
      }

      const files = await fs.promises.readdir(directory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);
      
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up files:', error);
      return 0;
    }
  }

  /**
   * Get file URL for client access
   * @param filePath - Server file path
   * @returns Client accessible URL
   */
  static getFileUrl(filePath: string): string {
    // Convert server path to URL path
    const relativePath = path.relative(this.UPLOAD_BASE_DIR, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Validate and process athlete files
   * @param files - Uploaded files object
   * @returns Processed file paths
   */
  static async processAthleteFiles(files: {
    akte_kelahiran?: Express.Multer.File[];
    pas_foto?: Express.Multer.File[];
    sertifikat_belt?: Express.Multer.File[];
    ktp?: Express.Multer.File[];
  }): Promise<{
    akte_kelahiran?: string;
    pas_foto?: string;
    sertifikat_belt?: string;
    ktp?: string;
    errors: string[];
  }> {
    const result: any = { errors: [] };

    // Process each file type
    for (const [fileType, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Take first file only
        
        // Validate file
        let validation;
        if (fileType === 'pas_foto') {
          validation = this.validateFile({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }, 'photo');
        } else {
          validation = this.validateFile({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }, 'document');
        }

        if (!validation.isValid) {
          result.errors.push(`${fileType}: ${validation.message}`);
          // Delete invalid file
          await this.deleteFile(file.path);
        } else {
          result[fileType] = file.path;
        }
      }
    }

    return result;
  }

  /**
   * Backup important files
   * @param sourceDir - Source directory
   * @param backupDir - Backup directory
   * @returns Success status
   */
  static async backupFiles(sourceDir: string, backupDir: string): Promise<boolean> {
    try {
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const files = await fs.promises.readdir(sourceDir);
      
      for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const backupPath = path.join(backupDir, file);
        
        const stats = await fs.promises.stat(sourcePath);
        if (stats.isFile()) {
          await fs.promises.copyFile(sourcePath, backupPath);
        }
      }

      return true;
    } catch (error) {
      console.error('Error backing up files:', error);
      return false;
    }
  }
}