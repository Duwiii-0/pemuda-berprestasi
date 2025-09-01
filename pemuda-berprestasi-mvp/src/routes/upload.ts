// src/routes/upload.ts
import { Router, Request, Response, NextFunction } from 'express'
import { uploadController } from '../controllers/uploadController'
import { uploadMiddleware, uploadSingleFile, validateFileType, cleanupFiles } from '../middleware/upload'
import { authenticate } from '../middleware/auth'

const router = Router()

// Apply authentication and cleanup to all routes
router.use(authenticate)
router.use(cleanupFiles)

// ATHLETE FILE UPLOADS

// Multiple files upload for athlete
router.post('/atlet/:id_atlet/files', 
  uploadMiddleware.atletFiles(), 
  uploadController.uploadAtletFiles.bind(uploadController)
)

// Single file upload for athlete with dynamic file type
router.post('/atlet/:id_atlet/file/:fileType', 
  validateFileType(['ktp', 'akte_kelahiran', 'pas_foto', 'sertifikat_belt']),
  uploadSingleFile('file'),
  (req: Request, res: Response) => {
    // Normalize parameters for controller
    (req.params as any).userType = 'atlet'
    ;(req.params as any).userId = req.params.id_atlet
    uploadController.uploadSingleFile(req, res)
  }
)

// COACH/PELATIH FILE UPLOADS

// Multiple files upload for coach
router.post('/pelatih/:id_pelatih/files', 
  uploadMiddleware.pelatihFiles(), 
  uploadController.uploadPelatihFiles.bind(uploadController)
)

// Single file upload for coach with dynamic file type
router.post('/pelatih/:id_pelatih/file/:fileType', 
  validateFileType(['foto_ktp', 'sertifikat_sabuk']),
  uploadSingleFile('file'),
  (req: Request, res: Response) => {
    // Normalize parameters for controller
    (req.params as any).userType = 'pelatih'
    ;(req.params as any).userId = req.params.id_pelatih
    uploadController.uploadSingleFile(req, res)
  }
)

// GENERIC FILE OPERATIONS (works for both atlet and pelatih)

// Replace existing file
router.put('/:userType/:userId/file/:fileType', 
  validateFileType(['ktp', 'foto_ktp', 'akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'sertifikat_sabuk']),
  uploadSingleFile('file'),
  uploadController.replaceFile.bind(uploadController)
)

// Delete file
router.delete('/:userType/:userId/file/:fileType', 
  validateFileType(['ktp', 'foto_ktp', 'akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'sertifikat_sabuk']),
  uploadController.deleteFile.bind(uploadController)
)

// Get file info
router.get('/:userType/:userId/file/:fileType/info', 
  validateFileType(['ktp', 'foto_ktp', 'akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'sertifikat_sabuk']),
  uploadController.getFileInfo.bind(uploadController)
)

// ADMIN/DEBUG ROUTES

// Health check for Google Drive service
router.get('/health', 
  uploadController.healthCheck.bind(uploadController)
)

// Admin authorization middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userReq = req as any
  if (userReq.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  next()
}

// Get folder contents (admin only)
router.get('/admin/folder/:folderName/contents',
  requireAdmin,
  uploadController.getFolderContents.bind(uploadController)
)

// Validate Google Drive setup (admin only)
router.get('/admin/validate-setup',
  requireAdmin,
  uploadController.validateSetup.bind(uploadController)
)

export default router