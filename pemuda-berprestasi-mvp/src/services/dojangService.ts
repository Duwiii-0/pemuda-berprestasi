import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateDojangData {
  nama_dojang: string;
  email?: string;
  no_telp?: string;
  founder?: string;
  negara?: string;
  provinsi?: string;
  kota?: string;
  id_pelatih_pendaftar: number;
}

interface UpdateDojangData extends Partial<CreateDojangData> {
  id_dojang: number;
}

export class DojangService {
  // Create new dojang
  static async createDojang(data: CreateDojangData) {
    try {
      // Check if pelatih exists
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: data.id_pelatih_pendaftar }
      });

      if (!pelatih) {
        throw new Error('Pelatih tidak ditemukan');
      }

      // Check if email is unique (if provided)
      if (data.email) {
        const existingDojang = await prisma.tb_dojang.findFirst({
          where: { email: data.email }
        });

        if (existingDojang) {
          throw new Error('Email dojang sudah terdaftar');
        }
      }

      const dojang = await prisma.tb_dojang.create({
        data,
        include: {
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true
            }
          },
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              jenis_kelamin: true
            }
          }
        }
      });

      return dojang;
    } catch (error) {
      throw error;
    }
  }

  // Get all dojang with pagination
  static async getAllDojang(page: number = 1, limit: number = 10, search?: string) {
    try {
      const offset = (page - 1) * limit;

      const whereCondition = search ? {
        OR: [
          { nama_dojang: { contains: search } },
          { founder: { contains: search } },
          { kota: { contains: search } },
          { provinsi: { contains: search } }
        ]
      } : {};

      const [dojangList, total] = await Promise.all([
        prisma.tb_dojang.findMany({
          where: whereCondition,
          skip: offset,
          take: limit,
          include: {
            pelatih_pendaftar: {
              select: {
                id_pelatih: true,
                nama_pelatih: true,
                no_telp: true
              }
            },
            atlet: {
              select: {
                id_atlet: true,
                nama_atlet: true,
                jenis_kelamin: true
              }
            },
            _count: {
              select: {
                atlet: true
              }
            }
          },
          orderBy: { id_dojang: 'desc' }
        }),
        prisma.tb_dojang.count({ where: whereCondition })
      ]);

      return {
        data: dojangList,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get dojang by ID
  static async getDojangById(id: number) {
    try {
      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang: id },
        include: {
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true,
              foto_ktp: true,
              sertifikat_sabuk: true
            }
          },
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              tanggal_lahir: true,
              jenis_kelamin: true,
              berat_badan: true,
              tinggi_badan: true
            },
            orderBy: { nama_atlet: 'asc' }
          }
        }
      });

      if (!dojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      return dojang;
    } catch (error) {
      throw error;
    }
  }

  // Update dojang
  static async updateDojang(data: UpdateDojangData) {
    try {
      const { id_dojang, ...updateData } = data;

      // Check if dojang exists
      const existingDojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang }
      });

      if (!existingDojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingDojang.email) {
        const emailExists = await prisma.tb_dojang.findFirst({
          where: { 
            email: updateData.email,
            NOT: { id_dojang }
          }
        });

        if (emailExists) {
          throw new Error('Email dojang sudah terdaftar');
        }
      }

      // Check if new pelatih exists (if being updated)
      if (updateData.id_pelatih_pendaftar) {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: updateData.id_pelatih_pendaftar }
        });

        if (!pelatih) {
          throw new Error('Pelatih tidak ditemukan');
        }
      }

      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang },
        data: updateData,
        include: {
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true
            }
          },
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              jenis_kelamin: true
            }
          }
        }
      });

      return updatedDojang;
    } catch (error) {
      throw error;
    }
  }

  // Delete dojang
  static async deleteDojang(id: number) {
    try {
      // Check if dojang exists
      const existingDojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang: id },
        include: {
          _count: {
            select: {
              atlet: true
            }
          }
        }
      });

      if (!existingDojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      // Check if dojang has athletes
      if (existingDojang._count.atlet > 0) {
        throw new Error('Tidak dapat menghapus dojang yang masih memiliki atlet');
      }

      await prisma.tb_dojang.delete({
        where: { id_dojang: id }
      });

      return { message: 'Dojang berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }

  // Get dojang by pelatih
  static async getDojangByPelatih(id_pelatih: number) {
    try {
      const dojangList = await prisma.tb_dojang.findMany({
        where: { id_pelatih_pendaftar: id_pelatih },
        include: {
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              jenis_kelamin: true
            }
          },
          _count: {
            select: {
              atlet: true
            }
          }
        },
        orderBy: { nama_dojang: 'asc' }
      });

      return dojangList;
    } catch (error) {
      throw error;
    }
  }

  // Get dojang statistics
  static async getDojangStats() {
    try {
      const [totalDojang, dojangWithAtlet, totalAtlet] = await Promise.all([
        prisma.tb_dojang.count(),
        prisma.tb_dojang.count({
          where: {
            atlet: {
              some: {}
            }
          }
        }),
        prisma.tb_atlet.count()
      ]);

      // Get top dojang by athlete count
      const topDojang = await prisma.tb_dojang.findMany({
        include: {
          _count: {
            select: {
              atlet: true
            }
          }
        },
        orderBy: {
          atlet: {
            _count: 'desc'
          }
        },
        take: 5
      });

      return {
        totalDojang,
        dojangWithAtlet,
        dojangWithoutAtlet: totalDojang - dojangWithAtlet,
        totalAtlet,
        averageAtletPerDojang: totalDojang > 0 ? Math.round(totalAtlet / totalDojang * 100) / 100 : 0,
        topDojang: topDojang.map(dojang => ({
          nama_dojang: dojang.nama_dojang,
          jumlah_atlet: dojang._count.atlet,
          kota: dojang.kota,
          founder: dojang.founder
        }))
      };
    } catch (error) {
      throw error;
    }
  }
}