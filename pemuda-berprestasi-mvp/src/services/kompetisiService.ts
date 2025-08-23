import { PrismaClient, TypeKompetisi, StatusKompetisi, Cabang, StatusPendaftaran } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateKompetisiData {
  id_penyelenggara: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  type_kompetisi: TypeKompetisi;
  status?: StatusKompetisi;
  venues?: CreateVenueData[];
}

interface CreateVenueData {
  nama_venue: string;
  lokasi?: string;
}

interface CreateKelasKejuaraanData {
  id_kategori_event: number;
  id_kelompok?: number;
  id_kelas_berat?: number;
  id_poomsae?: number;
  cabang: Cabang;
}

interface UpdateKompetisiData extends Partial<CreateKompetisiData> {
  id_kompetisi: number;
}

interface KompetisiFilter {
  page?: number;
  limit?: number;
  search?: string;
  type_kompetisi?: TypeKompetisi;
  status?: StatusKompetisi;
  start_date?: Date;
  end_date?: Date;
}

interface RegisterAtletData {
  id_atlet: number;
  id_kelas_kejuaraan: number;
}

export class KompetisiService {
  // Create new kompetisi
  static async createKompetisi(data: CreateKompetisiData) {
    try {
      // Validate penyelenggara exists
      const penyelenggara = await prisma.tb_penyelenggara.findUnique({
        where: { id_penyelenggara: data.id_penyelenggara }
      });

      if (!penyelenggara) {
        throw new Error('Penyelenggara tidak ditemukan');
      }

      // Validate dates
      if (new Date(data.tanggal_mulai) >= new Date(data.tanggal_selesai)) {
        throw new Error('Tanggal mulai harus sebelum tanggal selesai');
      }

      if (new Date(data.tanggal_mulai) <= new Date()) {
        throw new Error('Tanggal mulai harus di masa depan');
      }

      const { venues, ...kompetisiData } = data;

      // Create kompetisi with venues
      const kompetisi = await prisma.tb_kompetisi.create({
        data: {
          ...kompetisiData,
          status: data.status || StatusKompetisi.DRAFT,
          venue: venues ? {
            create: venues
          } : undefined
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
          venue: true,
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      return kompetisi;
    } catch (error) {
      throw error;
    }
  }

  // Get all kompetisi with filters
  static async getAllKompetisi(filters: KompetisiFilter = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        type_kompetisi,
        status,
        start_date,
        end_date
      } = filters;

      const offset = (page - 1) * limit;

      // Build where condition
      const whereCondition: any = {};

      if (search) {
        whereCondition.OR = [
          { nama_event: { contains: search } },
          { penyelenggara: { nama_penyelenggara: { contains: search } } }
        ];
      }

      if (type_kompetisi) {
        whereCondition.type_kompetisi = type_kompetisi;
      }

      if (status) {
        whereCondition.status = status;
      }

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
            penyelenggara: {
              select: {
                nama_penyelenggara: true,
                email: true
              }
            },
            venue: {
              select: {
                nama_venue: true,
                lokasi: true
              }
            },
            _count: {
              select: {
                kelas_kejuaraan: true
              }
            }
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
    } catch (error) {
      throw error;
    }
  }

  // Get kompetisi by ID
  static async getKompetisiById(id: number) {
    try {
      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: id },
        include: {
          penyelenggara: true,
          venue: true,
          kelas_kejuaraan: {
            include: {
              kategori_event: true,
              kelompok: true,
              kelas_berat: true,
              poomsae: true,
              _count: {
                select: {
                  peserta_kompetisi: true
                }
              }
            }
          },
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      if (!kompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      return kompetisi;
    } catch (error) {
      throw error;
    }
  }

  // Update kompetisi
  static async updateKompetisi(data: UpdateKompetisiData) {
    try {
      const { id_kompetisi, venues, ...updateData } = data;

      // Check if kompetisi exists
      const existingKompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi },
        include: {
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      if (!existingKompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      // Check if kompetisi can be updated (not if already published with participants)
      if (existingKompetisi.status === StatusKompetisi.PUBLISHED && existingKompetisi._count.kelas_kejuaraan > 0) {
        const hasParticipants = await prisma.tb_peserta_kompetisi.count({
          where: {
            kelas_kejuaraan: {
              id_kompetisi
            }
          }
        });

        if (hasParticipants > 0) {
          throw new Error('Tidak dapat mengubah kompetisi yang sudah memiliki peserta');
        }
      }

      // Validate dates if being updated
      if (updateData.tanggal_mulai || updateData.tanggal_selesai) {
        const startDate = updateData.tanggal_mulai || existingKompetisi.tanggal_mulai;
        const endDate = updateData.tanggal_selesai || existingKompetisi.tanggal_selesai;

        if (new Date(startDate) >= new Date(endDate)) {
          throw new Error('Tanggal mulai harus sebelum tanggal selesai');
        }
      }

      // Validate penyelenggara if being updated
      if (updateData.id_penyelenggara) {
        const penyelenggara = await prisma.tb_penyelenggara.findUnique({
          where: { id_penyelenggara: updateData.id_penyelenggara }
        });

        if (!penyelenggara) {
          throw new Error('Penyelenggara tidak ditemukan');
        }
      }

      const updatedKompetisi = await prisma.tb_kompetisi.update({
        where: { id_kompetisi },
        data: updateData,
        include: {
          penyelenggara: true,
          venue: true,
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      return updatedKompetisi;
    } catch (error) {
      throw error;
    }
  }

  // Delete kompetisi
  static async deleteKompetisi(id: number) {
    try {
      // Check if kompetisi exists
      const existingKompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: id },
        include: {
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      if (!existingKompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      // Check if kompetisi has participants
      if (existingKompetisi._count.kelas_kejuaraan > 0) {
        const hasParticipants = await prisma.tb_peserta_kompetisi.count({
          where: {
            kelas_kejuaraan: {
              id_kompetisi: id
            }
          }
        });

        if (hasParticipants > 0) {
          throw new Error('Tidak dapat menghapus kompetisi yang sudah memiliki peserta');
        }
      }

      await prisma.tb_kompetisi.delete({
        where: { id_kompetisi: id }
      });

      return { message: 'Kompetisi berhasil dihapus' };
    } catch (error) {
      throw error;
    }
  }

  // Add kelas kejuaraan to kompetisi
  static async addKelasKejuaraan(id_kompetisi: number, kelasData: CreateKelasKejuaraanData[]) {
    try {
      // Check if kompetisi exists and is in DRAFT status
      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi }
      });

      if (!kompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      if (kompetisi.status !== StatusKompetisi.DRAFT) {
        throw new Error('Hanya dapat menambah kelas pada kompetisi dengan status DRAFT');
      }

      // Validate all kelas data
      for (const kelas of kelasData) {
        // Check kategori event exists
        const kategori = await prisma.tb_kategori_event.findUnique({
          where: { id_kategori_event: kelas.id_kategori_event }
        });

        if (!kategori) {
          throw new Error(`Kategori event dengan ID ${kelas.id_kategori_event} tidak ditemukan`);
        }

        // Validate based on cabang
        if (kelas.cabang === Cabang.KYORUGI) {
          if (!kelas.id_kelompok || !kelas.id_kelas_berat) {
            throw new Error('Kelas Kyorugi memerlukan kelompok usia dan kelas berat');
          }
        } else if (kelas.cabang === Cabang.POOMSAE) {
          if (!kelas.id_kelompok || !kelas.id_poomsae) {
            throw new Error('Kelas Poomsae memerlukan kelompok usia dan kelas poomsae');
          }
        }
      }

      // Create kelas kejuaraan
      const createdKelas = await prisma.tb_kelas_kejuaraan.createMany({
        data: kelasData.map(kelas => ({
          ...kelas,
          id_kompetisi
        }))
      });

      return {
        message: `${createdKelas.count} kelas kejuaraan berhasil ditambahkan`,
        count: createdKelas.count
      };
    } catch (error) {
      throw error;
    }
  }

  // Register atlet to kompetisi
  static async registerAtlet(data: RegisterAtletData) {
    try {
      const { id_atlet, id_kelas_kejuaraan } = data;

      // Check if atlet exists
      const atlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet },
        include: {
          dojang: true
        }
      });

      if (!atlet) {
        throw new Error('Atlet tidak ditemukan');
      }

      // Check if kelas kejuaraan exists
      const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan },
        include: {
          kompetisi: true,
          kelompok: true,
          kelas_berat: true,
          poomsae: true
        }
      });

      if (!kelasKejuaraan) {
        throw new Error('Kelas kejuaraan tidak ditemukan');
      }

      // Check if kompetisi is still accepting registrations
      if (kelasKejuaraan.kompetisi.status === StatusKompetisi.CLOSED) {
        throw new Error('Pendaftaran untuk kompetisi ini sudah ditutup');
      }

      // Check if atlet is already registered in this class
      const existingRegistration = await prisma.tb_peserta_kompetisi.findFirst({
        where: {
          id_atlet,
          id_kelas_kejuaraan
        }
      });

      if (existingRegistration) {
        throw new Error('Atlet sudah terdaftar di kelas ini');
      }

      // Check eligibility
      const today = new Date();
      const birthDate = new Date(atlet.tanggal_lahir);
      const age = today.getFullYear() - birthDate.getFullYear() - 
                  (today.getMonth() < birthDate.getMonth() || 
                   (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      // Age eligibility
      if (kelasKejuaraan.kelompok) {
        if (age < kelasKejuaraan.kelompok.usia_min || age > kelasKejuaraan.kelompok.usia_max) {
          throw new Error(`Atlet tidak memenuhi kriteria usia (${kelasKejuaraan.kelompok.usia_min}-${kelasKejuaraan.kelompok.usia_max} tahun)`);
        }
      }

      // Weight and gender eligibility for Kyorugi
      if (kelasKejuaraan.kelas_berat) {
        if (atlet.jenis_kelamin !== kelasKejuaraan.kelas_berat.gender) {
          throw new Error('Jenis kelamin atlet tidak sesuai dengan kelas');
        }

        if (atlet.berat_badan < kelasKejuaraan.kelas_berat.batas_min || 
            atlet.berat_badan > kelasKejuaraan.kelas_berat.batas_max) {
          throw new Error(`Berat badan atlet tidak memenuhi kriteria (${kelasKejuaraan.kelas_berat.batas_min}-${kelasKejuaraan.kelas_berat.batas_max} kg)`);
        }
      }

      // Register atlet
      const pesertaKompetisi = await prisma.tb_peserta_kompetisi.create({
        data: {
          id_atlet,
          id_kelas_kejuaraan,
          status: StatusPendaftaran.PENDING
        },
        include: {
          atlet: {
            include: {
              dojang: {
                select: {
                  nama_dojang: true,
                  kota: true
                }
              }
            }
          },
          kelas_kejuaraan: {
            include: {
              kompetisi: {
                select: {
                  nama_event: true
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
      });

      return pesertaKompetisi;
    } catch (error) {
      throw error;
    }
  }

  // Approve/reject registration
  static async updateRegistrationStatus(id_peserta_kompetisi: number, status: StatusPendaftaran) {
    try {
      // Check if registration exists
      const existingRegistration = await prisma.tb_peserta_kompetisi.findUnique({
        where: { id_peserta_kompetisi }
      });

      if (!existingRegistration) {
        throw new Error('Pendaftaran tidak ditemukan');
      }

      const updatedRegistration = await prisma.tb_peserta_kompetisi.update({
        where: { id_peserta_kompetisi },
        data: { status },
        include: {
          atlet: {
            include: {
              dojang: {
                select: {
                  nama_dojang: true
                }
              }
            }
          },
          kelas_kejuaraan: {
            include: {
              kompetisi: {
                select: {
                  nama_event: true
                }
              }
            }
          }
        }
      });

      return updatedRegistration;
    } catch (error) {
      throw error;
    }
  }

  // Get participants of a competition
  static async getKompetisiParticipants(id_kompetisi: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [participants, total] = await Promise.all([
        prisma.tb_peserta_kompetisi.findMany({
          where: {
            kelas_kejuaraan: {
              id_kompetisi
            }
          },
          skip: offset,
          take: limit,
          include: {
            atlet: {
              include: {
                dojang: {
                  select: {
                    nama_dojang: true,
                    kota: true
                  }
                }
              }
            },
            kelas_kejuaraan: {
              include: {
                kategori_event: {
                  select: {
                    nama_kategori: true
                  }
                },
                kelompok: {
                  select: {
                    nama_kelompok: true
                  }
                },
                kelas_berat: {
                  select: {
                    nama_kelas: true
                  }
                }
              }
            }
          },
          orderBy: { id_peserta_kompetisi: 'desc' }
        }),
        prisma.tb_peserta_kompetisi.count({
          where: {
            kelas_kejuaraan: {
              id_kompetisi
            }
          }
        })
      ]);

      return {
        data: participants,
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

  // Publish kompetisi (change status to PUBLISHED)
  static async publishKompetisi(id: number) {
    try {
      // Check if kompetisi exists and has classes
      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: id },
        include: {
          _count: {
            select: {
              kelas_kejuaraan: true
            }
          }
        }
      });

      if (!kompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      if (kompetisi.status !== StatusKompetisi.DRAFT) {
        throw new Error('Hanya kompetisi dengan status DRAFT yang dapat dipublikasi');
      }

      if (kompetisi._count.kelas_kejuaraan === 0) {
        throw new Error('Kompetisi harus memiliki minimal 1 kelas kejuaraan sebelum dipublikasi');
      }

      const publishedKompetisi = await prisma.tb_kompetisi.update({
        where: { id_kompetisi: id },
        data: { status: StatusKompetisi.PUBLISHED },
        include: {
          penyelenggara: true,
          kelas_kejuaraan: {
            include: {
              kategori_event: true
            }
          }
        }
      });

      return publishedKompetisi;
    } catch (error) {
      throw error;
    }
  }

  // Get kompetisi statistics
  static async getKompetisiStats() {
    try {
      const [totalKompetisi, draftCount, publishedCount, closedCount] = await Promise.all([
        prisma.tb_kompetisi.count(),
        prisma.tb_kompetisi.count({ where: { status: StatusKompetisi.DRAFT } }),
        prisma.tb_kompetisi.count({ where: { status: StatusKompetisi.PUBLISHED } }),
        prisma.tb_kompetisi.count({ where: { status: StatusKompetisi.CLOSED } })
      ]);

      // Type distribution
      const [openCount, trainingCount, gradeBCount, gradeCCount] = await Promise.all([
        prisma.tb_kompetisi.count({ where: { type_kompetisi: TypeKompetisi.OPEN } }),
        prisma.tb_kompetisi.count({ where: { type_kompetisi: TypeKompetisi.TRAINING } }),
        prisma.tb_kompetisi.count({ where: { type_kompetisi: TypeKompetisi.GRADE_B } }),
        prisma.tb_kompetisi.count({ where: { type_kompetisi: TypeKompetisi.GRADE_C } })
      ]);

      // Total participants
      const totalParticipants = await prisma.tb_peserta_kompetisi.count();

      // Upcoming competitions
      const upcomingKompetisi = await prisma.tb_kompetisi.count({
        where: {
          tanggal_mulai: {
            gte: new Date()
          },
          status: StatusKompetisi.PUBLISHED
        }
      });

      return {
        totalKompetisi,
        statusDistribution: {
          draft: draftCount,
          published: publishedCount,
          closed: closedCount
        },
        typeDistribution: {
          open: openCount,
          training: trainingCount,
          gradeB: gradeBCount,
          gradeC: gradeCCount
        },
        totalParticipants,
        upcomingKompetisi
      };
    } catch (error) {
      throw error;
    }
  }
}