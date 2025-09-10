// src/config/multer.ts - FIXED VERSION
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/pelatih/ktp',
    'uploads/pelatih/sertifikat',
    'uploads/atlet/akte_kelahiran',
    'uploads/atlet/pas_foto',
    'uploads/atlet/sertifikat_belt',
    'uploads/atlet/ktp'
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
    
    // PELATIH FILES
    if (type === 'foto_ktp') {
      folder = 'uploads/pelatih/ktp'
    } else if (type === 'sertifikat_sabuk') {
      folder = 'uploads/pelatih/sertifikat'
    } 
    // ATLET FILES - INI YANG DIPERBAIKI
    else if (type === 'akte_kelahiran') {
      folder = 'uploads/atlet/akte_kelahiran'
    } else if (type === 'pas_foto') {
      folder = 'uploads/atlet/pas_foto'
    } else if (type === 'sertifikat_belt') {
      folder = 'uploads/atlet/sertifikat_belt'
    } else if (type === 'ktp') {
      folder = 'uploads/atlet/ktp'
    } else {
      return cb(new Error('Invalid file field'), '')
    }
    
    cb(null, folder)
  },
  filename: (req, file, cb) => {
    // MASALAH: Logika filename hanya untuk pelatih
    // PERBAIKAN: Handle both pelatih dan atlet
    const user = req.user as any
    const type = file.fieldname
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    let filename = ''

    // UNTUK PELATIH
    if (type === 'foto_ktp' || type === 'sertifikat_sabuk') {
      const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih
      if (!pelatihId) {
        return cb(new Error('Pelatih ID not found'), '')
      }
      const fileType = type === 'foto_ktp' ? 'ktp' : 'sertifikat'
      filename = `${pelatihId}_${fileType}_${timestamp}${ext}`
    } 
    // UNTUK ATLET - INI YANG DITAMBAHKAN
    else if (['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'].includes(type)) {
      // Untuk atlet, bisa pakai timestamp atau ID unik lainnya
      // Karena belum ada ID atlet saat create, pakai timestamp
      const pelatihId = user?.pelatihId || user?.pelatih?.id_pelatih
      filename = `atlet_${pelatihId}_${type}_${timestamp}${ext}`
    } else {
      return cb(new Error('Invalid file type'), '')
    }
    
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

// File serving path helper - DIPERLUAS UNTUK ATLET
export const getFilePath = (id: number, type: 'ktp' | 'sertifikat' | 'akte_kelahiran' | 'pas_foto' | 'sertifikat_belt', extension: string, entity: 'pelatih' | 'atlet' = 'pelatih') => {
  if (entity === 'pelatih') {
    const folder = type === 'ktp' ? 'ktp' : 'sertifikat'
    return `uploads/pelatih/${folder}/${id}_${type}.${extension}`
  } else {
    // untuk atlet
    const folderMap: Record<string, string> = {
      akte_kelahiran: 'akte_kelahiran',
      pas_foto: 'pas_foto', 
      sertifikat_belt: 'sertifikat_belt',
      ktp: 'ktp'
    }
    const folder = folderMap[type]
    return `uploads/atlet/${folder}/${id}_${type}.${extension}`
  }
}