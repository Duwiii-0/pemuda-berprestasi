import { Router } from 'express';
import { DojangController } from '../controllers/dojangController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { dojangValidation } from '../validations/dojangValidation';
import { upload } from '../config/multer'; // TAMBAHAN: Import multer config

const router = Router();

// ===== PUBLIC ROUTES =====
// Check nama dojang availability
router.get('/check-name', validateRequest(dojangValidation.checkName), DojangController.checkNameAvailability);

// Get public dojang statistics
router.get('/stats', DojangController.getStats);
// get dojang all
router.get('/listdojang', DojangController.getAll);

// Registrasi dojang baru (PUBLIC - tanpa login)
router.post('/', validateRequest(dojangValidation.create), DojangController.create);

// ===== AUTHENTICATED ROUTES =====
router.use(authenticate); // Semua route setelah ini memerlukan autentikasi

// Pelatih routes
router.get('/my-dojang', DojangController.getMyDojang);
router.get('/pelatih/:id_pelatih', DojangController.getByPelatih);

// Update dan delete dojang (perlu permission check)
// PERBAIKAN: Tambahkan upload.single('logo') middleware untuk handle file upload
router.put('/:id', 
  upload.single('logo'), // TAMBAHAN: Handle logo upload
  validateRequest(dojangValidation.update), 
  DojangController.update
);

router.delete('/:id', DojangController.delete);

// Get dojang by ID (authenticated view - lebih detail)
router.get('/:id', DojangController.getById);

export default router;