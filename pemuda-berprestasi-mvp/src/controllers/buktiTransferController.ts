// src/controllers/buktiTransferController.ts

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { sendSuccess, sendError } from '../utils/response'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const BuktiTransferController = {
  
  // Upload bukti transfer
  upload: async (req: Request, res: Response) => {
    try {
      const { id_dojang, id_pelatih } = req.body
      const user = req.user as any
      
      // Auto-detect pelatih ID from user context if not provided
      const pelatihId = id_pelatih || user?.pelatihId || user?.pelatih?.id_pelatih
      
      // Validasi required fields
      if (!id_dojang || !pelatihId) {
        return sendError(res, 'id_dojang dan id_pelatih wajib diisi', 400)
      }
      
      // Check if file uploaded
      if (!req.file) {
        return sendError(res, 'File bukti transfer wajib diupload', 400)
      }
      
      console.log('📤 Uploading bukti transfer:', {
        id_dojang,
        id_pelatih: pelatihId,
        filename: req.file.filename,
        path: req.file.path
      })
      
      // Save to database
      const buktiTransfer = await prisma.tb_buktiTransfer.create({
        data: {
          id_dojang: parseInt(id_dojang),
          id_pelatih: parseInt(pelatihId),
          bukti_transfer_path: req.file.filename // Filename dari multer
        }
      })
      
      console.log('✅ Bukti transfer saved to DB:', buktiTransfer)
      
      return sendSuccess(res, buktiTransfer, 'Bukti transfer berhasil diupload', 201)
      
    } catch (error: any) {
      console.error('❌ Upload bukti transfer error:', error)
      return sendError(res, 'Gagal upload bukti transfer', 500, error.message)
    }
  },
  
  // Get semua bukti transfer
  getAll: async (req: Request, res: Response) => {
    try {
      const buktiTransfers = await prisma.tb_buktiTransfer.findMany({
        orderBy: { created_at: 'desc' }
      })
      
      return sendSuccess(res, buktiTransfers, 'Data bukti transfer berhasil diambil')
    } catch (error: any) {
      console.error('❌ Get all bukti transfer error:', error)
      return sendError(res, 'Gagal mengambil data bukti transfer', 500)
    }
  },
  
  // Get bukti transfer by dojang
  getByDojang: async (req: Request, res: Response) => {
    try {
      const { id_dojang } = req.params
      
      const buktiTransfers = await prisma.tb_buktiTransfer.findMany({
        where: { id_dojang: parseInt(id_dojang) },
        orderBy: { created_at: 'desc' }
      })
      
      return sendSuccess(res, buktiTransfers, `Data bukti transfer dojang ${id_dojang} berhasil diambil`)
    } catch (error: any) {
      console.error('❌ Get bukti transfer by dojang error:', error)
      return sendError(res, 'Gagal mengambil data bukti transfer dojang', 500)
    }
  },
  
  // Get bukti transfer by pelatih
  getByPelatih: async (req: Request, res: Response) => {
    try {
      const { id_pelatih } = req.params
      
      const buktiTransfers = await prisma.tb_buktiTransfer.findMany({
        where: { id_pelatih: parseInt(id_pelatih) },
        orderBy: { created_at: 'desc' }
      })
      
      return sendSuccess(res, buktiTransfers, `Data bukti transfer pelatih ${id_pelatih} berhasil diambil`)
    } catch (error: any) {
      console.error('❌ Get bukti transfer by pelatih error:', error)
      return sendError(res, 'Gagal mengambil data bukti transfer pelatih', 500)
    }
  },
  
  // Delete bukti transfer
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      
      // Find the record first to get file path
      const buktiTransfer = await prisma.tb_buktiTransfer.findUnique({
        where: { id_bukti_transfer: parseInt(id) }
      })
      
      if (!buktiTransfer) {
        return sendError(res, 'Bukti transfer tidak ditemukan', 404)
      }
      
      // Delete file from disk
      const filePath = path.join(process.cwd(), 'uploads', 'pelatih', 'BuktiTf', buktiTransfer.bukti_transfer_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ File deleted: ${filePath}`)
      }
      
      // Delete from database
      await prisma.tb_buktiTransfer.delete({
        where: { id_bukti_transfer: parseInt(id) }
      })
      
      return sendSuccess(res, null, 'Bukti transfer berhasil dihapus')
    } catch (error: any) {
      console.error('❌ Delete bukti transfer error:', error)
      return sendError(res, 'Gagal menghapus bukti transfer', 500)
    }
  }
}