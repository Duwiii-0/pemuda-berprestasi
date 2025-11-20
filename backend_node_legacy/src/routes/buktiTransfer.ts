// src/routes/buktiTransfer.ts

import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { BuktiTransferController } from '../controllers/buktiTransferController'
import { authenticate } from '../middleware/auth'
import { uploadBuktiTransfer } from '../middleware/upload'

const router = Router()

// File serving route untuk preview bukti transfer
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    const filePath = path.join(process.cwd(), 'uploads', 'pelatih', 'BuktiTf', filename)
    
    console.log(`🔍 Looking for bukti transfer file at: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Bukti transfer file not found at:', filePath)
      return res.status(404).json({ error: 'File not found' })
    }
    
    console.log('✅ Bukti transfer file found, sending...')
    res.sendFile(filePath)
  } catch (error) {
    console.error('❌ Error serving bukti transfer file:', error)
    res.status(500).json({ error: 'Error serving file' })
  }
})

// Download route untuk bukti transfer
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params
    console.log(`📥 Download bukti transfer request: ${filename}`)
    
    const filePath = path.join(process.cwd(), 'uploads', 'pelatih', 'BuktiTf', filename)
    
    console.log(`🔍 Looking for download file at: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Download file not found')
      return res.status(404).json({ 
        error: 'File not found',
        requested: filename,
        expected_path: filePath
      })
    }
    
    // Set download headers
    const originalName = filename.replace(/^.*?_/, '') // Remove timestamp prefix
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`)
    res.setHeader('Content-Type', 'application/octet-stream')
    
    console.log(`📤 Sending download file: ${filePath}`)
    res.sendFile(path.resolve(filePath))
    
  } catch (error) {
    console.error('❌ Download error:', error)
    res.status(500).json({ error: 'Server error during download' })
  }
})

// Protected routes (require authentication)
router.use(authenticate)

// CRUD operations
router.post('/', uploadBuktiTransfer, BuktiTransferController.upload)
router.get('/', BuktiTransferController.getAll)
router.get('/dojang/:id_dojang', BuktiTransferController.getByDojang)
router.get('/pelatih/:id_pelatih', BuktiTransferController.getByPelatih)
router.delete('/:id', BuktiTransferController.delete)

export default router