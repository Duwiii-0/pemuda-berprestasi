import { Router } from 'express';
import { DojangController } from '../controllers/dojangController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { dojangValidation } from '../validations/dojangValidation';

const router = Router();

// ===== PUBLIC ROUTES (tidak perlu login) =====
// PENTING: Route yang lebih spesifik harus di atas route yang lebih umum

// Check nama dojang availability
router.get('/check-name', DojangController.checkNameAvailability);

// Get public dojang stats
router.get('/stats', DojangController.getStats);

// Registrasi dojang baru (PUBLIC - HARUS BISA DIAKSES TANPA LOGIN)
router.post('/', validateRequest(dojangValidation.create), DojangController.create);

// ===== AUTHENTICATED ROUTES =====
router.use(authenticate); // Semua route setelah ini memerlukan autentikasi

// Admin routes untuk manage pending dojangs
router.get('/admin/pending', DojangController.getPending);
router.put('/admin/:id/approve', validateRequest(dojangValidation.approve), DojangController.approve);
router.put('/admin/:id/reject', validateRequest(dojangValidation.reject), DojangController.reject);

// Pelatih routes
router.get('/my-dojang', DojangController.getMyDojang);
router.get('/pelatih/:id_pelatih', DojangController.getByPelatih);

// Get all dojang (authenticated view - lebih detail)
router.get('/', validateRequest(dojangValidation.query), DojangController.getAll);

// Update dan delete dojang (perlu permission check)
router.put('/:id', validateRequest(dojangValidation.update), DojangController.update);
router.delete('/:id', DojangController.delete);

// Get dojang by ID (authenticated view - lebih detail)
router.get('/:id', DojangController.getById);

export default router;