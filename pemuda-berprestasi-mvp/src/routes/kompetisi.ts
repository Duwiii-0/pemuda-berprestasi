import { Router } from 'express';
import { KompetisiController } from '../controllers/kompetisiController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { kompetisiValidation } from '../validations/kompetisiValidation';

const router = Router();

// Public routes
router.get('/published', KompetisiController.getPublished);
router.get('/upcoming', KompetisiController.getUpcoming);
router.get('/stats', KompetisiController.getStats);
router.get('/:id/classes', KompetisiController.getCompetitionClasses);

// Protected routes (require authentication)
router.use(authMiddleware);

// CRUD operations
router.post('/', validateRequest(kompetisiValidation.create), KompetisiController.create);
router.get('/', KompetisiController.getAll);
router.get('/:id', KompetisiController.getById);
router.put('/:id', validateRequest(kompetisiValidation.update), KompetisiController.update);
router.delete('/:id', KompetisiController.delete);

// Competition management
router.post('/:id/classes', validateRequest(kompetisiValidation.createClass), KompetisiController.createClass);
router.put('/:id/classes/:classId', validateRequest(kompetisiValidation.updateClass), KompetisiController.updateClass);
router.delete('/:id/classes/:classId', KompetisiController.deleteClass);

// Registration management
router.get('/:id/participants', KompetisiController.getParticipants);
router.post('/:id/register', validateRequest(kompetisiValidation.register), KompetisiController.registerAthlete);
router.put('/:id/participants/:participantId/status', validateRequest(kompetisiValidation.updateStatus), KompetisiController.updateParticipantStatus);

// Tournament management
router.post('/:id/brackets', KompetisiController.generateBrackets);
router.get('/:id/brackets', KompetisiController.getBrackets);
router.post('/:id/draw', KompetisiController.conductDraw);

export default router;