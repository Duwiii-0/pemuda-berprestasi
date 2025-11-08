import { Router } from 'express';
import { KompetisiController } from '../controllers/kompetisiController';

const router = Router();

// ✅ PUBLIC endpoints untuk Medal Tally (NO AUTH REQUIRED)
// Endpoint ini bisa diakses tanpa login
router.get('/kompetisi/:id', KompetisiController.getById);
router.get('/kompetisi/:id/medal-tally', KompetisiController.getMedalTally);

export default router;