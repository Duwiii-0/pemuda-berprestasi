import { Router } from 'express';
import { getPertandinganInfo } from '../controllers/pertandinganController';

const router = Router();

router.get('/', getPertandinganInfo);

export default router;