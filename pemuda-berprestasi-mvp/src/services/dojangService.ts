import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface CreateDojangData {
  nama_dojang: string;
  email?: string;
  no_telp?: string | null;
  negara?: string;
  provinsi?: string;
  kota?: string;
  logo?: string; 
}

interface UpdateDojangData extends Partial<CreateDojangData> {
  id_dojang: number;
  alamat?: string;
}

export class DojangService {
  // ===== CREATE DOJANG =====
static async createDojang(data: CreateDojangData) {
  console.log('📝 DojangService.createDojang data:', data);
  
  const existing = await prisma.tb_dojang.findFirst({
    where: { nama_dojang: data.nama_dojang.trim() },
  });
  if (existing) throw new Error('Nama dojang sudah terdaftar');

  const createPayload = {
    nama_dojang: data.nama_dojang.trim(),
    email: data.email?.trim() || null,
    no_telp: data.no_telp?.trim() || null,
    negara: data.negara?.trim() || null,
    provinsi: data.provinsi?.trim() || null,
    kota: data.kota?.trim() || null,
    logo: data.logo || null, // ✅ TAMBAHAN: Include logo
  };

  console.log('💾 Creating dojang with payload:', createPayload);

  return prisma.tb_dojang.create({
    data: createPayload,
    include: { pelatih: true, atlet: true },
  });
}

  // ===== GET ALL DOJANG =====
  static async getAllDojang(page = 1, limit = 100, search?: string) {
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
      jumlah_atlet: item._count.atlet
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
    return dojang;
  }

  // ===== UPDATE DOJANG =====
  static async updateDojang(data: UpdateDojangData) {
    const { id_dojang, ...update } = data;
    const existing = await prisma.tb_dojang.findUnique({ where: { id_dojang } });
    if (!existing) throw new Error('Dojang tidak ditemukan');

    return prisma.tb_dojang.update({
      where: { id_dojang },
      data: update,
      include: { pelatih: true, atlet: true },
    });
  }

// ===== DELETE DOJANG =====
static async deleteDojang(id: number) {
  const existing = await prisma.tb_dojang.findUnique({
    where: { id_dojang: id }, // gunakan parameter id, bukan hardcode 1
    include: { atlet: true }  // hanya where dan include
  });
  
  if (!existing) throw new Error('Dojang tidak ditemukan');
  if (existing.atlet.length > 0) throw new Error('Tidak bisa menghapus dojang yang masih memiliki atlet');

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
    return pelatih.dojang;
  }

  // ===== GET DOJANG BY ATLET =====
  static async getByAtlet(id_atlet: number) {
    const atlet = await prisma.tb_atlet.findUnique({
      where: { id_atlet },
      include: { dojang: true },
    });
    if (!atlet) throw new Error('Atlet tidak ditemukan');
    return atlet.dojang;
  }

  // ===== CHECK NAME AVAILABILITY =====
  static async checkNameAvailability(nama: string) {
    const existing = await prisma.tb_dojang.findFirst({ where: { nama_dojang: nama.trim() } });
    return !existing;
  }
}