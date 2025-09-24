import { Router } from 'express';
import { DojangController } from '../controllers/dojangController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { dojangValidation } from '../validations/dojangValidation';
import { upload, uploadDojangRegistration } from '../config/multer';

const router = Router();

// ===== PUBLIC ROUTES =====
// Check nama dojang availability
router.get('/check-name', validateRequest(dojangValidation.checkName), DojangController.checkNameAvailability);

// Get public dojang statistics
router.get('/stats', DojangController.getStats);
// get dojang all
router.get('/listdojang', DojangController.getAll);

// ✅ PERBAIKAN: Registrasi dojang baru dengan upload logo
router.post('/', 
  uploadDojangRegistration.single('logo'), 
  // validateRequest(dojangValidation.create),
  DojangController.create
);

// ===== AUTHENTICATED ROUTES =====
router.use(authenticate); // Semua route setelah ini memerlukan autentikasi

// Pelatih routes
router.get('/my-dojang', DojangController.getMyDojang);
router.get('/pelatih/:id_pelatih', DojangController.getByPelatih);

// Update dan delete dojang (perlu permission check)
router.put('/:id', 
  upload.single('logo'), // Handle logo upload
  validateRequest(dojangValidation.update), 
  DojangController.update
);

router.delete('/:id', DojangController.delete);

// Get dojang by ID (authenticated view - lebih detail)
router.get('/:id', DojangController.getById);

export default router;