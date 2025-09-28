import multer from 'multer'
import { PrismaClient } from "@prisma/client";
import path from 'path'
import fs from 'fs'
import { ATLET_FOLDER_MAP, PELATIH_FOLDER_MAP, DOJANG_FOLDER_MAP } from '../constants/fileMapping'

const prisma = new PrismaClient();

// Get absolute path for uploads directory
const getUploadsPath = () => {
  // Use process.cwd() to get current working directory, then add uploads
  return path.join(process.cwd(), 'uploads');
}

const getTimestamp = () => {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')

  return `${dd}/${mm}/${yyyy}_${hh}.${min}`
}


const createUploadDirs = () => {
  const baseDir = getUploadsPath();
  const dirs = [
    'pelatih/ktp',
    'pelatih/sertifikat',
    'pelatih/BuktiTf',
    'atlet/akte_kelahiran',
    'atlet/pas_foto', 
    'atlet/sertifikat_belt',
    'atlet/ktp',
    'dojang/logos' // folder untuk logo dojang
  ]
  
  dirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`📁 Creating directory: ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  })
}

// Create directories on startup
createUploadDirs()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname
    const baseDir = getUploadsPath();
    let folder = ''
    
    // PELATIH FILES
    if (PELATIH_FOLDER_MAP[type]) {
      folder = path.join(baseDir, 'pelatih', PELATIH_FOLDER_MAP[type])
    } 
    // ATLET FILES
    else if (ATLET_FOLDER_MAP[type]) {
      folder = path.join(baseDir, 'atlet', ATLET_FOLDER_MAP[type])
    }
    // DOJANG FILES
    else if (DOJANG_FOLDER_MAP[type]) {
      folder = path.join(baseDir, 'dojang', DOJANG_FOLDER_MAP[type])
    } else {
      console.error(`❌ Invalid file field: ${type}`);
      return cb(new Error(`Invalid file field: ${type}`), '')
    }
    
    // Ensure directory exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    console.log(`📂 Upload destination: ${folder}`);
    cb(null, folder)
  },
  filename: async (req, file, cb) => {
  const user = req.user as any
  const type = file.fieldname
  const timestamp = getTimestamp()
  const ext = path.extname(file.originalname)
  let filename = ''

  // UNTUK PELATIH
  if (PELATIH_FOLDER_MAP[type]) {
    const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih
    if (!pelatihId) {
      return cb(new Error('Pelatih ID not found'), '')
    }
    
    // Handle different pelatih file types
    if (type === 'foto_ktp') {
      filename = `${pelatihId}_ktp_${timestamp}${ext}`
    } else if (type === 'sertifikat_sabuk') {
      filename = `${pelatihId}_sertifikat_${timestamp}${ext}`
    } else if (type === 'bukti_transfer') {
    const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih
    const dojangId = user?.dojangId ||user?.pelatih?.id_dojang 
    
    // Query database untuk menghitung jumlah upload yang sudah ada
    const existingCount = await prisma.tb_buktiTransfer.count({
      where: { 
        id_dojang: dojangId,
        id_pelatih: pelatihId 
      }
    })
    
    const counter = existingCount + 1
    filename = `${pelatihId}_dojang${dojangId}_bukti_${counter}_${timestamp}${ext}`
  }
  } 
  // UNTUK ATLET
  else if (ATLET_FOLDER_MAP[type]) {
    const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih || 'temp'
    filename = `atlet_${pelatihId}_${type}_${timestamp}${ext}`
  }
  // UNTUK DOJANG
  else if (DOJANG_FOLDER_MAP[type]) {
    const dojangId = user?.dojangId || user?.dojang?.id_dojang || 'temp'
    filename = `dojang_${dojangId}_logo_${timestamp}${ext}`
  } else {
    return cb(new Error('Invalid file type'), '')
  }
  
  console.log(`📄 Generated filename: ${filename}`);
  cb(null, filename)
}
})

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (mimetype && extname) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, PDF, and WebP files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export const uploadDojangRegistration = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'logo') {
        const logoPath = path.join(getUploadsPath(), 'dojang', 'logos');
        // Ensure directory exists
        if (!fs.existsSync(logoPath)) {
          fs.mkdirSync(logoPath, { recursive: true });
        }
        console.log(`📂 Dojang registration upload to: ${logoPath}`);
        cb(null, logoPath);
      } else {
        cb(new Error(`Invalid file field: ${file.fieldname}`), '');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `dojang_registration_${timestamp}${ext}`;
      console.log(`📄 Dojang registration filename: ${filename}`);
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Add debugging middleware
export const debugUpload = (req: any, res: any, next: any) => {
  console.log('🔍 DEBUG UPLOAD MIDDLEWARE:');
  console.log('  - Working Directory:', process.cwd());
  console.log('  - Uploads Path:', getUploadsPath());
  console.log('  - File fieldname:', req.file?.fieldname);
  console.log('  - User context:', {
    id_akun: req.user?.id_akun,
    pelatihId: req.user?.pelatihId,
    dojangId: req.user?.dojangId
  });
  next();
};