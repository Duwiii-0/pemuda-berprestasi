// src/services/pelatihService.ts
import prisma from '../config/database'
import fs from 'fs'
import path from 'path'

export interface UpdatePelatihData {
  nama_pelatih?: string;
  no_telp?: string | '';
  nik?: string | null;
  tanggal_lahir?: Date | null;
  id_dojang?: number; // sekarang pelatih wajib punya 1 dojang
  phone?: string | null;
  kota?: string | null;
  provinsi?: string | null;
  alamat?: string | null;
  jenis_kelamin?: 'LAKI_LAKI' | 'PEREMPUAN' | null;
  
}

export interface PelatihListQuery {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FileInfo {
  filename: string
  path: string
  exists: boolean
  uploadedAt?: Date
}

class PelatihService {
  async getPelatihProfile(id_pelatih: number) {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih },
      include: {
        akun: {
          select: {
            id_akun: true,
            email: true,
            role: true
          }
        },
        dojang: { // ✅ ikutkan relasi dojang
          select: {
            id_dojang: true,
            nama_dojang: true,
            kota: true,
            provinsi: true
          }
        }
      }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    // Check for uploaded files
    const files = await this.getUploadedFiles(id_pelatih)

    return {
      ...pelatih,
      files
    }
  }

  async updatePelatihProfile(id_pelatih: number, data: UpdatePelatihData) {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    const updatedPelatih = await prisma.tb_pelatih.update({
      where: { id_pelatih },
      data,
      include: {
        akun: {
          select: {
            id_akun: true,
            email: true,
            role: true
          }
        },
        dojang: { // ikutkan dojang biar jelas
          select: {
            id_dojang: true,
            nama_dojang: true,
            kota: true,
            provinsi: true
          }
        }
      }
    })

    return updatedPelatih
  }

  async getAllPelatih(query: PelatihListQuery = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sort = 'nama_pelatih',
      order = 'asc'
    } = query

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: any = {}
    if (search) {
      where.OR = [
        { nama_pelatih: { contains: search } },
        { no_telp: { contains: search } },
        { akun: { email: { contains: search } } },
        { dojang: { nama_dojang: { contains: search } } }
      ]
    }

    // Build order by clause
    const orderBy: any = {}
    if (sort === 'created_at') {
      orderBy.akun = { id_akun: order }
    } else {
      orderBy[sort] = order
    }

    const [pelatih, total] = await Promise.all([
      prisma.tb_pelatih.findMany({
        where,
        include: {
          akun: {
            select: {
              id_akun: true,
              email: true,
              role: true
            }
          },
          dojang: { // ✅ ikutkan dojang
            select: {
              id_dojang: true,
              nama_dojang: true,
              kota: true,
              provinsi: true
            }
          },
          _count: {
            select: {
              atlet_pembuat: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.tb_pelatih.count({ where })
    ])

    return {
      data: pelatih,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    }
  }

  async getPelatihById(id_pelatih: number) {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih },
      include: {
        akun: {
          select: {
            id_akun: true,
            email: true,
            role: true
          }
        },
        dojang: { // ✅ langsung ke dojang
          select: {
            id_dojang: true,
            nama_dojang: true,
            kota: true,
            provinsi: true
          }
        },
        atlet_pembuat: {
          select: {
            id_atlet: true,
            nama_atlet: true
          },
          take: 5 // Limit recent athletes
        },
        _count: {
          select: {
            atlet_pembuat: true
          }
        }
      }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    // Get uploaded files info
    const files = await this.getUploadedFiles(id_pelatih)

    return {
      ...pelatih,
      files
    }
  }

  async handleFileUpload(id_pelatih: number, files: any) {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    const updateData: any = {}

    if (files.foto_ktp && files.foto_ktp[0]) {
      updateData.foto_ktp = files.foto_ktp[0].filename
    }

    if (files.sertifikat_sabuk && files.sertifikat_sabuk[0]) {
      updateData.sertifikat_sabuk = files.sertifikat_sabuk[0].filename
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.tb_pelatih.update({
        where: { id_pelatih },
        data: updateData
      })
    }

    return await this.getUploadedFiles(id_pelatih)
  }

  async getUploadedFiles(id_pelatih: number): Promise<{
    foto_ktp: FileInfo | null
    sertifikat_sabuk: FileInfo | null
  }> {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih },
      select: { foto_ktp: true, sertifikat_sabuk: true }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    const checkFile = (filename: string | null, type: 'ktp' | 'sertifikat'): FileInfo | null => {
      if (!filename) return null

      const filePath = path.join(process.cwd(), 'uploads', 'pelatih', type, filename)
      const exists = fs.existsSync(filePath)

      return {
        filename,
        path: `uploads/pelatih/${type}/${filename}`,
        exists,
        uploadedAt: exists ? fs.statSync(filePath).mtime : undefined
      }
    }

    return {
      foto_ktp: checkFile(pelatih.foto_ktp, 'ktp'),
      sertifikat_sabuk: checkFile(pelatih.sertifikat_sabuk, 'sertifikat')
    }
  }

  async deleteFile(id_pelatih: number, fileType: 'foto_ktp' | 'sertifikat_sabuk') {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih }
    })

    if (!pelatih) {
      throw new Error('Pelatih not found')
    }

    const filename = fileType === 'foto_ktp' ? pelatih.foto_ktp : pelatih.sertifikat_sabuk

    if (!filename) {
      throw new Error('File not found')
    }

    // Delete physical file
    const folder = fileType === 'foto_ktp' ? 'ktp' : 'sertifikat'
    const filePath = path.join(process.cwd(), 'uploads', 'pelatih', folder, filename)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Update database
    const updateData = { [fileType]: null }
    await prisma.tb_pelatih.update({
      where: { id_pelatih },
      data: updateData
    })

    return { message: `${fileType} deleted successfully` }
  }
}

export default new PelatihService()
