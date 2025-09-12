import { PrismaClient, StatusKompetisi, StatusPendaftaran } from '@prisma/client';

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

type RegistrationResult = {
  peserta1: {
    id_atlet: number | null;
    status: StatusPendaftaran;
    id_peserta_kompetisi: number;
    id_kelas_kejuaraan: number;
    is_team: boolean;
  };
  peserta2?: {
    id_atlet: number | null;
    status: StatusPendaftaran;
    id_peserta_kompetisi: number;
    id_kelas_kejuaraan: number;
    is_team: boolean;
  };
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
  kelasKejuaraanId: number;
  atlitId: number;
  atlitId2?: number;
  isTeam?: boolean; // true jika tim Poomsae
}): Promise<any> {
  return prisma.$transaction(async (tx) => {
    if (data.isTeam) {
      // Buat satu peserta kompetisi untuk tim
      const pesertaTim = await tx.tb_peserta_kompetisi.create({
        data: {
          id_kelas_kejuaraan: data.kelasKejuaraanId,
          is_team: true,
          status: StatusPendaftaran.PENDING,
        }
      });

      // Masukkan atlet ke anggota tim
      const atletIds = [data.atlitId, data.atlitId2].filter(Boolean) as number[];
      await tx.tb_peserta_tim.createMany({
        data: atletIds.map(id => ({
          id_peserta_kompetisi: pesertaTim.id_peserta_kompetisi,
          id_atlet: id,
        }))
      });

      return { pesertaTim, anggota: atletIds };
    } else {
      // Individu biasa
      const peserta = await tx.tb_peserta_kompetisi.create({
        data: {
          id_kelas_kejuaraan: data.kelasKejuaraanId,
          id_atlet: data.atlitId,
          status: StatusPendaftaran.PENDING,
        }
      });
      return { peserta };
    }
  });
}


static async getAtletsByKompetisi(
  kompetisiId: number, 
  page: number, 
  limit: number, 
  idDojang?: number // <-- tambahkan optional filter
) {
  const skip = (page - 1) * limit;

  const peserta = await prisma.tb_peserta_kompetisi.findMany({
  where: {
    kelas_kejuaraan: {
      id_kompetisi: kompetisiId,
    },
    ...(idDojang && {
      OR: [
        // Individu
        {
          AND: [
            { is_team: false },
            { atlet: { id_dojang: idDojang } }
          ]
        },
        // Tim (semua anggota harus dari dojang yg sama)
        {
          AND: [
            { is_team: true },
            { anggota_tim: { every: { atlet: { id_dojang: idDojang } } } }
          ]
        }
      ]
    })
  },
  include: {
    atlet: { include: { dojang: true } },   // <-- tetap include meski null kalau tim
    anggota_tim: {
      include: {
        atlet: { include: { dojang: true } }, // <-- nama atlet tim ada di sini
      },
    },
    kelas_kejuaraan: {
      include: {
        kategori_event: true,
        kelompok: true,
        kelas_berat: true,
        poomsae: true,
      },
    },
  },
  skip,
  take: limit,
});


  const total = await prisma.tb_peserta_kompetisi.count({
    where: {
      kelas_kejuaraan: {
        id_kompetisi: kompetisiId,
      },
      ...(idDojang ? {
        OR: [
          { atlet: { id_dojang: idDojang } },
          { anggota_tim: { some: { atlet: { id_dojang: idDojang } } } }
        ]
      } : {})
    },
  });

  return { peserta, total };
}

