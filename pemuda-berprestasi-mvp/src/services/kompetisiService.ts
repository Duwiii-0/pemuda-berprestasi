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

export type RegistrationResult = {
  peserta1: PesertaKompetisi;
  peserta2?: PesertaKompetisi; // Optional for team registrations
};


type PesertaKompetisi = {
  id_peserta_kompetisi: number;
  id_atlet: number;
  id_kelas_kejuaraan: number;
  status: StatusPendaftaran;
  created_at?: string;
  updated_at?: string;
};

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
  
  // ✅ FIXED: Proper return types for registerAtlet service

static async registerAtlet(data: {
  atlitId: number;
  kelasKejuaraanId: number;
  atlitId2?: number;
}): Promise<RegistrationResult> {
  // Validate first athlete
  const [atlet, kelas] = await Promise.all([
    prisma.tb_atlet.findUnique({ where: { id_atlet: data.atlitId } }),
    prisma.tb_kelas_kejuaraan.findUnique({ where: { id_kelas_kejuaraan: data.kelasKejuaraanId } })
  ]);

  if (!atlet) throw new Error('Atlet pertama tidak ditemukan');
  if (!kelas) throw new Error('Kelas kejuaraan tidak ditemukan');

  // Validate second athlete if provided
  if (data.atlitId2) {
    const atlet2 = await prisma.tb_atlet.findUnique({ 
      where: { id_atlet: data.atlitId2 } 
    });
    if (!atlet2) throw new Error('Atlet kedua tidak ditemukan');
    
    // Check if same athlete
    if (data.atlitId === data.atlitId2) {
      throw new Error('Atlet pertama dan kedua tidak boleh sama');
    }
  }

  // Check existing registrations for first athlete
  const existingRegistration1 = await prisma.tb_peserta_kompetisi.findFirst({
    where: {
      id_atlet: data.atlitId,
      id_kelas_kejuaraan: data.kelasKejuaraanId
    }
  });

  if (existingRegistration1) {
    throw new Error('Atlet pertama sudah terdaftar pada kelas kejuaraan ini');
  }

  // Check existing registrations for second athlete
  if (data.atlitId2) {
    const existingRegistration2 = await prisma.tb_peserta_kompetisi.findFirst({
      where: {
        id_atlet: data.atlitId2,
        id_kelas_kejuaraan: data.kelasKejuaraanId
      }
    });

    if (existingRegistration2) {
      throw new Error('Atlet kedua sudah terdaftar pada kelas kejuaraan ini');
    }
  }

  // Register both athletes in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Register first athlete
    const peserta1 = await tx.tb_peserta_kompetisi.create({
      data: {
        id_atlet: data.atlitId,
        id_kelas_kejuaraan: data.kelasKejuaraanId,
        status: StatusPendaftaran.PENDING,
      }
    });

    // Register second athlete if exists
    let peserta2: typeof peserta1 | undefined = undefined;
    if (data.atlitId2) {
      peserta2 = await tx.tb_peserta_kompetisi.create({
        data: {
          id_atlet: data.atlitId2,
          id_kelas_kejuaraan: data.kelasKejuaraanId,
          status: StatusPendaftaran.PENDING,
        }
      });
    }

    return { peserta1, peserta2 };
  });

  return result;
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
