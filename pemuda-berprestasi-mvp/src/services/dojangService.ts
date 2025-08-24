import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateDojangData {
  nama_dojang: string;
  email?: string;
  no_telp?: string | null;
  founder?: string;
  negara?: string;
  provinsi?: string;
  kota?: string;
  id_pelatih_pendaftar?: number | null; // Ubah jadi optional untuk public registration
}

interface UpdateDojangData extends Partial<CreateDojangData> {
  id_dojang: number;
}

export class DojangService {
  // Create new dojang - support public registration
  static async createDojang(data: CreateDojangData) {
    try {
      // Check if nama dojang already exists
      const existingDojang = await prisma.tb_dojang.findFirst({
        where: { 
          nama_dojang: {
            contains: data.nama_dojang
          }
        }
      });

      if (existingDojang) {
        throw new Error('Nama dojang sudah terdaftar');
      }

      // Check if pelatih exists (hanya jika ada id_pelatih_pendaftar)
      if (data.id_pelatih_pendaftar) {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: data.id_pelatih_pendaftar }
        });

        if (!pelatih) {
          throw new Error('Pelatih tidak ditemukan');
        }
      }

      // Check if email is unique (if provided)
      if (data.email) {
        const existingEmail = await prisma.tb_dojang.findFirst({
          where: { 
            email: {
              equals: data.email
            }
          }
        });

        if (existingEmail) {
          throw new Error('Email dojang sudah terdaftar');
        }
      }

      // Prepare data for creation
      const createData: any = {
        nama_dojang: data.nama_dojang,
        email: data.email || null,
        no_telp: data.no_telp || null,
        founder: data.founder || null,
        negara: data.negara || null,
        provinsi: data.provinsi || null,
        kota: data.kota || null
      };

      // Only add id_pelatih_pendaftar if it's provided
      if (data.id_pelatih_pendaftar) {
        createData.id_pelatih_pendaftar = data.id_pelatih_pendaftar;
      }

      // Create dojang with status default from schema
      const dojang = await prisma.tb_dojang.create({
        data: createData,
        include: {
          pelatih_pendaftar: data.id_pelatih_pendaftar ? {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true
            }
          } : false,
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

  // Get pending dojangs (untuk admin approval)
  static async getPendingDojangs(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [dojangList, total] = await Promise.all([
        prisma.tb_dojang.findMany({
          where: {
            status: 'PENDING_APPROVAL'
          },
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
            _count: {
              select: {
                atlet: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.tb_dojang.count({
          where: {
            status: 'PENDING_APPROVAL'
          }
        })
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

  // Approve dojang
  static async approveDojang(id_dojang: number, id_pelatih_pendaftar: number) {
    try {
      // Check if dojang exists
      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang }
      });

      if (!dojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      // Check if pelatih exists
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: id_pelatih_pendaftar }
      });

      if (!pelatih) {
        throw new Error('Pelatih tidak ditemukan');
      }

      // Update dojang
      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang },
        data: {
          id_pelatih_pendaftar,
          status: 'ACTIVE'
        },
        include: {
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true
            }
          }
        }
      });

      return updatedDojang;
    } catch (error) {
      throw error;
    }
  }

  // Reject dojang
  static async rejectDojang(id_dojang: number, reason?: string) {
    try {
      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang }
      });

      if (!dojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang },
        data: {
          status: 'REJECTED'
        }
      });

      // TODO: Send notification to dojang about rejection
      // You might want to store the reason in a separate table or field

      return updatedDojang;
    } catch (error) {
      throw error;
    }
  }

  // Check name availability
  static async checkNameAvailability(nama_dojang: string): Promise<boolean> {
    try {
      const existingDojang = await prisma.tb_dojang.findFirst({
        where: {
          nama_dojang: {
            contains: nama_dojang.trim()
          }
        }
      });

      return !existingDojang; // Return true if available (no existing dojang found)
    } catch (error) {
      throw error;
    }
  }

  // Get all dojang with pagination
  static async getAllDojang(page: number = 1, limit: number = 10, search?: string) {
    try {
      const offset = (page - 1) * limit;

      const whereCondition = search ? {
        AND: [
          {
            OR: [
              { nama_dojang: { contains: search } },
              { founder: { contains: search } },
              { kota: { contains: search } },
              { provinsi: { contains: search } }
            ]
          },
          {
            status: 'ACTIVE' as const // Hanya tampilkan dojang yang sudah aktif
          }
        ]
      } : {
        status: 'ACTIVE' as const
      };

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
            email: {
              equals: updateData.email
            },
            NOT: { id_dojang }
          }
        });

        if (emailExists) {
          throw new Error('Email dojang sudah terdaftar');
        }
      }

      // Check nama_dojang uniqueness if being updated
      if (updateData.nama_dojang && updateData.nama_dojang !== existingDojang.nama_dojang) {
        const nameExists = await prisma.tb_dojang.findFirst({
          where: { 
            nama_dojang: {
              contains: updateData.nama_dojang
            },
            NOT: { id_dojang }
          }
        });

        if (nameExists) {
          throw new Error('Nama dojang sudah terdaftar');
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

      // Prepare clean update data
      const cleanUpdateData: any = {};
      
      if (updateData.nama_dojang !== undefined) cleanUpdateData.nama_dojang = updateData.nama_dojang;
      if (updateData.email !== undefined) cleanUpdateData.email = updateData.email || null;
      if (updateData.no_telp !== undefined) cleanUpdateData.no_telp = updateData.no_telp || null;
      if (updateData.founder !== undefined) cleanUpdateData.founder = updateData.founder || null;
      if (updateData.negara !== undefined) cleanUpdateData.negara = updateData.negara || null;
      if (updateData.provinsi !== undefined) cleanUpdateData.provinsi = updateData.provinsi || null;
      if (updateData.kota !== undefined) cleanUpdateData.kota = updateData.kota || null;
      
      // Handle pelatih assignment carefully
      if (updateData.id_pelatih_pendaftar !== undefined) {
        if (updateData.id_pelatih_pendaftar === null) {
          // Set to null directly
          cleanUpdateData.id_pelatih_pendaftar = null;
        } else {
          // Set the pelatih ID
          cleanUpdateData.id_pelatih_pendaftar = updateData.id_pelatih_pendaftar;
        }
      }

      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang },
        data: cleanUpdateData,
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
        where: { 
          id_pelatih_pendaftar: id_pelatih,
          status: 'ACTIVE' as const
        },
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
      const [
        totalDojang, 
        activeDojang, 
        pendingDojang, 
        rejectedDojang,
        inactiveDojang,
        dojangWithAtlet, 
        totalAtlet
      ] = await Promise.all([
        prisma.tb_dojang.count(),
        prisma.tb_dojang.count({ where: { status: 'ACTIVE' } }),
        prisma.tb_dojang.count({ where: { status: 'PENDING_APPROVAL' } }),
        prisma.tb_dojang.count({ where: { status: 'REJECTED' } }),
        prisma.tb_dojang.count({ where: { status: 'INACTIVE' } }),
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
        where: { status: 'ACTIVE' },
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
        activeDojang,
        pendingDojang,
        rejectedDojang,
        inactiveDojang,
        dojangWithAtlet,
        dojangWithoutAtlet: totalDojang - dojangWithAtlet,
        totalAtlet,
        averageAtletPerDojang: totalDojang > 0 ? Math.round(totalAtlet / totalDojang * 100) / 100 : 0,
        topDojang: topDojang.map(dojang => ({
          nama_dojang: dojang.nama_dojang,
          jumlah_atlet: dojang._count.atlet,
          kota: dojang.kota,
          founder: dojang.founder,
          status: dojang.status
        }))
      };
    } catch (error) {
      throw error;
    }
  }
}