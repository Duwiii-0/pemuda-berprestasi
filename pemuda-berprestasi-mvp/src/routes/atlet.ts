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
  authenticate,
  uploadMiddleware.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]),
  validateRequest(atletValidation.create),
  AtletController.create
);

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
  '/kompetisi/:id_kompetisi/atlet',
  AtletController.getByKompetisi
);


export default router;