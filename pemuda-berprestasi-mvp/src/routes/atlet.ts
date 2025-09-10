import { Router } from 'express';
import { AtletController } from '../controllers/atletController';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { validateRequest } from '../middleware/validation';
import { atletValidation } from '../validations/atletValidation';

const router = Router();

// Public routes
router.get('/stats', AtletController.getStats);

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.post(
  '/',
  authenticate, // 1. Auth dulu
  uploadMiddleware.fields([ // 2. Upload middleware
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]),
  // 3. JANGAN pakai validateRequest untuk form dengan file upload!
  // validateRequest akan expect JSON body, padahal ini FormData
  AtletController.create // 4. Controller terakhir
)

router.get('/', AtletController.getAll);
router.get('/dojang/:id_dojang', AtletController.getByDojang);
router.post("/eligible", authenticate, AtletController.getEligible);
router.get('/:id', AtletController.getById);
router.put('/:id', validateRequest(atletValidation.update), AtletController.update);
router.delete('/:id', AtletController.delete);

// File upload routes
router.post('/:id/upload-documents', 
  uploadMiddleware.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]), 
  AtletController.uploadDocuments
);

// Get all athletes in a specific competition with optional cabang filter
router.get(
  '/kompetisi/:id_kompetisi/atlet', authenticate,
  AtletController.getByKompetisi
);


export default router;