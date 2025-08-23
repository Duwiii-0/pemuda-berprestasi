// src/controllers/pelatihController.ts
import { Request, Response } from 'express'
import pelatihService from '../services/pelatihService'
import { sendSuccess, sendError, sendNotFound } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'

class PelatihController {
  // Get current pelatih profile (self)
  getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      
      if (!user.pelatihId) {
        return sendError(res, 'Pelatih ID not found', 400)
      }

      const profile = await pelatihService.getPelatihProfile(user.pelatihId)
      sendSuccess(res, profile, 'Profile retrieved successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to get profile', 400)
    }
  })

  // Update current pelatih profile (self)
  updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      
      if (!user.pelatihId) {
        return sendError(res, 'Pelatih ID not found', 400)
      }

      const updatedProfile = await pelatihService.updatePelatihProfile(
        user.pelatihId, 
        req.body
      )
      
      sendSuccess(res, updatedProfile, 'Profile updated successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to update profile', 400)
    }
  })

  // Get all pelatih (for admin)
  getAllPelatih = asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await pelatihService.getAllPelatih(req.query as any)
      sendSuccess(res, result, 'Pelatih list retrieved successfully')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get pelatih list', 400)
    }
  })

  // Get pelatih by ID (for admin)
  getPelatihById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const id_pelatih = parseInt(req.params.id)
      const pelatih = await pelatihService.getPelatihById(id_pelatih)
      
      sendSuccess(res, pelatih, 'Pelatih details retrieved successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to get pelatih details', 400)
    }
  })

  // Upload files (for current pelatih)
  uploadFiles = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      
      if (!user.pelatihId) {
        return sendError(res, 'Pelatih ID not found', 400)
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return sendError(res, 'No files uploaded', 400)
      }

      const files = await pelatihService.handleFileUpload(user.pelatihId, req.files)
      
      sendSuccess(res, files, 'Files uploaded successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to upload files', 400)
    }
  })

  // Get uploaded files info (for current pelatih)
  getMyFiles = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      
      if (!user.pelatihId) {
        return sendError(res, 'Pelatih ID not found', 400)
      }

      const files = await pelatihService.getUploadedFiles(user.pelatihId)
      sendSuccess(res, files, 'Files info retrieved successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to get files info', 400)
    }
  })

  // Delete specific file (for current pelatih)
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      const { fileType } = req.params
      
      if (!user.pelatihId) {
        return sendError(res, 'Pelatih ID not found', 400)
      }

      if (!['foto_ktp', 'sertifikat_sabuk'].includes(fileType)) {
        return sendError(res, 'Invalid file type', 400)
      }

      const result = await pelatihService.deleteFile(
        user.pelatihId, 
        fileType as 'foto_ktp' | 'sertifikat_sabuk'
      )
      
      sendSuccess(res, result, 'File deleted successfully')
    } catch (error: any) {
      if (error.message === 'Pelatih not found') {
        return sendNotFound(res, error.message)
      }
      if (error.message === 'File not found') {
        return sendNotFound(res, error.message)
      }
      return sendError(res, error.message || 'Failed to delete file', 400)
    }
  })
}

export default new PelatihController()