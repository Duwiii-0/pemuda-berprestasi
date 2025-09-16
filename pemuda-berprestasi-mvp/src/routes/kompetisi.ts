import { Router } from 'express';
import { KompetisiController } from '../controllers/kompetisiController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { kompetisiValidation } from '../validations/kompetisiValidation';

const router = Router();

// Public routes
// router.get('/stats', KompetisiController.getStats);
// router.get('/:id/classes', KompetisiController.getCompetitionClasses);

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.post('/', validateRequest(kompetisiValidation.create), KompetisiController.create);
router.get('/', KompetisiController.getAll);
router.get('/:id', KompetisiController.getById);
router.put('/:id', validateRequest(kompetisiValidation.update), KompetisiController.update);
router.delete('/:id', KompetisiController.delete);

// Competition management
// router.post(
//   '/:id/classes',
//   validateRequest(kompetisiValidation.createClass),
//   KompetisiController.addKelasKejuaraan
// );
// sementara update & delete class belum ada di controller

// Registration management
router.get("/:id/atlet", authenticate, KompetisiController.getAtletsByKompetisi);
router.post('/:id/register', authenticate, KompetisiController.registerAtlet);
router.get(
  '/:id/participants/:participantId/available-classes',
  KompetisiController.getAvailableClassesForParticipant
);
router.get(
  '/:id/participants/:participantId/available-classes',
  authenticate,
  KompetisiController.getAvailableClassesSimple
);
 router.put(
   '/:id/participants/:participantId/status',
   validateRequest(kompetisiValidation.updateStatus),
   KompetisiController.updateRegistrationStatus
 );
router.delete("/:id/participants/:participantId", KompetisiController.deleteParticipant);

router.put(
  '/:id/participants/:participantId/class',
  KompetisiController.updateParticipantClass
);

// Tournament management
// router.post('/:id/brackets', KompetisiController.generateBrackets);
// router.get('/:id/brackets', KompetisiController.getBrackets);
// router.post('/:id/draw', KompetisiController.conductDraw);

export default router;