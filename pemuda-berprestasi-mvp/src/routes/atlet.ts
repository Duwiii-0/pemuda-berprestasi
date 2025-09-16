import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { AtletController } from '../controllers/atletController';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { validateRequest } from '../middleware/validation';
import { atletValidation } from '../validations/atletValidation';

const router = Router();

// Public routes
router.get('/stats', AtletController.getStats);

// File serving route (tambahkan sebelum protected routes)
router.get('/files/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const allowedFolders = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder' });
    }
    
    const filePath = path.join(__dirname, `../../uploads/atlet/${folder}/${filename}`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Error serving file' });
  }
});

// DOWNLOAD ENDPOINT - Public route
router.get('/download/:folder/:filename', (req, res) => {
  try {
    const { folder, filename } = req.params;
    console.log(`📥 Download request: ${folder}/${filename}`);
    
    const allowedFolders = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
    
    if (!allowedFolders.includes(folder)) {
      console.log('❌ Invalid folder:', folder);
      return res.status(400).json({ error: 'Invalid folder' });
    }
    
    // Coba beberapa path yang mungkin
    const possiblePaths = [
      path.join(process.cwd(), `uploads/atlet/${folder}/${filename}`),
      path.join(__dirname, `../../uploads/atlet/${folder}/${filename}`),
      path.join(__dirname, `../uploads/atlet/${folder}/${filename}`),
    ];
    
    let filePath: string | null = null; // ← TAMBAHKAN TYPE ANNOTATION INI
    for (const p of possiblePaths) {
      console.log(`🔍 Checking: ${p}`);
      if (fs.existsSync(p)) {
        filePath = p;
        console.log(`✅ Found at: ${filePath}`);
        break;
      }
    }
    
    if (!filePath) {
      console.log('❌ File not found');
      // Debug: list directory contents
      try {
        const baseUploadPath = path.join(process.cwd(), 'uploads/atlet', folder);
        if (fs.existsSync(baseUploadPath)) {
          const files = fs.readdirSync(baseUploadPath);
          console.log(`📁 Files in ${folder}:`, files);
        } else {
          console.log(`📁 Directory doesn't exist: ${baseUploadPath}`);
        }
      } catch (e) {
        console.log('Error listing files:', e);
      }
      
      return res.status(404).json({ 
        error: 'File not found',
        requested: `${folder}/${filename}`,
        paths_checked: possiblePaths
      });
    }
    
    // Set download headers
    const originalName = filename.replace(/^.*?_.*?_.*?_/, ''); // Remove prefix if any
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    console.log(`📤 Sending file: ${filePath}`);
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Server error during download' });
  }
});

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.post(
  '/',
  authenticate, // 1. Auth dulu
  uploadMiddleware.fields([ // 2. Upload middleware
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]),
  AtletController.create // 4. Controller terakhir
);

router.get('/', AtletController.getAll);
router.get('/dojang/:id_dojang', AtletController.getByDojang);
router.post("/eligible", authenticate, AtletController.getEligible);
router.get('/:id', AtletController.getById);
router.delete('/:id', AtletController.delete);


router.put('/:id', 
  uploadMiddleware.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]),
  validateRequest(atletValidation.update),
  AtletController.update
);

// File upload routes
router.post('/:id/upload-documents', 
  uploadMiddleware.fields([
    { name: 'akte_kelahiran', maxCount: 1 },
    { name: 'pas_foto', maxCount: 1 },
    { name: 'sertifikat_belt', maxCount: 1 },
    { name: 'ktp', maxCount: 1 }
  ]), 
  AtletController.uploadDocuments
);

// Get all athletes in a specific competition with optional cabang filter
router.get(
  '/kompetisi/:id_kompetisi/atlet', authenticate,
  AtletController.getByKompetisi
);

export default router;