import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface CreateDojangData {
  nama_dojang: string;
  email?: string;
  no_telp?: string | null;
  negara?: string;
  provinsi?: string;
  kota?: string;
  id_pelatih_pendaftar?: number; // optional, untuk public registration
}

interface UpdateDojangData extends Partial<CreateDojangData> {
  id_dojang: number;
}

export class DojangService {
  // ===== CREATE DOJANG =====
  static async createDojang(data: CreateDojangData) {
    // Cek nama dojang unik
    const existing = await prisma.tb_dojang.findFirst({
      where: { nama_dojang: data.nama_dojang.trim() },
    });
    if (existing) throw new Error('Nama dojang sudah terdaftar');

    // Cek pelatih jika ada
    if (data.id_pelatih_pendaftar) {
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: data.id_pelatih_pendaftar },
      });
      if (!pelatih) throw new Error('Pelatih tidak ditemukan');
    }

    // Hanya sertakan id_pelatih_pendaftar jika ada
    const dojangData: any = {
      nama_dojang: data.nama_dojang.trim(),
      email: data.email?.trim() || null,
      no_telp: data.no_telp?.trim() || null,
      negara: data.negara?.trim() || null,
      provinsi: data.provinsi?.trim() || null,
      kota: data.kota?.trim() || null,
      ...(data.id_pelatih_pendaftar !== undefined && { id_pelatih_pendaftar: data.id_pelatih_pendaftar }),
    };

    return prisma.tb_dojang.create({
      data: dojangData,
      include: {
        pelatih_pendaftar: true,
        atlet: true,
      },
    });
  }

  // ===== GET ALL DOJANG =====
  static async getAllDojang(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { nama_dojang: { contains: search, mode: 'insensitive' } as any }
      : {};

    const [data, total] = await Promise.all([
      prisma.tb_dojang.findMany({
        where,
        skip,
        take: limit,
        include: { pelatih_pendaftar: true, atlet: true },
        orderBy: { id_dojang: 'desc' },
      }),
      prisma.tb_dojang.count({ where }),
    ]);

    return {
      data,
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
      include: { pelatih_pendaftar: true, atlet: true },
    });
    if (!dojang) throw new Error('Dojang tidak ditemukan');
    return dojang;
  }

  // ===== UPDATE DOJANG =====
  static async updateDojang(data: UpdateDojangData) {
    const { id_dojang, ...update } = data;
    const existing = await prisma.tb_dojang.findUnique({ where: { id_dojang } });
    if (!existing) throw new Error('Dojang tidak ditemukan');

    if (update.id_pelatih_pendaftar) {
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: update.id_pelatih_pendaftar },
      });
      if (!pelatih) throw new Error('Pelatih tidak ditemukan');
    }

    // Hanya sertakan field yang tidak undefined
    const updateData: any = { ...update };
    if (update.id_pelatih_pendaftar === undefined) delete updateData.id_pelatih_pendaftar;

    return prisma.tb_dojang.update({
      where: { id_dojang },
      data: updateData,
      include: { pelatih_pendaftar: true, atlet: true },
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

    await prisma.tb_dojang.delete({ where: { id_dojang: id } });
    return { message: 'Dojang berhasil dihapus' };
  }

  // ===== GET BY PELATIH =====
  static async getByPelatih(id_pelatih: number) {
    return prisma.tb_dojang.findMany({
      where: { id_pelatih_pendaftar: id_pelatih },
      include: { pelatih_pendaftar: true, atlet: true },
    });
  }

  // ===== GET BY ATLET =====
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
