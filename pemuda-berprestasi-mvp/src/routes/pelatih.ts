// src/routes/pelatih.ts
import { Router } from 'express'
import pelatihController from '../controllers/pelatihController'
import { validate, validateParams, validateQuery } from '../middleware/validation'
import { authenticate, requirePelatih, requireAdmin } from '../middleware/auth'
import { handleUploadError } from '../middleware/upload'
import { 
  updatePelatihSchema, 
  pelatihIdSchema,
  listPelatihSchema 
} from '../validations/pelatihValidation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Self-service routes (for pelatih users)
router.get('/profile', requirePelatih, pelatihController.getMyProfile)
router.put('/profile', 
  requirePelatih, 
  validate(updatePelatihSchema), 
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
  validateQuery(listPelatihSchema), 
  pelatihController.getAllPelatih
)
router.get('/:id', 
  requireAdmin, 
  validateParams(pelatihIdSchema), 
  pelatihController.getPelatihById
)

export default router