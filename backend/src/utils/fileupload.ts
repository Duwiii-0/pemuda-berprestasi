import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['uploads/ktp', 'uploads/sertifikat', 'uploads/atlet'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'foto_ktp' || file.fieldname === 'ktp') {
      uploadPath += 'ktp/';
    } else if (file.fieldname === 'sertifikat_pelatih' || file.fieldname === 'sertifikat_belt') {
      uploadPath += 'sertifikat/';
    } else if (file.fieldname === 'akte_kelahiran' || file.fieldname === 'pas_foto') {
      uploadPath += 'atlet/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});