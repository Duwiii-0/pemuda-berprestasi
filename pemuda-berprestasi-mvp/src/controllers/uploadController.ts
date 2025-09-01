// src/controllers/uploadController.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { googleDriveService } from '../services/googleDriveService'
import prisma from '../config/database'

interface AuthRequest extends Request {
  userId?: number
  role?: string
}

interface UploadedFiles {
  [fieldname: string]: Express.Multer.File[]
}

interface DatabaseUpdateResult {
  success: boolean
  data?: any
  error?: string
}

interface FileUploadResult {
  fileType: string
  success: boolean
  fileId?: string
  webViewLink?: string
  webContentLink?: string
  fileName?: string
  fileSize?: number
  error?: string
}

interface FieldMapping {
  fileName: string
  fileId: string
  fileUrl: string
}

// Type for database records with any fields (to handle dynamic field access)
type DatabaseRecord = Record<string, any>

class UploadController {
  
  // Database field mapping utility
  private getDbFieldMapping(fileType: string, userType: 'atlet' | 'pelatih'): FieldMapping | null {
    const mapping = {
      atlet: {
        ktp: {
          fileName: 'ktp',
          fileId: 'ktp_gdrive_id',
          fileUrl: 'ktp_gdrive_url'
        },
        akte_kelahiran: {
          fileName: 'akte_kelahiran',
          fileId: 'akte_gdrive_id',
          fileUrl: 'akte_gdrive_url'
        },
        pas_foto: {
          fileName: 'pas_foto',
          fileId: 'pas_foto_gdrive_id',
          fileUrl: 'pas_foto_gdrive_url'
        },
        sertifikat_belt: {
          fileName: 'sertifikat_belt',
          fileId: 'sertifikat_belt_gdrive_id',
          fileUrl: 'sertifikat_belt_gdrive_url'
        }
      },
      pelatih: {
        foto_ktp: {
          fileName: 'foto_ktp',
          fileId: 'ktp_gdrive_id',
          fileUrl: 'ktp_gdrive_url'
        },
        sertifikat_sabuk: {
          fileName: 'sertifikat_sabuk',
          fileId: 'sertifikat_gdrive_id',
          fileUrl: 'sertifikat_gdrive_url'
        }
      }
    }

    const userMapping = mapping[userType]
    if (!userMapping) return null
    
    const fieldMapping = userMapping[fileType as keyof typeof userMapping]
    return fieldMapping || null
  }

  // Get existing file ID from database
  private async getExistingFileId(userType: 'atlet' | 'pelatih', userId: number, fileType: string): Promise<string | null> {
    try {
      if (userType === 'atlet') {
        const atlet = await prisma.tb_atlet.findUnique({
          where: { id_atlet: userId }
        })
        
        if (!atlet) return null

        const mapping = this.getDbFieldMapping(fileType, 'atlet')
        if (!mapping) return null

        const atletRecord = atlet as DatabaseRecord
        return atletRecord[mapping.fileId] || null
      } else {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: userId }
        })
        
        if (!pelatih) return null

        const mapping = this.getDbFieldMapping(fileType, 'pelatih')
        if (!mapping) return null

