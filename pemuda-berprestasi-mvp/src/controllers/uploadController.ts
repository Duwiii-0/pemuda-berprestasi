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

class UploadController {
  // Upload files for athlete
  async uploadAtletFiles(req: AuthRequest, res: Response) {
    try {
      const { id_atlet } = req.params
      const files = req.files as UploadedFiles

      if (!files || Object.keys(files).length === 0) {
        return sendError(res, 'No files uploaded', 400)
      }

      if (!id_atlet) {
        return sendError(res, 'Athlete ID is required', 400)
      }

      console.log(`📤 Uploading files for athlete ID: ${id_atlet}`)
      console.log(`📁 Files received:`, Object.keys(files))

      // Verify athlete exists and user has permission
      const atlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet: parseInt(id_atlet) },
        include: { pelatih_pembuat: { include: { akun: true } } }
      })

      if (!atlet) {
        return sendError(res, 'Athlete not found', 404)
      }

      // Check permission (coach can upload for their athletes, admin can upload for any)
      if (req.role !== 'ADMIN' && atlet.pelatih_pembuat.akun.id_akun !== req.userId) {
        return sendError(res, 'Unauthorized to upload files for this athlete', 403)
      }

      const uploadResults: any = {}
      const dbUpdates: any = {}

      // Process each uploaded file
      for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]
          
          try {
            console.log(`📤 Processing ${fileType}: ${file.originalname}`)
            
            const result = await googleDriveService.uploadFile(
              file.path,
              file.originalname,
              fileType,
              'atlet',
              parseInt(id_atlet)
            )

            uploadResults[fileType] = {
              success: true,
              fileId: result.fileId,
              webViewLink: result.webViewLink,
              webContentLink: result.webContentLink,
              fileName: file.originalname,
              fileSize: file.size
            }

            // Prepare database updates based on file type
            switch (fileType) {
              case 'ktp':
                dbUpdates.ktp = file.originalname
                dbUpdates.ktp_gdrive_id = result.fileId
                dbUpdates.ktp_gdrive_url = result.webViewLink
                break
              case 'akte_kelahiran':
                dbUpdates.akte_kelahiran = file.originalname
                dbUpdates.akte_gdrive_id = result.fileId
                dbUpdates.akte_gdrive_url = result.webViewLink
                break
              case 'pas_foto':
                dbUpdates.pas_foto = file.originalname
                dbUpdates.pas_foto_gdrive_id = result.fileId
                dbUpdates.pas_foto_gdrive_url = result.webViewLink
                break
              case 'sertifikat_belt':
                dbUpdates.sertifikat_belt = file.originalname
                dbUpdates.sertifikat_belt_gdrive_id = result.fileId
                dbUpdates.sertifikat_belt_gdrive_url = result.webViewLink
                break
            }

          } catch (error: any) {
            console.error(`❌ Failed to upload ${fileType}:`, error.message)
            uploadResults[fileType] = {
              success: false,
              error: error.message
            }
          }
        }
      }

      // Update database with successful uploads
      if (Object.keys(dbUpdates).length > 0) {
        try {
          await prisma.tb_atlet.update({
            where: { id_atlet: parseInt(id_atlet) },
            data: dbUpdates
          })
          console.log(`✅ Database updated for athlete ${id_atlet}`)
        } catch (error: any) {
          console.error(`❌ Failed to update database:`, error.message)
          return sendError(res, 'Files uploaded but database update failed', 500)
        }
      }

      // Check if any uploads were successful
      const successfulUploads = Object.values(uploadResults).filter((result: any) => result.success)
      const failedUploads = Object.values(uploadResults).filter((result: any) => !result.success)

      if (successfulUploads.length === 0) {
        return sendError(res, 'All file uploads failed', 500)
      }

      const responseMessage = failedUploads.length > 0 
        ? `${successfulUploads.length} files uploaded successfully, ${failedUploads.length} failed`
        : `All ${successfulUploads.length} files uploaded successfully`

      return sendSuccess(res, {
        message: responseMessage,
        results: uploadResults,
        athlete_id: parseInt(id_atlet)
      })

    } catch (error: any) {
      console.error('❌ Upload athlete files error:', error.message)
      return sendError(res, error.message || 'Failed to upload files', 500)
    }
  }

  // Upload files for coach/pelatih
  async uploadPelatihFiles(req: AuthRequest, res: Response) {
    try {
      const { id_pelatih } = req.params
      const files = req.files as UploadedFiles

      if (!files || Object.keys(files).length === 0) {
        return sendError(res, 'No files uploaded', 400)
      }

      if (!id_pelatih) {
        return sendError(res, 'Coach ID is required', 400)
      }

      console.log(`📤 Uploading files for coach ID: ${id_pelatih}`)
      console.log(`📁 Files received:`, Object.keys(files))

      // Verify coach exists and user has permission
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: parseInt(id_pelatih) },
        include: { akun: true }
      })

      if (!pelatih) {
        return sendError(res, 'Coach not found', 404)
      }

      // Check permission (coach can upload their own files, admin can upload for any)
      if (req.role !== 'ADMIN' && pelatih.akun.id_akun !== req.userId) {
        return sendError(res, 'Unauthorized to upload files for this coach', 403)
      }

      const uploadResults: any = {}
      const dbUpdates: any = {}

      // Process each uploaded file
      for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]
          
          try {
            console.log(`📤 Processing ${fileType}: ${file.originalname}`)
            
            const result = await googleDriveService.uploadFile(
              file.path,
              file.originalname,
              fileType,
              'pelatih',
              parseInt(id_pelatih)
            )

            uploadResults[fileType] = {
              success: true,
              fileId: result.fileId,
              webViewLink: result.webViewLink,
              webContentLink: result.webContentLink,
              fileName: file.originalname,
              fileSize: file.size
            }

            // Prepare database updates based on file type
            switch (fileType) {
              case 'foto_ktp':
                dbUpdates.foto_ktp = file.originalname
                dbUpdates.ktp_gdrive_id = result.fileId
                dbUpdates.ktp_gdrive_url = result.webViewLink
                break
              case 'sertifikat_sabuk':
                dbUpdates.sertifikat_sabuk = file.originalname
                dbUpdates.sertifikat_gdrive_id = result.fileId
                dbUpdates.sertifikat_gdrive_url = result.webViewLink
                break
            }

          } catch (error: any) {
            console.error(`❌ Failed to upload ${fileType}:`, error.message)
            uploadResults[fileType] = {
              success: false,
              error: error.message
            }
          }
        }
      }

      // Update database with successful uploads
      if (Object.keys(dbUpdates).length > 0) {
        try {
          await prisma.tb_pelatih.update({
            where: { id_pelatih: parseInt(id_pelatih) },
            data: dbUpdates
          })
          console.log(`✅ Database updated for coach ${id_pelatih}`)
        } catch (error: any) {
          console.error(`❌ Failed to update database:`, error.message)
          return sendError(res, 'Files uploaded but database update failed', 500)
        }
      }

      // Check if any uploads were successful
      const successfulUploads = Object.values(uploadResults).filter((result: any) => result.success)
      const failedUploads = Object.values(uploadResults).filter((result: any) => !result.success)

      if (successfulUploads.length === 0) {
        return sendError(res, 'All file uploads failed', 500)
      }

      const responseMessage = failedUploads.length > 0 
        ? `${successfulUploads.length} files uploaded successfully, ${failedUploads.length} failed`
        : `All ${successfulUploads.length} files uploaded successfully`

      return sendSuccess(res, {
        message: responseMessage,
        results: uploadResults,
        coach_id: parseInt(id_pelatih)
      })

    } catch (error: any) {
      console.error('❌ Upload coach files error:', error.message)
      return sendError(res, error.message || 'Failed to upload files', 500)
    }
  }

  // Upload single file (generic endpoint)
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

      console.log(`📤 Uploading single ${fileType} file for ${userType} ID: ${userId}`)

      // Verify user exists and permission
      let targetUser: any
      if (userType === 'atlet') {
        targetUser = await prisma.tb_atlet.findUnique({
          where: { id_atlet: parseInt(userId) },
          include: { pelatih_pembuat: { include: { akun: true } } }
        })
        
        if (targetUser && req.role !== 'ADMIN' && targetUser.pelatih_pembuat.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }
      } else {
        targetUser = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: parseInt(userId) },
          include: { akun: true }
        })
        
        if (targetUser && req.role !== 'ADMIN' && targetUser.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }
      }

      if (!targetUser) {
        return sendError(res, `${userType} not found`, 404)
      }

      // Upload to Google Drive
      const result = await googleDriveService.uploadFile(
        file.path,
        file.originalname,
        fileType,
        userType as 'atlet' | 'pelatih',
        parseInt(userId)
      )

      // Update database
      const dbUpdates: any = {}
      
      if (userType === 'atlet') {
        switch (fileType) {
          case 'ktp':
            dbUpdates.ktp = file.originalname
            dbUpdates.ktp_gdrive_id = result.fileId
            dbUpdates.ktp_gdrive_url = result.webViewLink
            break
          case 'akte_kelahiran':
            dbUpdates.akte_kelahiran = file.originalname
            dbUpdates.akte_gdrive_id = result.fileId
            dbUpdates.akte_gdrive_url = result.webViewLink
            break
          case 'pas_foto':
            dbUpdates.pas_foto = file.originalname
            dbUpdates.pas_foto_gdrive_id = result.fileId
            dbUpdates.pas_foto_gdrive_url = result.webViewLink
            break
          case 'sertifikat_belt':
            dbUpdates.sertifikat_belt = file.originalname
            dbUpdates.sertifikat_belt_gdrive_id = result.fileId
            dbUpdates.sertifikat_belt_gdrive_url = result.webViewLink
            break
        }
        
        await prisma.tb_atlet.update({
          where: { id_atlet: parseInt(userId) },
          data: dbUpdates
        })
      } else {
        switch (fileType) {
          case 'foto_ktp':
            dbUpdates.foto_ktp = file.originalname
            dbUpdates.ktp_gdrive_id = result.fileId
            dbUpdates.ktp_gdrive_url = result.webViewLink
            break
          case 'sertifikat_sabuk':
            dbUpdates.sertifikat_sabuk = file.originalname
            dbUpdates.sertifikat_gdrive_id = result.fileId
            dbUpdates.sertifikat_gdrive_url = result.webViewLink
            break
        }
        
        await prisma.tb_pelatih.update({
          where: { id_pelatih: parseInt(userId) },
          data: dbUpdates
        })
      }

      return sendSuccess(res, {
        message: 'File uploaded successfully',
        fileId: result.fileId,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        fileName: file.originalname,
        fileSize: file.size,
        fileType,
        userType,
        userId: parseInt(userId)
      })

    } catch (error: any) {
      console.error('❌ Upload single file error:', error.message)
      return sendError(res, error.message || 'Failed to upload file', 500)
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
        return sendError(res, 'Invalid user type. Must be atlet or pelatih', 400)
      }

      console.log(`🔄 Replacing ${fileType} file for ${userType} ID: ${userId}`)

      // Get existing file ID from database
      let existingFileId: string | null = null
      
      if (userType === 'atlet') {
        const atlet = await prisma.tb_atlet.findUnique({
          where: { id_atlet: parseInt(userId) },
          include: { pelatih_pembuat: { include: { akun: true } } }
        })
        
        if (!atlet) {
          return sendError(res, 'Athlete not found', 404)
        }
        
        if (req.role !== 'ADMIN' && atlet.pelatih_pembuat.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'ktp': existingFileId = atlet.ktp_gdrive_id; break
          case 'akte_kelahiran': existingFileId = atlet.akte_gdrive_id; break
          case 'pas_foto': existingFileId = atlet.pas_foto_gdrive_id; break
          case 'sertifikat_belt': existingFileId = atlet.sertifikat_belt_gdrive_id; break
        }
      } else {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: parseInt(userId) },
          include: { akun: true }
        })
        
        if (!pelatih) {
          return sendError(res, 'Coach not found', 404)
        }
        
        if (req.role !== 'ADMIN' && pelatih.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'foto_ktp': existingFileId = pelatih.ktp_gdrive_id; break
          case 'sertifikat_sabuk': existingFileId = pelatih.sertifikat_gdrive_id; break
        }
      }

      if (!existingFileId) {
        // No existing file, just upload new one
        return this.uploadSingleFile(req, res)
      }

      // Replace existing file
      const result = await googleDriveService.replaceFile(
        existingFileId,
        file.path,
        file.originalname,
        fileType,
        userType as 'atlet' | 'pelatih',
        parseInt(userId)
      )

      // Update database
      const dbUpdates: any = {}
      
      if (userType === 'atlet') {
        switch (fileType) {
          case 'ktp':
            dbUpdates.ktp = file.originalname
            dbUpdates.ktp_gdrive_id = result.fileId
            dbUpdates.ktp_gdrive_url = result.webViewLink
            break
          case 'akte_kelahiran':
            dbUpdates.akte_kelahiran = file.originalname
            dbUpdates.akte_gdrive_id = result.fileId
            dbUpdates.akte_gdrive_url = result.webViewLink
            break
          case 'pas_foto':
            dbUpdates.pas_foto = file.originalname
            dbUpdates.pas_foto_gdrive_id = result.fileId
            dbUpdates.pas_foto_gdrive_url = result.webViewLink
            break
          case 'sertifikat_belt':
            dbUpdates.sertifikat_belt = file.originalname
            dbUpdates.sertifikat_belt_gdrive_id = result.fileId
            dbUpdates.sertifikat_belt_gdrive_url = result.webViewLink
            break
        }
        
        await prisma.tb_atlet.update({
          where: { id_atlet: parseInt(userId) },
          data: dbUpdates
        })
      } else {
        switch (fileType) {
          case 'foto_ktp':
            dbUpdates.foto_ktp = file.originalname
            dbUpdates.ktp_gdrive_id = result.fileId
            dbUpdates.ktp_gdrive_url = result.webViewLink
            break
          case 'sertifikat_sabuk':
            dbUpdates.sertifikat_sabuk = file.originalname
            dbUpdates.sertifikat_gdrive_id = result.fileId
            dbUpdates.sertifikat_gdrive_url = result.webViewLink
            break
        }
        
        await prisma.tb_pelatih.update({
          where: { id_pelatih: parseInt(userId) },
          data: dbUpdates
        })
      }

      return sendSuccess(res, {
        message: 'File replaced successfully',
        fileId: result.fileId,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        fileName: file.originalname,
        fileSize: file.size,
        fileType,
        userType,
        userId: parseInt(userId),
        action: 'replace'
      })

    } catch (error: any) {
      console.error('❌ Replace file error:', error.message)
      return sendError(res, error.message || 'Failed to replace file', 500)
    }
  }

  // Delete file
  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type. Must be atlet or pelatih', 400)
      }

      console.log(`🗑️ Deleting ${fileType} file for ${userType} ID: ${userId}`)

      // Get existing file ID from database
      let existingFileId: string | null = null
      
      if (userType === 'atlet') {
        const atlet = await prisma.tb_atlet.findUnique({
          where: { id_atlet: parseInt(userId) },
          include: { pelatih_pembuat: { include: { akun: true } } }
        })
        
        if (!atlet) {
          return sendError(res, 'Athlete not found', 404)
        }
        
        if (req.role !== 'ADMIN' && atlet.pelatih_pembuat.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'ktp': existingFileId = atlet.ktp_gdrive_id; break
          case 'akte_kelahiran': existingFileId = atlet.akte_gdrive_id; break
          case 'pas_foto': existingFileId = atlet.pas_foto_gdrive_id; break
          case 'sertifikat_belt': existingFileId = atlet.sertifikat_belt_gdrive_id; break
        }
      } else {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: parseInt(userId) },
          include: { akun: true }
        })
        
        if (!pelatih) {
          return sendError(res, 'Coach not found', 404)
        }
        
        if (req.role !== 'ADMIN' && pelatih.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'foto_ktp': existingFileId = pelatih.ktp_gdrive_id; break
          case 'sertifikat_sabuk': existingFileId = pelatih.sertifikat_gdrive_id; break
        }
      }

      if (!existingFileId) {
        return sendError(res, 'File not found', 404)
      }

      // Delete from Google Drive
      await googleDriveService.deleteFile(existingFileId)

      // Update database to remove file references
      const dbUpdates: any = {}
      
      if (userType === 'atlet') {
        switch (fileType) {
          case 'ktp':
            dbUpdates.ktp = null
            dbUpdates.ktp_gdrive_id = null
            dbUpdates.ktp_gdrive_url = null
            break
          case 'akte_kelahiran':
            dbUpdates.akte_kelahiran = null
            dbUpdates.akte_gdrive_id = null
            dbUpdates.akte_gdrive_url = null
            break
          case 'pas_foto':
            dbUpdates.pas_foto = null
            dbUpdates.pas_foto_gdrive_id = null
            dbUpdates.pas_foto_gdrive_url = null
            break
          case 'sertifikat_belt':
            dbUpdates.sertifikat_belt = null
            dbUpdates.sertifikat_belt_gdrive_id = null
            dbUpdates.sertifikat_belt_gdrive_url = null
            break
        }
        
        await prisma.tb_atlet.update({
          where: { id_atlet: parseInt(userId) },
          data: dbUpdates
        })
      } else {
        switch (fileType) {
          case 'foto_ktp':
            dbUpdates.foto_ktp = null
            dbUpdates.ktp_gdrive_id = null
            dbUpdates.ktp_gdrive_url = null
            break
          case 'sertifikat_sabuk':
            dbUpdates.sertifikat_sabuk = null
            dbUpdates.sertifikat_gdrive_id = null
            dbUpdates.sertifikat_gdrive_url = null
            break
        }
        
        await prisma.tb_pelatih.update({
          where: { id_pelatih: parseInt(userId) },
          data: dbUpdates
        })
      }

      return sendSuccess(res, {
        message: 'File deleted successfully',
        fileType,
        userType,
        userId: parseInt(userId),
        action: 'delete'
      })

    } catch (error: any) {
      console.error('❌ Delete file error:', error.message)
      return sendError(res, error.message || 'Failed to delete file', 500)
    }
  }

  // Get file info/download link
  async getFileInfo(req: AuthRequest, res: Response) {
    try {
      const { userType, userId, fileType } = req.params

      if (!['atlet', 'pelatih'].includes(userType)) {
        return sendError(res, 'Invalid user type. Must be atlet or pelatih', 400)
      }

      // Get file ID from database
      let fileId: string | null = null
      let fileName: string | null = null
      
      if (userType === 'atlet') {
        const atlet = await prisma.tb_atlet.findUnique({
          where: { id_atlet: parseInt(userId) },
          include: { pelatih_pembuat: { include: { akun: true } } }
        })
        
        if (!atlet) {
          return sendError(res, 'Athlete not found', 404)
        }
        
        if (req.role !== 'ADMIN' && atlet.pelatih_pembuat.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'ktp': 
            fileId = atlet.ktp_gdrive_id
            fileName = atlet.ktp
            break
          case 'akte_kelahiran': 
            fileId = atlet.akte_gdrive_id
            fileName = atlet.akte_kelahiran
            break
          case 'pas_foto': 
            fileId = atlet.pas_foto_gdrive_id
            fileName = atlet.pas_foto
            break
          case 'sertifikat_belt': 
            fileId = atlet.sertifikat_belt_gdrive_id
            fileName = atlet.sertifikat_belt
            break
        }
      } else {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: parseInt(userId) },
          include: { akun: true }
        })
        
        if (!pelatih) {
          return sendError(res, 'Coach not found', 404)
        }
        
        if (req.role !== 'ADMIN' && pelatih.akun.id_akun !== req.userId) {
          return sendError(res, 'Unauthorized', 403)
        }

        switch (fileType) {
          case 'foto_ktp': 
            fileId = pelatih.ktp_gdrive_id
            fileName = pelatih.foto_ktp
            break
          case 'sertifikat_sabuk': 
            fileId = pelatih.sertifikat_gdrive_id
            fileName = pelatih.sertifikat_sabuk
            break
        }
      }

      if (!fileId) {
        return sendError(res, 'File not found', 404)
      }

      // Get file info from Google Drive
      const fileInfo = await googleDriveService.getFileInfo(fileId)

      return sendSuccess(res, {
        fileId,
        fileName,
        fileType,
        userType,
        userId: parseInt(userId),
        googleDriveInfo: fileInfo
      })

    } catch (error: any) {
      console.error('❌ Get file info error:', error.message)
      return sendError(res, error.message || 'Failed to get file info', 500)
    }
  }

  // Health check for Google Drive service
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
}

export const uploadController = new UploadController()
export default uploadController