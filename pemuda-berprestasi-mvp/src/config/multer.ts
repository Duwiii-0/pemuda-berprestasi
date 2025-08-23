// src/config/multer.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/pelatih/ktp',
    'uploads/pelatih/sertifikat'
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// Create directories on startup
createUploadDirs()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname
    let folder = ''
    
    if (type === 'foto_ktp') {
      folder = 'uploads/pelatih/ktp'
    } else if (type === 'sertifikat_sabuk') {
      folder = 'uploads/pelatih/sertifikat'
    } else {
      return cb(new Error('Invalid file field'), '')
    }
    
    cb(null, folder)
  },
  filename: (req, file, cb) => {
    const user = req.user as any
    const pelatihId = user.pelatihId
    
    if (!pelatihId) {
      return cb(new Error('Pelatih ID not found'), '')
    }
    
    const type = file.fieldname === 'foto_ktp' ? 'ktp' : 'sertifikat'
    const ext = path.extname(file.originalname)
    const filename = `${pelatihId}_${type}${ext}`
    
    cb(null, filename)
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (mimetype && extname) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// File serving path helper
export const getFilePath = (pelatihId: number, type: 'ktp' | 'sertifikat', extension: string) => {
  const folder = type === 'ktp' ? 'ktp' : 'sertifikat'
  return `uploads/pelatih/${folder}/${pelatihId}_${type}.${extension}`
}