static async updateRegistrationStatus(
    kompetisiId: number,
    participantId: number,
    status: StatusPendaftaran
  ) {
    // cek kompetisi
    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi: kompetisiId },
    });
    if (!kompetisi) {
      throw new Error("Kompetisi tidak ditemukan");
    }

    // cek peserta
    const peserta = await prisma.tb_peserta_kompetisi.findUnique({
      where: { id_peserta_kompetisi: participantId },
    });
    if (!peserta) {
      throw new Error("Peserta kompetisi tidak ditemukan");
    }

    // update status
    return prisma.tb_peserta_kompetisi.update({
      where: { id_peserta_kompetisi: participantId },
      data: { status },
    });
  }

  static async deleteParticipant(kompetisiId: number, participantId: number) {
    try {
      // Cek apakah peserta exist di kompetisi
      const existingPeserta = await prisma.tb_peserta_kompetisi.findFirst({
        where: {
          id_peserta_kompetisi: participantId,
          kelas_kejuaraan: {
            kompetisi: {
              id_kompetisi: kompetisiId
            }
          }
        },
        include: {
          atlit: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              dojang: {
                select: {
                  nama_dojang: true
                }
              }
            }
          },
          atlit2: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              dojang: {
                select: {
                  nama_dojang: true
                }
              }
            }
          },
          kelas_kejuaraan: {
            select: {
              id_kelas_kejuaraan: true,
              nama_kelas: true,
              cabang: true,
              kompetisi: {
                select: {
                  id_kompetisi: true,
                  nama_kompetisi: true,
                  status: true,
                  tanggal_mulai: true,
                  tanggal_selesai: true
                }
              }
            }
          }
        }
      });

      if (!existingPeserta) {
        throw new Error('Peserta tidak ditemukan dalam kompetisi ini');
      }

      // Validasi status kompetisi
      const kompetisi = existingPeserta.kelas_kejuaraan.kompetisi;
      if (kompetisi.status === 'AKTIF' || kompetisi.status === 'SELESAI') {
        throw new Error('Tidak dapat menghapus peserta dari kompetisi yang sudah aktif atau selesai');
      }

      // Cek apakah ada pertandingan yang sudah terjadwal untuk peserta ini
      const existingMatches = await prisma.tb_pertandingan.findMany({
        where: {
          OR: [
            { id_peserta1: participantId },
            { id_peserta2: participantId }
          ]
        },
        select: {
          id_pertandingan: true,
          status: true
        }
      });

      if (existingMatches.length > 0) {
        const activeMatches = existingMatches.filter(match => 
          match.status !== 'CANCELLED' && match.status !== 'PENDING'
        );
        
        if (activeMatches.length > 0) {
          throw new Error('Tidak dapat menghapus peserta yang sudah memiliki pertandingan aktif');
        }

        // Hapus atau batalkan pertandingan yang masih PENDING
        await prisma.tb_pertandingan.updateMany({
          where: {
            OR: [
              { id_peserta1: participantId },
              { id_peserta2: participantId }
            ],
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      // Mulai transaction untuk menghapus peserta
      const result = await prisma.$transaction(async (tx) => {
        // Hapus peserta dari kompetisi
        const deletedPeserta = await tx.tb_peserta_kejuaraan.delete({
          where: {
            id_peserta_kejuaraan: participantId
          },
          include: {
            atlit: {
              select: {
                nama_atlet: true
              }
            },
            atlit2: {
              select: {
                nama_atlet: true
              }
            }
          }
        });

        return {
          deletedPeserta,
          cancelledMatches: existingMatches.length,
          kompetisi: {
            id: kompetisi.id_kompetisi,
            nama: kompetisi.nama_kompetisi,
            status: kompetisi.status
          }
        };
      });

      // Format response data
      const pesertaName = existingPeserta.atlit2 
        ? `Tim ${existingPeserta.atlit.nama_atlet} & ${existingPeserta.atlit2.nama_atlet}`
        : existingPeserta.atlit.nama_atlet;

      return {
        success: true,
        data: {
          id_peserta_kejuaraan: participantId,
          peserta_name: pesertaName,
          kelas: existingPeserta.kelas_kejuaraan.nama_kelas,
          cabang: existingPeserta.kelas_kejuaraan.cabang,
          is_team: !!existingPeserta.atlit2,
          cancelled_matches: result.cancelledMatches,
          kompetisi: result.kompetisi
        },
        message: `${pesertaName} berhasil dihapus dari kelas ${existingPeserta.kelas_kejuaraan.nama_kelas}`
      };

    } catch (error: any) {
      console.error('Service - Error deleting participant:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        throw new Error('Peserta tidak ditemukan');
      }
      
      if (error.code === 'P2003') {
        throw new Error('Tidak dapat menghapus peserta karena masih terhubung dengan data lain');
      }

      throw new Error(error.message || 'Gagal menghapus peserta dari kompetisi');
    }
  }

}
