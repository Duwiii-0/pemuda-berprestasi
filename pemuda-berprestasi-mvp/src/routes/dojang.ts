import { Router } from 'express';
import { DojangController } from '../controllers/dojangController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { dojangValidation } from '../validations/dojangValidation';

const router = Router();

// Public routes
router.get('/stats', DojangController.getStats);

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.post('/', validateRequest(dojangValidation.create), DojangController.create);
router.get('/', DojangController.getAll);
router.get('/my-dojang', DojangController.getMyDojang);
router.get('/pelatih/:id_pelatih', DojangController.getByPelatih);
router.get('/:id', DojangController.getById);
router.put('/:id', validateRequest(dojangValidation.update), DojangController.update);
router.delete('/:id', DojangController.delete);

export default router;