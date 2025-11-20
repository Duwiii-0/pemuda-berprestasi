import { Router } from 'express';
import { getPertandinganInfo } from '../controllers/pertandinganController';

const router = Router();

router.get('/kompetisi/:id_kompetisi', getPertandinganInfo);

export default router;