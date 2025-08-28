// src/routes/pelatih.ts
import { Router } from 'express'
import pelatihController from '../controllers/pelatihController'
import { authenticate, requirePelatih, requireAdmin } from '../middleware/auth'
import { handleUploadError } from '../middleware/upload'
import { validateUpdatePelatih } from '../validations/pelatihValidation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Self-service routes (for pelatih users)
router.get('/profile', requirePelatih, pelatihController.getMyProfile)
router.put('/profile', 
  requirePelatih, 
  validateUpdatePelatih, // Gunakan middleware express-validator
  pelatihController.updateMyProfile
)

// File management routes (for pelatih users)
router.post('/upload', 
  requirePelatih, 
  handleUploadError, 
  pelatihController.uploadFiles
)
router.get('/files', requirePelatih, pelatihController.getMyFiles)
router.delete('/files/:fileType', requirePelatih, pelatihController.deleteFile)

// Admin routes - untuk Developer B nanti integrate
router.get('/', 
  requireAdmin, 
  // Sementara hapus validasi sampai dibuat
  pelatihController.getAllPelatih
)
router.get('/:id', 
  requireAdmin, 
  // Sementara hapus validasi sampai dibuat  
  pelatihController.getPelatihById
)

export default router