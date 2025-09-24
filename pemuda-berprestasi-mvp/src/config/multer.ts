import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { ATLET_FOLDER_MAP, PELATIH_FOLDER_MAP, DOJANG_FOLDER_MAP } from '../constants/fileMapping'

const createUploadDirs = () => {
  const dirs = [
    'uploads/pelatih/ktp',
    'uploads/pelatih/sertifikat',
    'uploads/atlet/akte_kelahiran',
    'uploads/atlet/pas_foto', 
    'uploads/atlet/sertifikat_belt',
    'uploads/atlet/ktp',
    'uploads/dojang/logos' // TAMBAHAN: folder untuk logo dojang
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

createUploadDirs()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname
    let folder = ''
    
    // PELATIH FILES
    if (PELATIH_FOLDER_MAP[type]) {
      folder = `uploads/pelatih/${PELATIH_FOLDER_MAP[type]}`
    } 
    // ATLET FILES
    else if (ATLET_FOLDER_MAP[type]) {
      folder = `uploads/atlet/${ATLET_FOLDER_MAP[type]}`
    }
    // DOJANG FILES - TAMBAHAN
    else if (DOJANG_FOLDER_MAP[type]) {
      folder = `uploads/dojang/${DOJANG_FOLDER_MAP[type]}`
    } else {
      return cb(new Error(`Invalid file field: ${type}`), '')
    }
    
    cb(null, folder)
  },
  filename: (req, file, cb) => {
    const user = req.user as any
    const type = file.fieldname
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    let filename = ''

    // UNTUK PELATIH
    if (PELATIH_FOLDER_MAP[type]) {
      const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih
      if (!pelatihId) {
        return cb(new Error('Pelatih ID not found'), '')
      }
      const fileType = type === 'foto_ktp' ? 'ktp' : 'sertifikat'
      filename = `${pelatihId}_${fileType}_${timestamp}${ext}`
    } 
    // UNTUK ATLET
    else if (ATLET_FOLDER_MAP[type]) {
      const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih || 'temp'
      filename = `atlet_${pelatihId}_${type}_${timestamp}${ext}`
    }
    // UNTUK DOJANG - TAMBAHAN
    else if (DOJANG_FOLDER_MAP[type]) {
      const dojangId = user?.dojangId || user?.dojang?.id_dojang || 'temp'
      filename = `dojang_${dojangId}_logo_${timestamp}${ext}`
    } else {
      return cb(new Error('Invalid file type'), '')
    }
    
    cb(null, filename)
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf|webp/ // TAMBAHAN: webp untuk logo
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
        cb(null, 'uploads/dojang/logos');
      } else {
        cb(new Error(`Invalid file field: ${file.fieldname}`), '');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `dojang_registration_${timestamp}${ext}`;
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});