        const pelatihRecord = pelatih as DatabaseRecord
        return pelatihRecord[mapping.fileId] || null
      }
    } catch (error) {
      console.error('Error getting existing file ID:', error)
      return null
    }
  }

  // Verify user exists and check permissions
  private async verifyUserAndPermissions(
    userType: 'atlet' | 'pelatih', 
    userId: number, 
    requestUserId?: number, 
    role?: string
  ): Promise<DatabaseRecord> {
    if (userType === 'atlet') {
      const atlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet: userId },
        include: { pelatih_pembuat: { include: { akun: true } } }
      })

      if (!atlet) {
        throw new Error('Athlete not found')
      }

      // Check permission
      if (role !== 'ADMIN' && atlet.pelatih_pembuat.akun.id_akun !== requestUserId) {
        throw new Error('Unauthorized to access this athlete\'s files')
      }

      return atlet as DatabaseRecord
    } else {
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: userId },
        include: { akun: true }
      })

      if (!pelatih) {
        throw new Error('Coach not found')
      }

      // Check permission
      if (role !== 'ADMIN' && pelatih.akun.id_akun !== requestUserId) {
        throw new Error('Unauthorized to access this coach\'s files')
      }

      return pelatih as DatabaseRecord
    }
  }

  // Update database with file information
  private async updateDatabase(
    userType: 'atlet' | 'pelatih',
    userId: number,
    fileType: string,
    uploadResult: {
      fileName: string
      fileId: string
      webViewLink: string
    }
  ): Promise<DatabaseUpdateResult> {
    try {
      const mapping = this.getDbFieldMapping(fileType, userType)
      
      if (!mapping) {
        throw new Error(`No database mapping found for ${userType}/${fileType}`)
      }

      const dbUpdates: Record<string, any> = {
        [mapping.fileName]: uploadResult.fileName,
        [mapping.fileId]: uploadResult.fileId,
        [mapping.fileUrl]: uploadResult.webViewLink
      }

      if (userType === 'atlet') {
        await prisma.tb_atlet.update({
          where: { id_atlet: userId },
          data: dbUpdates
        })
      } else {
        await prisma.tb_pelatih.update({
          where: { id_pelatih: userId },
          data: dbUpdates
        })
      }

      return { success: true, data: dbUpdates }
    } catch (error: any) {
      return { 
        success: false, 
        error: `Database update failed: ${error.message}` 
      }
    }
  }

  // Clear database fields for deleted files
  private async clearDatabaseFields(
    userType: 'atlet' | 'pelatih',
    userId: number,
    fileType: string
  ): Promise<DatabaseUpdateResult> {
    try {
      const mapping = this.getDbFieldMapping(fileType, userType)
      
      if (!mapping) {
        throw new Error(`No database mapping found for ${userType}/${fileType}`)
      }

      const dbUpdates: Record<string, any> = {
        [mapping.fileName]: null,
        [mapping.fileId]: null,
        [mapping.fileUrl]: null
      }

      if (userType === 'atlet') {
        await prisma.tb_atlet.update({
          where: { id_atlet: userId },
          data: dbUpdates
        })
      } else {
        await prisma.tb_pelatih.update({
          where: { id_pelatih: userId },
          data: dbUpdates
        })
      }

      return { success: true, data: dbUpdates }
    } catch (error: any) {
      return { 
        success: false, 
        error: `Database cleanup failed: ${error.message}` 
      }
    }
  }

  // Process single file upload with transaction pattern
  private async processSingleFileUpload(
    file: Express.Multer.File,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number
  ): Promise<FileUploadResult> {
    let uploadResult: any = null
    
    try {
      console.log(`📤 Processing ${fileType} upload for ${userType} ${userId}`)
      
      // Step 1: Upload to Google Drive
      uploadResult = await googleDriveService.uploadFile(
        file.path,
        file.originalname,
        fileType,
        userType,
        userId
      )

      // Step 2: Update database
      const dbResult = await this.updateDatabase(userType, userId, fileType, {
        fileName: file.originalname,
        fileId: uploadResult.fileId,
        webViewLink: uploadResult.webViewLink
      })

      if (!dbResult.success) {
        // Rollback: delete uploaded file from Google Drive
        console.warn(`⚠️ Database update failed, rolling back Google Drive upload`)
        try {
          if (uploadResult?.fileId) {
            await googleDriveService.deleteFile(uploadResult.fileId)
          }
        } catch (rollbackError) {
          console.error(`❌ Rollback failed:`, rollbackError)
        }
        
        throw new Error(dbResult.error || 'Database update failed')
      }

      return {
        fileType,
        success: true,
        fileId: uploadResult.fileId,
        webViewLink: uploadResult.webViewLink,
        webContentLink: uploadResult.webContentLink,
        fileName: file.originalname,
        fileSize: file.size
      }

    } catch (error: any) {
      console.error(`❌ Failed to process ${fileType} upload:`, error.message)
      
      return {
        fileType,
        success: false,
        error: error.message
      }
    }
  }

  // CONTROLLER METHODS

  // Upload multiple files for athlete
  async uploadAtletFiles(req: AuthRequest, res: Response) {
    try {
      const { id_atlet } = req.params
      const files = req.files as UploadedFiles

      if (!files || Object.keys(files).length === 0) {
        return sendError(res, 'No files uploaded', 400)
      }

      const userId = parseInt(id_atlet)
      console.log(`📤 Uploading multiple files for athlete ${userId}`)

      // Verify user and permissions
      await this.verifyUserAndPermissions('atlet', userId, req.userId, req.role)

      const results: FileUploadResult[] = []

      // Process each file
      for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]
          const result = await this.processSingleFileUpload(file, fileType, 'atlet', userId)
          results.push(result)
        }
      }

      // Summary
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (successful.length === 0) {
        return sendError(res, 'All file uploads failed', 500)
      }

      const message = failed.length > 0 
        ? `${successful.length} files uploaded, ${failed.length} failed`
        : `All ${successful.length} files uploaded successfully`

      return sendSuccess(res, {
        message,
        results,
        athlete_id: userId,
        summary: {
          total: results.length,
          successful: successful.length,
          failed: failed.length
        }
      })

    } catch (error: any) {
      console.error('❌ Upload athlete files error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Upload multiple files for coach
  async uploadPelatihFiles(req: AuthRequest, res: Response) {
    try {
      const { id_pelatih } = req.params
      const files = req.files as UploadedFiles

      if (!files || Object.keys(files).length === 0) {
        return sendError(res, 'No files uploaded', 400)
      }

      const userId = parseInt(id_pelatih)
      console.log(`📤 Uploading multiple files for coach ${userId}`)

      // Verify user and permissions
      await this.verifyUserAndPermissions('pelatih', userId, req.userId, req.role)

      const results: FileUploadResult[] = []

      // Process each file
      for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]
          const result = await this.processSingleFileUpload(file, fileType, 'pelatih', userId)
          results.push(result)
        }
      }

      // Summary
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (successful.length === 0) {
        return sendError(res, 'All file uploads failed', 500)
      }

      const message = failed.length > 0 
        ? `${successful.length} files uploaded, ${failed.length} failed`
        : `All ${successful.length} files uploaded successfully`

      return sendSuccess(res, {
        message,
        results,
        coach_id: userId,
        summary: {
          total: results.length,
          successful: successful.length,
          failed: failed.length
        }
      })

    } catch (error: any) {
      console.error('❌ Upload coach files error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Upload single file (generic)
  async uploadSingleFile(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params
      const file = req.file

      if (!file) {
        return sendError(res, 'No file uploaded', 400)
      }

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type. Must be atlet or pelatih', 400)
      }

      const id = parseInt(userId)
      console.log(`📤 Uploading single ${fileType} for ${userType} ${id}`)

      // Verify user and permissions
      await this.verifyUserAndPermissions(userType as 'atlet' | 'pelatih', id, req.userId, req.role)

      // Process upload
      const result = await this.processSingleFileUpload(
        file, 
        fileType, 
        userType as 'atlet' | 'pelatih', 
        id
      )

      if (!result.success) {
        return sendError(res, result.error || 'Upload failed', 500)
      }

      return sendSuccess(res, {
        message: 'File uploaded successfully',
        ...result,
        userId: id,
        userType
      })

    } catch (error: any) {
      console.error('❌ Single file upload error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Replace existing file
  async replaceFile(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params
      const file = req.file

      if (!file) {
        return sendError(res, 'No file uploaded', 400)
      }

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type', 400)
      }

      const id = parseInt(userId)
      console.log(`🔄 Replacing ${fileType} for ${userType} ${id}`)

      // Verify user and permissions
      await this.verifyUserAndPermissions(userType as 'atlet' | 'pelatih', id, req.userId, req.role)

      // Get existing file ID
      const existingFileId = await this.getExistingFileId(userType as 'atlet' | 'pelatih', id, fileType)

      let result: FileUploadResult

      if (existingFileId) {
        // Replace existing file
        try {
          const uploadResult = await googleDriveService.replaceFile(
            existingFileId,
            file.path,
            file.originalname,
            fileType,
            userType as 'atlet' | 'pelatih',
            id
          )

          // Update database
          const dbResult = await this.updateDatabase(userType as 'atlet' | 'pelatih', id, fileType, {
            fileName: file.originalname,
            fileId: uploadResult.fileId,
            webViewLink: uploadResult.webViewLink
          })

          if (!dbResult.success) {
            throw new Error(dbResult.error)
          }

          result = {
            fileType,
            success: true,
            fileId: uploadResult.fileId,
            webViewLink: uploadResult.webViewLink,
            webContentLink: uploadResult.webContentLink,
            fileName: file.originalname,
            fileSize: file.size
          }

        } catch (error: any) {
          result = {
            fileType,
            success: false,
            error: error.message
          }
        }
      } else {
        // No existing file, upload new one
        result = await this.processSingleFileUpload(
          file, 
          fileType, 
          userType as 'atlet' | 'pelatih', 
          id
        )
      }

      if (!result.success) {
        return sendError(res, result.error || 'Replace failed', 500)
      }

      return sendSuccess(res, {
        message: existingFileId ? 'File replaced successfully' : 'File uploaded successfully',
        ...result,
        userId: id,
        userType,
        action: existingFileId ? 'replace' : 'upload'
      })

    } catch (error: any) {
      console.error('❌ Replace file error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Delete file
  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type', 400)
      }

      const id = parseInt(userId)
      console.log(`🗑️ Deleting ${fileType} for ${userType} ${id}`)

      // Verify user and permissions
      await this.verifyUserAndPermissions(userType as 'atlet' | 'pelatih', id, req.userId, req.role)

      // Get existing file ID
      const existingFileId = await this.getExistingFileId(userType as 'atlet' | 'pelatih', id, fileType)

      if (!existingFileId) {
        return sendError(res, 'File not found', 404)
      }

      // Delete from Google Drive first
      await googleDriveService.deleteFile(existingFileId)

      // Clear database fields
      const dbResult = await this.clearDatabaseFields(userType as 'atlet' | 'pelatih', id, fileType)

      if (!dbResult.success) {
        console.warn(`⚠️ File deleted from Google Drive but database cleanup failed: ${dbResult.error}`)
      }

      return sendSuccess(res, {
        message: 'File deleted successfully',
        fileType,
        userType,
        userId: id,
        action: 'delete'
      })

    } catch (error: any) {
      console.error('❌ Delete file error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Get file information
  async getFileInfo(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type', 400)
      }

      const id = parseInt(userId)

      // Verify user and permissions
      const user = await this.verifyUserAndPermissions(
        userType as 'atlet' | 'pelatih', 
        id, 
        req.userId, 
        req.role
      )

      // Get file ID from database
      const mapping = this.getDbFieldMapping(fileType, userType as 'atlet' | 'pelatih')
      if (!mapping) {
        return sendError(res, `Invalid file type: ${fileType}`, 400)
      }

      const userRecord = user as DatabaseRecord
      const fileId = userRecord[mapping.fileId]
      const fileName = userRecord[mapping.fileName]

      if (!fileId) {
        return sendError(res, 'File not found', 404)
      }

      // Get file info from Google Drive
      const googleDriveInfo = await googleDriveService.getFileInfo(fileId)

      return sendSuccess(res, {
        fileId,
        fileName,
        fileType,
        userType,
        userId: id,
        googleDriveInfo
      })

    } catch (error: any) {
      console.error('❌ Get file info error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Health check
  async healthCheck(req: Request, res: Response) {
    try {
      const isConnected = await googleDriveService.testConnection()
      
      if (isConnected) {
        return sendSuccess(res, {
          message: 'Google Drive service is healthy',
          status: 'connected',
          timestamp: new Date().toISOString()
        })
      } else {
        return sendError(res, 'Google Drive service is not available', 503)
      }
    } catch (error: any) {
      console.error('❌ Health check error:', error.message)
      return sendError(res, 'Google Drive service health check failed', 503)
    }
  }

  // Get folder contents (admin only)
  async getFolderContents(req: AuthRequest, res: Response) {
    try {
      const { folderName } = req.params

      const validFolders = ['MAIN', 'ATLET', 'PELATIH', 'KTP_ATLET', 'KTP_PELATIH', 
                           'AKTE', 'PASFOTO', 'SERTIFIKAT_BELT', 'SERTIFIKAT_SABUK']

      if (!validFolders.includes(folderName)) {
        return sendError(res, `Invalid folder name. Valid options: ${validFolders.join(', ')}`, 400)
      }

      const contents = await googleDriveService.getFolderContents(folderName as any)

      return sendSuccess(res, {
        folderName,
        fileCount: contents.length,
        files: contents
      })

    } catch (error: any) {
      console.error('❌ Get folder contents error:', error.message)
      return sendError(res, error.message, 500)
    }
  }

  // Validate Google Drive setup (admin only)
  async validateSetup(req: AuthRequest, res: Response) {
    try {
      console.log('🔍 Validating Google Drive setup...')

      // Environment validation
      const envValidation = await googleDriveService.validateEnvironment()
      
      // Folder access validation
      const folderValidation = await googleDriveService.validateFolderAccess()

      // Connection test
      const connectionTest = await googleDriveService.testConnection()

      const isFullyValid = envValidation.valid && 
                          Object.values(folderValidation).every(access => access) && 
                          connectionTest

      return sendSuccess(res, {
        message: isFullyValid ? 'Google Drive setup is valid' : 'Google Drive setup has issues',
        status: isFullyValid ? 'valid' : 'invalid',
        details: {
          environment: envValidation,
          folderAccess: folderValidation,
          connection: connectionTest
        },
        timestamp: new Date().toISOString()
      })

    } catch (error: any) {
      console.error('❌ Validate setup error:', error.message)
      return sendError(res, error.message, 500)
    }
  }
}

export const uploadController = new UploadController()
export default uploadController