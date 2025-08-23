import { PrismaClient, JenisKelamin } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAtletData {
  nama_atlet: string;
  tanggal_lahir: Date;
  berat_badan: number;
  tinggi_badan: number;
  jenis_kelamin: JenisKelamin;
  id_dojang: number;
  id_pelatih_pembuat: number;
  akte_kelahiran: string;
  pas_foto: string;
  sertifikat_belt: string;
  ktp?: string;
}

interface UpdateAtletData extends Partial<CreateAtletData> {
  id_atlet: number;
}

interface AtletFilter {
  page?: number;
  limit?: number;
  search?: string;
  id_dojang?: number;
  jenis_kelamin?: JenisKelamin;
  min_age?: number;
  max_age?: number;
  min_weight?: number;
  max_weight?: number;
}

export class AtletService {
  // Create new atlet
  static async createAtlet(data: CreateAtletData) {
    try {
      // Validate dojang exists
      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang: data.id_dojang }
      });

      if (!dojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      // Validate pelatih exists
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: data.id_pelatih_pembuat }
      });

      if (!pelatih) {
        throw new Error('Pelatih tidak ditemukan');
      }

      // Calculate age
      const today = new Date();
      const birthDate = new Date(data.tanggal_lahir);
      const age = today.getFullYear() - birthDate.getFullYear() - 
                  (today.getMonth() < birthDate.getMonth() || 
                   (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      // Validate age (minimum 5 years old)
      if (age < 5) {
        throw new Error('Atlet minimal berusia 5 tahun');
      }

      // Create atlet
      const atlet = await prisma.tb_atlet.create({
        data,
        include: {
          dojang: {
            select: {
              id_dojang: true,
              nama_dojang: true,
              kota: true
            }
          },
          pelatih_pembuat: {
            select: {
              id_pelatih: true,
              nama_pelatih: true
            }
          }
        }
      });

      return atlet;
    } catch (error) {
      throw error;
    }
  }

  // Get all atlet with filters and pagination
  static async getAllAtlet(filters: AtletFilter = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        id_dojang,
        jenis_kelamin,
        min_age,
        max_age,
        min_weight,
        max_weight
      } = filters;

      const offset = (page - 1) * limit;

      // Build where condition
      const whereCondition: any = {};

      if (search) {
        whereCondition.nama_atlet = { contains: search };
      }

      if (id_dojang) {
        whereCondition.id_dojang = id_dojang;
      }

      if (jenis_kelamin) {
        whereCondition.jenis_kelamin = jenis_kelamin;
      }

      if (min_weight || max_weight) {
        whereCondition.berat_badan = {};
        if (min_weight) whereCondition.berat_badan.gte = min_weight;
        if (max_weight) whereCondition.berat_badan.lte = max_weight;
      }

      // Age filter (requires date calculation)
      if (min_age || max_age) {
        const today = new Date();
        if (max_age) {
          const minBirthDate = new Date(today.getFullYear() - max_age, today.getMonth(), today.getDate());
          whereCondition.tanggal_lahir = { gte: minBirthDate };
        }
        if (min_age) {
          const maxBirthDate = new Date(today.getFullYear() - min_age, today.getMonth(), today.getDate());
          if (whereCondition.tanggal_lahir) {
            whereCondition.tanggal_lahir.lte = maxBirthDate;
          } else {
            whereCondition.tanggal_lahir = { lte: maxBirthDate };
          }
        }
      }

      const [atletList, total] = await Promise.all([
        prisma.tb_atlet.findMany({
          where: whereCondition,
          skip: offset,
          take: limit,
          include: {
            dojang: {
              select: {
                id_dojang: true,
                nama_dojang: true,
                kota: true,
                provinsi: true
              }
            },
            pelatih_pembuat: {
              select: {
                id_pelatih: true,
                nama_pelatih: true
              }
            },
            _count: {
              select: {
                peserta_kompetisi: true
              }
            }
          },
          orderBy: { nama_atlet: 'asc' }
        }),
        prisma.tb_atlet.count({ where: whereCondition })
      ]);

      // Add calculated age to each athlete
      const atletWithAge = atletList.map(atlet => {
        const today = new Date();
        const birthDate = new Date(atlet.tanggal_lahir);
        const age = today.getFullYear() - birthDate.getFullYear() - 
                    (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        return {
          ...atlet,
          age
        };
      });

      return {
        data: atletWithAge,
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

  // Get atlet by ID
  static async getAtletById(id: number) {
    try {
      const atlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet: id },
        include: {
          dojang: {
            select: {
              id_dojang: true,
              nama_dojang: true,
              kota: true,
              provinsi: true,
              founder: true
            }
          },
          pelatih_pembuat: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              no_telp: true
            }
          },
          peserta_kompetisi: {
            include: {
              kelas_kejuaraan: {
                include: {
                  kompetisi: {
                    select: {
                      id_kompetisi: true,
                      nama_event: true,
                      tanggal_mulai: true,
                      tanggal_selesai: true,
                      status: true
                    }
                  },
                  kategori_event: {
                    select: {
                      nama_kategori: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!atlet) {
        throw new Error('Atlet tidak ditemukan');
      }

      // Calculate age
      const today = new Date();
      const birthDate = new Date(atlet.tanggal_lahir);
      const age = today.getFullYear() - birthDate.getFullYear() - 
                  (today.getMonth() < birthDate.getMonth() || 
                   (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      return {
        ...atlet,
        age
      };
    } catch (error) {
      throw error;
    }
  }

  // Update atlet
  static async updateAtlet(data: UpdateAtletData) {
    try {
      const { id_atlet, ...updateData } = data;

      // Check if atlet exists
      const existingAtlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet }
      });

      if (!existingAtlet) {
        throw new Error('Atlet tidak ditemukan');
      }

      // Validate dojang if being updated
      if (updateData.id_dojang) {
        const dojang = await prisma.tb_dojang.findUnique({
          where: { id_dojang: updateData.id_dojang }
        });

        if (!dojang) {
          throw new Error('Dojang tidak ditemukan');
        }
      }

      // Validate pelatih if being updated
      if (updateData.id_pelatih_pembuat) {
        const pelatih = await prisma.tb_pelatih.findUnique({
          where: { id_pelatih: updateData.id_pelatih_pembuat }
        });

        if (!pelatih) {
          throw new Error('Pelatih tidak ditemukan');
        }
      }

      // Validate age if birth date is being updated
      if (updateData.tanggal_lahir) {
        const today = new Date();
        const birthDate = new Date(updateData.tanggal_lahir);
        const age = today.getFullYear() - birthDate.getFullYear() - 
                    (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        if (age < 5) {
          throw new Error('Atlet minimal berusia 5 tahun');
        }
      }

      const updatedAtlet = await prisma.tb_atlet.update({
        where: { id_atlet },
        data: updateData,
        include: {
          dojang: {
            select: {
              id_dojang: true,
              nama_dojang: true,
              kota: true
            }
          },
          pelatih_pembuat: {
            select: {
              id_pelatih: true,
              nama_pelatih: true
            }
          }
        }
      });

      return updatedAtlet;
    } catch (error) {
      throw error;
    }
  }

  // Delete atlet
  static async deleteAtlet(id: number) {
    try {
      // Check if atlet exists
      const existingAtlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet: id },
        include: {
          _count: {
            select: {
              peserta_kompetisi: true
            }
          }
        }
      });

      if (!existingAtlet) {
        throw new Error('Atlet tidak ditemukan');
      }

      // Check if atlet is registered in any competition
      if (existingAtlet._count.peserta_kompetisi > 0) {
        throw new Error('Tidak dapat menghapus atlet yang sudah terdaftar dalam kompetisi');
      }

      await prisma.tb_atlet.delete({
        where: { id_atlet: id }
      });

      return { message: 'Atlet berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }

  // Get atlet by dojang
  static async getAtletByDojang(id_dojang: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [atletList, total] = await Promise.all([
        prisma.tb_atlet.findMany({
          where: { id_dojang },
          skip: offset,
          take: limit,
          include: {
            pelatih_pembuat: {
              select: {
                id_pelatih: true,
                nama_pelatih: true
              }
            },
            _count: {
              select: {
                peserta_kompetisi: true
              }
            }
          },
          orderBy: { nama_atlet: 'asc' }
        }),
        prisma.tb_atlet.count({ where: { id_dojang } })
      ]);

      // Add calculated age
      const atletWithAge = atletList.map(atlet => {
        const today = new Date();
        const birthDate = new Date(atlet.tanggal_lahir);
        const age = today.getFullYear() - birthDate.getFullYear() - 
                    (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        return {
          ...atlet,
          age
        };
      });

      return {
        data: atletWithAge,
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

  // Get eligible atlet for competition class
  static async getEligibleAtlet(id_kelas_kejuaraan: number) {
    try {
      // Get class details
      const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan },
        include: {
          kelompok: true,
          kelas_berat: true,
          poomsae: true
        }
      });

      if (!kelasKejuaraan) {
        throw new Error('Kelas kejuaraan tidak ditemukan');
      }

      // Build eligibility criteria
      const whereCondition: any = {};

      // Age criteria
      if (kelasKejuaraan.kelompok) {
        const today = new Date();
        const minBirthDate = new Date(today.getFullYear() - kelasKejuaraan.kelompok.usia_max, today.getMonth(), today.getDate());
        const maxBirthDate = new Date(today.getFullYear() - kelasKejuaraan.kelompok.usia_min, today.getMonth(), today.getDate());
        
        whereCondition.tanggal_lahir = {
          gte: minBirthDate,
          lte: maxBirthDate
        };
      }

      // Weight criteria
      if (kelasKejuaraan.kelas_berat) {
        whereCondition.berat_badan = {
          gte: kelasKejuaraan.kelas_berat.batas_min,
          lte: kelasKejuaraan.kelas_berat.batas_max
        };
        whereCondition.jenis_kelamin = kelasKejuaraan.kelas_berat.gender;
      }

      // Exclude already registered athletes
      whereCondition.peserta_kompetisi = {
        none: {
          id_kelas_kejuaraan
        }
      };

      const eligibleAtlet = await prisma.tb_atlet.findMany({
        where: whereCondition,
        include: {
          dojang: {
            select: {
              nama_dojang: true,
              kota: true
            }
          }
        },
        orderBy: { nama_atlet: 'asc' }
      });

      // Add calculated age
      const atletWithAge = eligibleAtlet.map(atlet => {
        const today = new Date();
        const birthDate = new Date(atlet.tanggal_lahir);
        const age = today.getFullYear() - birthDate.getFullYear() - 
                    (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        return {
          ...atlet,
          age
        };
      });

      return atletWithAge;
    } catch (error) {
      throw error;
    }
  }

  // Get atlet statistics
  static async getAtletStats() {
    try {
      const [totalAtlet, maleCount, femaleCount, registeredInCompetition] = await Promise.all([
        prisma.tb_atlet.count(),
        prisma.tb_atlet.count({ where: { jenis_kelamin: 'L' } }),
        prisma.tb_atlet.count({ where: { jenis_kelamin: 'P' } }),
        prisma.tb_atlet.count({
          where: {
            peserta_kompetisi: {
              some: {}
            }
          }
        })
      ]);

      // Age group distribution
      const allAtlet = await prisma.tb_atlet.findMany({
        select: {
          tanggal_lahir: true
        }
      });

      const ageGroups = {
        '5-8': 0,
        '9-12': 0,
        '13-16': 0,
        '17-20': 0,
        '21+': 0
      };

      const today = new Date();
      allAtlet.forEach(atlet => {
        const birthDate = new Date(atlet.tanggal_lahir);
        const age = today.getFullYear() - birthDate.getFullYear() - 
                    (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

        if (age >= 5 && age <= 8) ageGroups['5-8']++;
        else if (age >= 9 && age <= 12) ageGroups['9-12']++;
        else if (age >= 13 && age <= 16) ageGroups['13-16']++;
        else if (age >= 17 && age <= 20) ageGroups['17-20']++;
        else if (age >= 21) ageGroups['21+']++;
      });

      return {
        totalAtlet,
        genderDistribution: {
          male: maleCount,
          female: femaleCount
        },
        registeredInCompetition,
        notRegisteredInCompetition: totalAtlet - registeredInCompetition,
        ageGroupDistribution: ageGroups
      };
    } catch (error) {
      throw error;
    }
  }
}