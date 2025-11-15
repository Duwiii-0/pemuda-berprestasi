import { Router } from 'express';
import { CertificateController } from '../controllers/certificateController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Generate certificate number (authenticated)
router.post('/generate-number', 
  authMiddleware, 
  CertificateController.generateCertificateNumber
);

// Get athlete certificates
router.get('/athlete/:id_atlet', 
  authMiddleware, 
  CertificateController.getAthleteCertificates
);

// Check if certificate exists
router.get('/check/:id_atlet/:id_peserta_kompetisi',
  authMiddleware,
  CertificateController.checkCertificateExists
);

export default router;