// src/routes/certificate.ts
import { Router } from 'express';
import { CertificateController } from '../controllers/certificateController';
import { authenticate } from '../middleware/auth'; // ✅ Sesuaikan dengan file yang ada

const router = Router();

// Generate certificate number (authenticated)
router.post('/generate-number', 
  authenticate, 
  CertificateController.generateCertificateNumber
);

// Get athlete certificates
router.get('/athlete/:id_atlet', 
  authenticate, 
  CertificateController.getAthleteCertificates
);

// Check if certificate exists
router.get('/check/:id_atlet/:id_peserta_kompetisi',
  authenticate,
  CertificateController.checkCertificateExists
);

export default router;