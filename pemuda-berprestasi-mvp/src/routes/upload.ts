// src/routes/upload.ts
import { Router } from 'express'
import { uploadController } from '../controllers/uploadController'
import { uploadMiddleware, uploadSingle } from '../middleware/upload'
import { authenticate } from '../middleware/auth'

const router = Router()

// Apply authentication to all upload routes
router.use(authenticate)

// Athlete file uploads
router.post('/atlet/:id_atlet/files', 
  uploadMiddleware.atletFiles(), 
  uploadController.uploadAtletFiles.bind(uploadController)
)

router.post('/atlet/:id_atlet/file/:fileType', 
  uploadSingle('file'), 
  (req, res) => {
    // Set userType for the generic handler
    req.params.userType = 'atlet'
    req.params.userId = req.params.id_atlet
    uploadController.uploadSingleFile(req, res)
  }
)

// Coach file uploads
router.post('/pelatih/:id_pelatih/files', 
  uploadMiddleware.pelatihFiles(), 
  uploadController.uploadPelatihFiles.bind(uploadController)
)

router.post('/pelatih/:id_pelatih/file/:fileType', 
  uploadSingle('file'), 
  (req, res) => {
    // Set userType for the generic handler
    req.params.userType = 'pelatih'
    req.params.userId = req.params.id_pelatih
    uploadController.uploadSingleFile(req, res)
  }
)

// Generic routes for file operations
router.put('/:userType/:userId/file/:fileType', 
  uploadSingle('file'), 
  uploadController.replaceFile.bind(uploadController)
)

router.delete('/:userType/:userId/file/:fileType', 
  uploadController.deleteFile.bind(uploadController)
)

router.get('/:userType/:userId/file/:fileType/info', 
  uploadController.getFileInfo.bind(uploadController)
)

// Health check
router.get('/health', uploadController.healthCheck.bind(uploadController))

export default router