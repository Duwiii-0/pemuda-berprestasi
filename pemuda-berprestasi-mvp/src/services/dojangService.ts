import { PrismaClient } from '@prisma/client';
import { fileManager } from '../utils/fileManager';
import path from 'path';

const prisma = new PrismaClient();

interface CreateDojangData {
  nama_dojang: string;
  email?: string;
  no_telp?: string | null;
  negara?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamat?: string;
  logo?: any; // File from multer
}

interface UpdateDojangData extends Partial<CreateDojangData> {
  id_dojang: number;
}

export class DojangService {
  // ===== CREATE DOJANG =====
  static async createDojang(data: CreateDojangData) {
    const existing = await prisma.tb_dojang.findFirst({
      where: { nama_dojang: data.nama_dojang.trim() },
    });
    if (existing) throw new Error('Nama dojang sudah terdaftar');

    let logoPath: string | null = null;

    // Handle file upload if logo is provided
    if (data.logo) {
      try {
        // Create uploads/dojang directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'uploads', 'dojang');
        
        // Generate unique filename
        const fileExtension = path.extname(data.logo.originalname);
        const uniqueFilename = `dojang_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;
        
        // Save file using fileManager utility
        logoPath = await fileManager.saveFile(
          data.logo.buffer, 
          'dojang', 
          uniqueFilename
        );
      } catch (error) {
        console.error('Error saving logo file:', error);
        throw new Error('Gagal menyimpan file logo');
      }
    }

    return prisma.tb_dojang.create({
      data: {
        nama_dojang: data.nama_dojang.trim(),
        email: data.email?.trim() || null,
        no_telp: data.no_telp?.trim() || null,
        negara: data.negara?.trim() || null,
        provinsi: data.provinsi?.trim() || null,
        kota: data.kota?.trim() || null,
        kecamatan: data.kecamatan?.trim() || null,
        kelurahan: data.kelurahan?.trim() || null,
        alamat: data.alamat?.trim() || null,
        logo: logoPath, // Save file path to database
      },
      include: { pelatih: true, atlet: true },
    });
  }

  // ===== GET ALL DOJANG =====
  static async getAllDojang(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { nama_dojang: { contains: search, mode: 'insensitive' } }
      : {};

    const [data, total] = await Promise.all([
      prisma.tb_dojang.findMany({
        where,
        skip,
        take: limit,
        include: { 
          pelatih: true,
          _count: { select: { atlet: true } } // hitung jumlah atlet
        },
        orderBy: { id_dojang: 'desc' },
      }),
      prisma.tb_dojang.count({ where }),
    ]);

    // format data supaya jumlah_atlet lebih mudah diakses di frontend
    const formattedData = data.map(item => ({
      ...item,
      jumlah_atlet: item._count.atlet,
      // Convert logo path to full URL if needed
      logo_url: item.logo ? `/uploads/dojang/${path.basename(item.logo)}` : null
    }));

    return {
      data: formattedData,
      pagination: {
        currentPage: page,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit,
      },
    };
  }

  // ===== GET DOJANG BY ID =====
  static async getDojangById(id: number) {
    const dojang = await prisma.tb_dojang.findUnique({
      where: { id_dojang: id },
      include: { pelatih: true, atlet: true },
    });
    if (!dojang) throw new Error('Dojang tidak ditemukan');
    
    return {
      ...dojang,
      logo_url: dojang.logo ? `/uploads/dojang/${path.basename(dojang.logo)}` : null
    };
  }

  // ===== UPDATE DOJANG =====
  static async updateDojang(data: UpdateDojangData) {
    const { id_dojang, logo, ...update } = data;
    const existing = await prisma.tb_dojang.findUnique({ where: { id_dojang } });
    if (!existing) throw new Error('Dojang tidak ditemukan');

    let logoPath: string | null = existing.logo; // Keep existing logo by default

    // Handle logo update if new logo is provided
    if (logo) {
      try {
        // Delete old logo file if exists
        if (existing.logo) {
          await fileManager.deleteFile(existing.logo);
        }

        // Generate unique filename for new logo
        const fileExtension = path.extname(logo.originalname);
        const uniqueFilename = `dojang_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;
        
        // Save new logo file
        logoPath = await fileManager.saveFile(
          logo.buffer, 
          'dojang', 
          uniqueFilename
        );
      } catch (error) {
        console.error('Error updating logo file:', error);
        throw new Error('Gagal memperbarui file logo');
      }
    }

    const updatedData = {
      ...update,
      logo: logoPath
    };

    // Remove undefined values
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key as keyof typeof updatedData] === undefined) {
        delete updatedData[key as keyof typeof updatedData];
      }
    });

    return prisma.tb_dojang.update({
      where: { id_dojang },
      data: updatedData,
      include: { pelatih: true, atlet: true },
    });
  }

  // ===== DELETE DOJANG =====
  static async deleteDojang(id: number) {
    const existing = await prisma.tb_dojang.findUnique({
      where: { id_dojang: id },
      include: { atlet: true },
    });
    if (!existing) throw new Error('Dojang tidak ditemukan');
    if (existing.atlet.length > 0) throw new Error('Tidak bisa menghapus dojang yang masih memiliki atlet');

    // Delete logo file if exists
    if (existing.logo) {
      try {
        await fileManager.deleteFile(existing.logo);
      } catch (error) {
        console.error('Error deleting logo file:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    await prisma.tb_dojang.delete({ where: { id_dojang: id } });
    return { message: 'Dojang berhasil dihapus' };
  }

  // ===== GET DOJANG BY PELATIH =====
  static async getByPelatih(id_pelatih: number) {
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_pelatih },
      include: { dojang: true },
    });
    if (!pelatih) throw new Error('Pelatih tidak ditemukan');
    
    if (pelatih.dojang) {
      return {
        ...pelatih.dojang,
        logo_url: pelatih.dojang.logo ? `/uploads/dojang/${path.basename(pelatih.dojang.logo)}` : null
      };
    }
    
    return pelatih.dojang;
  }

  // ===== GET DOJANG BY ATLET =====
  static async getByAtlet(id_atlet: number) {
    const atlet = await prisma.tb_atlet.findUnique({
      where: { id_atlet },
      include: { dojang: true },
    });
    if (!atlet) throw new Error('Atlet tidak ditemukan');
    
    if (atlet.dojang) {
      return {
        ...atlet.dojang,
        logo_url: atlet.dojang.logo ? `/uploads/dojang/${path.basename(atlet.dojang.logo)}` : null
      };
    }
    
    return atlet.dojang;
  }

  // ===== CHECK NAME AVAILABILITY =====
  static async checkNameAvailability(nama: string) {
    const existing = await prisma.tb_dojang.findFirst({ where: { nama_dojang: nama.trim() } });
    return !existing;
  }
}