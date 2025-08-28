// src/validations/pelatihValidation.ts
import Joi from 'joi'
import { body } from 'express-validator'


// Update pelatih profile validation
export const validateUpdatePelatih = [
  body('nama_pelatih')
    .optional({ nullable: true }) // 🔥 UBAH: dari .notEmpty() ke .optional()
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true // Allow empty values
      }
      
      // Only validate if value exists
      if (value.length < 2 || value.length > 100) {
        throw new Error('Nama pelatih harus antara 2-100 karakter')
      }
      
      if (!/^[a-zA-Z\s\.]+$/.test(value)) {
        throw new Error('Nama pelatih hanya boleh mengandung huruf, spasi, dan titik')
      }
      
      if (value.includes('  ') || value.trim() !== value) {
        throw new Error('Nama pelatih tidak boleh mengandung spasi berlebihan')
      }
      
      return true
    }),

  body('no_telp')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true // Optional field
      }
      
      // Remove spaces and validate Indonesian phone number
      const cleanPhone = value.replace(/\s/g, '')
      const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Format nomor telepon tidak valid (contoh: 08123456789 atau +628123456789)')
      }
      
      return true
    })
    .isLength({ max: 20 })
    .withMessage('Nomor telepon maksimal 20 karakter'),

  // Tambahkan validasi untuk field lainnya juga
  body('nik')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      if (!/^\d{16}$/.test(value)) {
        throw new Error('NIK harus berupa 16 digit angka')
      }
      
      return true
    }),

  body('tanggal_lahir')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Tanggal lahir harus berupa tanggal yang valid')
      }
      
      if (date > new Date()) {
        throw new Error('Tanggal lahir tidak boleh di masa depan')
      }
      
      return true
    }),

  body('jenis_kelamin')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      if (!['LAKI_LAKI', 'PEREMPUAN'].includes(value)) {
        throw new Error('Jenis kelamin harus LAKI_LAKI atau PEREMPUAN')
      }
      
      return true
    }),

  body('kota')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      if (value.length < 2 || value.length > 100) {
        throw new Error('Kota minimal 2 karakter, maksimal 100 karakter')
      }
      
      return true
    }),

  body('provinsi')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      if (value.length < 2 || value.length > 100) {
        throw new Error('Provinsi minimal 2 karakter, maksimal 100 karakter')
      }
      
      return true
    }),

  body('alamat')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true
      }
      
      if (value.length < 5 || value.length > 255) {
        throw new Error('Alamat minimal 5 karakter, maksimal 255 karakter')
      }
      
      return true
    })
]