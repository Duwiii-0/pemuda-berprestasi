import { PrismaClient, StatusKompetisi, Cabang, StatusPendaftaran } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateKompetisiData {
  id_penyelenggara: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  status: StatusKompetisi;
  lokasi?: string;
}

interface UpdateKompetisiData extends Partial<CreateKompetisiData> {
  id_kompetisi: number;
}

interface KompetisiFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusKompetisi;
  start_date?: Date;
  end_date?: Date;
}

export class KompetisiService {
  // Create kompetisi
  static async createKompetisi(data: CreateKompetisiData) {
    const penyelenggara = await prisma.tb_penyelenggara.findUnique({
      where: { id_penyelenggara: data.id_penyelenggara }
    });
    if (!penyelenggara) throw new Error('Penyelenggara tidak ditemukan');

    if (data.tanggal_mulai >= data.tanggal_selesai)
      throw new Error('Tanggal mulai harus sebelum tanggal selesai');
    if (data.tanggal_mulai <= new Date())
      throw new Error('Tanggal mulai harus di masa depan');

    const kompetisi = await prisma.tb_kompetisi.create({
      data: {
        id_penyelenggara: data.id_penyelenggara,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        nama_event: data.nama_event,
        status: data.status,
        lokasi: data.lokasi ?? ''
      },
      include: {
        penyelenggara: {
          select: {
            id_penyelenggara: true,
            nama_penyelenggara: true,
            email: true,
            no_telp: true
          }
        },
        _count: {
          select: {
            kelas_kejuaraan: true
          }
        }
      }
    });

    return kompetisi;
  }

  // Get all kompetisi
  static async getAllKompetisi(filters: KompetisiFilter = {}) {
    const { page = 1, limit = 10, search, status, start_date, end_date } = filters;
    const offset = (page - 1) * limit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { nama_event: { contains: search } },
        { penyelenggara: { nama_penyelenggara: { contains: search } } }
      ];
    }

    if (status) whereCondition.status = status;
    if (start_date || end_date) {
      whereCondition.tanggal_mulai = {};
      if (start_date) whereCondition.tanggal_mulai.gte = start_date;
      if (end_date) whereCondition.tanggal_mulai.lte = end_date;
    }

    const [kompetisiList, total] = await Promise.all([
      prisma.tb_kompetisi.findMany({
        where: whereCondition,
        skip: offset,
        take: limit,
        include: {
          penyelenggara: { select: { nama_penyelenggara: true, email: true } },
          _count: { select: { kelas_kejuaraan: true } }
        },
        orderBy: { tanggal_mulai: 'desc' }
      }),
      prisma.tb_kompetisi.count({ where: whereCondition })
    ]);

    return {
      data: kompetisiList,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  // Get kompetisi by ID
  static async getKompetisiById(id: number) {
    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: id },
      include: {
        penyelenggara: true,
        kelas_kejuaraan: {
          include: {
            kategori_event: true,
            kelompok: true,
            kelas_berat: true,
            poomsae: true,
            _count: { select: { peserta_kompetisi: true } }
          }
        },
        _count: { select: { kelas_kejuaraan: true } }
      }
    });

    if (!kompetisi) throw new Error('Kompetisi tidak ditemukan');
    return kompetisi;
  }

  // Update kompetisi
  static async updateKompetisi(data: UpdateKompetisiData) {
    const { id_kompetisi, ...updateData } = data;
    const existingKompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi }
    });
    if (!existingKompetisi) throw new Error('Kompetisi tidak ditemukan');

    if (updateData.tanggal_mulai && updateData.tanggal_selesai) {
      if (updateData.tanggal_mulai >= updateData.tanggal_selesai)
        throw new Error('Tanggal mulai harus sebelum tanggal selesai');
    }

    const updatedKompetisi = await prisma.tb_kompetisi.update({
      where: { id_kompetisi },
      data: { ...updateData },
      include: { penyelenggara: true }
    });

    return updatedKompetisi;
  }

  // Delete kompetisi
  static async deleteKompetisi(id: number) {
    const existingKompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: id },
      include: { _count: { select: { kelas_kejuaraan: true } } }
    });
    if (!existingKompetisi) throw new Error('Kompetisi tidak ditemukan');

    if (existingKompetisi._count.kelas_kejuaraan > 0) {
      throw new Error('Tidak dapat menghapus kompetisi yang sudah memiliki peserta');
    }

    await prisma.tb_kompetisi.delete({ where: { id_kompetisi: id } });
    return { message: 'Kompetisi berhasil dihapus' };
  }
  
  static async registerAtlet(data: {
    atlitId: number;
    kelasKejuaraanId: number;
  }) {
    // Pastikan atlet dan kelas kejuaraan ada
    const [atlet, kelas] = await Promise.all([
      prisma.tb_atlet.findUnique({ where: { id_atlet: data.atlitId } }),
      prisma.tb_kelas_kejuaraan.findUnique({ where: { id_kelas_kejuaraan: data.kelasKejuaraanId } })
    ]);
  
    if (!atlet) throw new Error('Atlet tidak ditemukan');
    if (!kelas) throw new Error('Kelas kejuaraan tidak ditemukan');
  
    // Cek apakah atlet sudah terdaftar di kelas kejuaraan ini
    const existingRegistration = await prisma.tb_peserta_kompetisi.findFirst({
      where: {
        id_atlet: data.atlitId,
        id_kelas_kejuaraan: data.kelasKejuaraanId
      }
    });
  
    if (existingRegistration) {
      throw new Error('Atlet sudah terdaftar pada kelas kejuaraan ini');
    }
  
    // Simpan registrasi ke database
    const peserta = await prisma.tb_peserta_kompetisi.create({
      data: {
        id_atlet: data.atlitId,
        id_kelas_kejuaraan: data.kelasKejuaraanId,
        status: StatusPendaftaran.PENDING,
      }
    });
  
    return peserta;
  }

  static async getAtletsByKompetisi(kompetisiId: number, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const peserta = await prisma.tb_peserta_kompetisi.findMany({
    where: {
      kelas_kejuaraan: {
        id_kompetisi: kompetisiId,
      },
    },
    include: {
      atlet: true,
      kelas_kejuaraan: true,
    },
    skip,
    take: limit,
  });

  const total = await prisma.tb_peserta_kompetisi.count({
    where: {
      kelas_kejuaraan: {
        id_kompetisi: kompetisiId,
      },
    },
  });

  return { peserta, total };
}



}
