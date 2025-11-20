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
    
    // FIX: Use process.cwd() instead of __dirname to match multer config
    const filePath = path.join(process.cwd(), 'uploads', 'atlet', folder, filename);
    
    console.log(`🔍 Looking for file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found at:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('✅ File found, sending...');
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Error serving file:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
});

router.get('/download/:folder/:filename', (req, res) => {
  try {
    const { folder, filename } = req.params;
    console.log(`📥 Download request: ${folder}/${filename}`);
    
    const allowedFolders = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
    
    if (!allowedFolders.includes(folder)) {
      console.log('❌ Invalid folder:', folder);
      return res.status(400).json({ error: 'Invalid folder' });
    }
    
    // FIX: Use consistent path with multer config
    const filePath = path.join(process.cwd(), 'uploads', 'atlet', folder, filename);
    
    console.log(`🔍 Looking for download file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Download file not found');
      
      // Debug: list directory contents
      try {
        const baseUploadPath = path.join(process.cwd(), 'uploads', 'atlet', folder);
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
        expected_path: filePath
      });
    }
    
    // Set download headers
    const originalName = filename.replace(/^.*?_.*?_.*?_/, ''); // Remove prefix if any
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    console.log(`📤 Sending download file: ${filePath}`);
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