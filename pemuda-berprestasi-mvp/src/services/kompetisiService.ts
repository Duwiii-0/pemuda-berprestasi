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

static async getAvailableClassesSimple(kompetisiId: number, participantId: number) {
  try {
    // Get participant info
    const participant = await prisma.tb_peserta_kompetisi.findFirst({
      where: {
        id_peserta_kompetisi: participantId,
        kelas_kejuaraan: { id_kompetisi: kompetisiId }
      },
      include: {
        kelas_kejuaraan: {
          include: {
            kategori_event: true,
            kelompok: true,
            kelas_berat: true,
            poomsae: true
          }
        }
      }
    });

    if (!participant) {
      throw new Error('Peserta tidak ditemukan');
    }

    // Get all classes in same competition and same sport
    const availableClasses = await prisma.tb_kelas_kejuaraan.findMany({
      where: {
        id_kompetisi: kompetisiId,
        cabang: participant.kelas_kejuaraan.cabang,
        NOT: {
          id_kelas_kejuaraan: participant.kelas_kejuaraan.id_kelas_kejuaraan
        }
      },
      include: {
        kategori_event: true,
        kelompok: true,
        kelas_berat: true,
        poomsae: true
      }
    });

    console.log('Available classes found:', availableClasses.length);
    return availableClasses;

  } catch (error: any) {
    console.error('Error getting available classes:', error);
    throw new Error('Gagal mendapatkan kelas yang tersedia');
  }
}

static async getAvailableClassesForParticipant(
  kompetisiId: number, 
  participantId: number
): Promise<any[]> {
  try {
    // 1. Get participant details
    const participant = await prisma.tb_peserta_kompetisi.findFirst({
      where: {
        id_peserta_kompetisi: participantId,
        kelas_kejuaraan: {
          id_kompetisi: kompetisiId
        }
      },
      include: {
        atlet: {
          include: {
            dojang: true
          }
        },
        anggota_tim: {
          include: {
            atlet: {
              include: {
                dojang: true
              }
            }
          }
        },
        kelas_kejuaraan: {
          include: {
            kategori_event: true,
            kelompok: true,
            kelas_berat: true,
            poomsae: true
          }
        }
      }
    });

    if (!participant) {
      throw new Error('Peserta tidak ditemukan');
    }

    // 2. Get all available classes for this competition
    const allClasses = await prisma.tb_kelas_kejuaraan.findMany({
      where: {
        id_kompetisi: kompetisiId,
        NOT: {
          id_kelas_kejuaraan: participant.kelas_kejuaraan.id_kelas_kejuaraan
        }
      },
      include: {
        kategori_event: true,
        kelompok: true,
        kelas_berat: true,
        poomsae: true
      }
    });

    // 3. Filter classes based on participant eligibility
    const eligibleClasses = allClasses.filter(kelas => {
      try {
        // Helper function to calculate age
        const calculateAge = (birthDate: Date): number => {
          const today = new Date();
          const birth = new Date(birthDate);
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          return age;
        };

        // Get participant info
        const isTeam = participant.is_team;
        const currentCategory = participant.kelas_kejuaraan.kategori_event.nama_kategori.toLowerCase();
        
        let participantAge: number;
        let participantGender: string;
        let participantWeight: number;

        if (isTeam && participant.anggota_tim.length > 0) {
          // For team: use youngest member's age
          const ages = participant.anggota_tim.map(member => 
            calculateAge(member.atlet.tanggal_lahir)
          );
          participantAge = Math.min(...ages);
          participantGender = 'CAMPURAN'; // Teams can be mixed gender
          participantWeight = 0; // Weight not relevant for teams
        } else if (participant.atlet) {
          participantAge = calculateAge(participant.atlet.tanggal_lahir);
          participantGender = participant.atlet.jenis_kelamin;
          participantWeight = participant.atlet.berat_badan;
        } else {
          return false; // Invalid participant data
        }

        // 4. Apply filters

        // A. Sport category must match (KYORUGI <-> KYORUGI, POOMSAE <-> POOMSAE)
        if (kelas.cabang !== participant.kelas_kejuaraan.cabang) {
          return false;
        }

        // B. Level consistency (pemula <-> pemula, prestasi <-> prestasi)
        const newCategory = kelas.kategori_event.nama_kategori.toLowerCase();
        if (
          (currentCategory.includes('pemula') && !newCategory.includes('pemula')) ||
          (!currentCategory.includes('pemula') && newCategory.includes('pemula'))
        ) {
          return false;
        }

        // C. Age group validation
        if (kelas.kelompok) {
          if (participantAge < kelas.kelompok.usia_min || participantAge > kelas.kelompok.usia_max) {
            return false;
          }
        }

        // D. Weight class validation (only for KYORUGI individual)
        if (kelas.cabang === 'KYORUGI' && !isTeam && kelas.kelas_berat) {
          if (participantGender !== kelas.kelas_berat.jenis_kelamin) {
            return false;
          }
          if (participantWeight < kelas.kelas_berat.batas_min || participantWeight > kelas.kelas_berat.batas_max) {
            return false;
          }
        }

        // E. Team type validation for POOMSAE
        if (kelas.cabang === 'POOMSAE') {
          // Check if class supports team/individual based on poomsae class name
          const poomsaeClassName = kelas.poomsae?.nama_kelas?.toLowerCase() || '';
          const isClassForTeam = poomsaeClassName.includes('tim') || poomsaeClassName.includes('beregu') || poomsaeClassName.includes('berpasangan');
          
          // Team participants can only join team classes, individual can only join individual classes
          if (isTeam !== isClassForTeam) {
            return false;
          }
        }

        return true;

      } catch (error) {
        console.error('Error filtering class:', error);
        return false;
      }
    });

    return eligibleClasses;

  } catch (error: any) {
    console.error('Error getting available classes:', error);
    throw new Error('Gagal mendapatkan kelas yang tersedia');
  }
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
  limit?: number, 
  idDojang?: number // <-- tambahkan optional filter
) {
  const queryOptions: {
    skip?: number;
    take?: number;
  } = {};

  if (limit && page) {
    queryOptions.skip = (page - 1) * limit;
    queryOptions.take = limit;
  }

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
  ...queryOptions,
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
        atlet: {
          select: {
            nama_atlet: true
          }
        },
        anggota_tim: {
          include: {
            atlet: {
              select: {
                nama_atlet: true
              }
            }
          }
        }
      }
    });

    if (!existingPeserta) {
      throw new Error('Peserta tidak ditemukan dalam kompetisi ini');
    }

    // ✅ PERBAIKAN: Hapus dengan DISABLE foreign key checks
    const result = await prisma.$transaction(async (tx) => {
      // Disable foreign key checks
      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

      try {
        // Hapus anggota tim jika ada
        if (existingPeserta.is_team) {
          await tx.tb_peserta_tim.deleteMany({
            where: { id_peserta_kompetisi: participantId }
          });
        }

        // Hapus drawing seed jika ada
        await tx.tb_drawing_seed.deleteMany({
          where: { id_peserta_kompetisi: participantId }
        });

        // Hapus dari match (set NULL atau hapus)
        await tx.tb_match.updateMany({
          where: { id_peserta_a: participantId },
          data: { id_peserta_a: null }
        });

        await tx.tb_match.updateMany({
          where: { id_peserta_b: participantId },
          data: { id_peserta_b: null }
        });

        // Hapus peserta
        const deleted = await tx.tb_peserta_kompetisi.delete({
          where: { id_peserta_kompetisi: participantId }
        });

        // Re-enable foreign key checks
        await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

        return deleted;

      } catch (error) {
        // Re-enable foreign key checks jika ada error
        await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
        throw error;
      }
    });

    // Format response
    let pesertaName: string;
    if (existingPeserta.is_team && existingPeserta.anggota_tim.length > 0) {
      const namaAnggota = existingPeserta.anggota_tim.map(anggota => anggota.atlet.nama_atlet);
      pesertaName = `Tim ${namaAnggota.join(' & ')}`;
    } else if (existingPeserta.atlet) {
      pesertaName = existingPeserta.atlet.nama_atlet;
    } else {
      pesertaName = 'Peserta';
    }

    return {
      success: true,
      data: {
        id_peserta_kompetisi: participantId,
        peserta_name: pesertaName
      },
      message: `${pesertaName} berhasil dihapus dari database`
    };

  } catch (error: any) {
    console.error('Service - Error deleting participant:', error);
    throw new Error(error.message || 'Gagal menghapus peserta dari kompetisi');
  }
}

static async updateParticipantClass(
  kompetisiId: number, 
  participantId: number, 
  newKelasKejuaraanId: number,
  user: any
) {
  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Verify competition exists
      const kompetisi = await tx.tb_kompetisi.findUnique({
        where: { id_kompetisi: kompetisiId },
        include: {
          admin: true
        }
      });

      if (!kompetisi) {
        throw new Error('Kompetisi tidak ditemukan');
      }

      // 2. Check competition status - only allow edit during registration phase
      if (kompetisi.status !== 'PENDAFTARAN') {
        throw new Error('Hanya dapat mengubah kelas peserta saat masa pendaftaran');
      }

      // 3. Verify participant exists in this competition
      const existingParticipant = await tx.tb_peserta_kompetisi.findFirst({
        where: {
          id_peserta_kompetisi: participantId,
          kelas_kejuaraan: {
            kompetisi: {
              id_kompetisi: kompetisiId
            }
          }
        },
        include: {
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              id_dojang: true,
              jenis_kelamin: true,
              berat_badan: true,
              tanggal_lahir: true,
              dojang: {
                select: {
                  nama_dojang: true
                }
              }
            }
          },
          anggota_tim: {
            include: {
              atlet: {
                select: {
                  id_atlet: true,
                  nama_atlet: true,
                  id_dojang: true,
                  jenis_kelamin: true,
                  berat_badan: true,
                  tanggal_lahir: true,
                  dojang: {
                    select: {
                      nama_dojang: true
                    }
                  }
                }
              }
            }
          },
          kelas_kejuaraan: {
            include: {
              kategori_event: true,
              kelompok: true,
              kelas_berat: true,
              poomsae: true
            }
          }
        }
      });

      if (!existingParticipant) {
        throw new Error('Peserta tidak ditemukan dalam kompetisi ini');
      }

      // 4. Additional authorization checks
      if (user.role === 'ADMIN_KOMPETISI') {
        // Admin kompetisi can only edit participants in their assigned competition
        const isAdminOfThisKompetisi = kompetisi.admin.some(
          admin => admin.id_akun === user.id_akun
        );
        if (!isAdminOfThisKompetisi) {
          throw new Error('Anda tidak memiliki akses untuk mengubah peserta di kompetisi ini');
        }
      } else if (user.role === 'PELATIH') {
        // Pelatih can only edit participants from their dojang
        let canEdit = false;
        
        if (!existingParticipant.is_team && existingParticipant.atlet) {
          // Individual participant
          canEdit = existingParticipant.atlet.id_dojang === user.pelatih?.id_dojang;
        } else if (existingParticipant.is_team && existingParticipant.anggota_tim.length > 0) {
          // Team participant - all members must be from pelatih's dojang
          canEdit = existingParticipant.anggota_tim.every(
            member => member.atlet.id_dojang === user.pelatih?.id_dojang
          );
        }

        if (!canEdit) {
          throw new Error('Anda hanya dapat mengubah kelas peserta dari dojang Anda sendiri');
        }
      }

      // 5. Verify new kelas kejuaraan exists and belongs to this competition
      const newKelasKejuaraan = await tx.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan: newKelasKejuaraanId },
        include: {
          kategori_event: true,
          kelompok: true,
          kelas_berat: true,
          poomsae: true
        }
      });

      if (!newKelasKejuaraan) {
        throw new Error('Kelas kejuaraan baru tidak ditemukan');
      }

      if (newKelasKejuaraan.id_kompetisi !== kompetisiId) {
        throw new Error('Kelas kejuaraan tidak terdaftar dalam kompetisi ini');
      }

      // 6. Check if participant is already in the new class
      if (existingParticipant.id_kelas_kejuaraan === newKelasKejuaraanId) {
        throw new Error('Peserta sudah terdaftar di kelas kejuaraan ini');
      }

      // 7. Validate participant eligibility for new class
      await KompetisiService.validateParticipantEligibility(existingParticipant, newKelasKejuaraan);

      // 8. Check for duplicate registration in new class
      if (!existingParticipant.is_team && existingParticipant.atlet) {
        const duplicateCheck = await tx.tb_peserta_kompetisi.findFirst({
          where: {
            id_atlet: existingParticipant.atlet.id_atlet,
            id_kelas_kejuaraan: newKelasKejuaraanId,
            NOT: {
              id_peserta_kompetisi: participantId
            }
          }
        });

        if (duplicateCheck) {
          throw new Error('Atlet sudah terdaftar di kelas kejuaraan ini');
        }
      }

      // 11. Update the participant's class
      const updatedParticipant = await tx.tb_peserta_kompetisi.update({
        where: {
          id_peserta_kompetisi: participantId
        },
        data: {
          id_kelas_kejuaraan: newKelasKejuaraanId,
          // Reset status to PENDING if needed
          status: 'PENDING'
        },
        include: {
          atlet: {
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
          anggota_tim: {
            include: {
              atlet: {
                select: {
                  id_atlet: true,
                  nama_atlet: true,
                  dojang: {
                    select: {
                      nama_dojang: true
                    }
                  }
                }
              }
            }
          },
          kelas_kejuaraan: {
            include: {
              kategori_event: true,
              kelompok: true,
              kelas_berat: true,
              poomsae: true
            }
          }
        }
      });

      return {
        updatedParticipant,
        oldClass: existingParticipant.kelas_kejuaraan,
        newClass: newKelasKejuaraan,
        participantName: existingParticipant.is_team 
          ? existingParticipant.anggota_tim.map(m => m.atlet.nama_atlet).join(' & ')
          : existingParticipant.atlet?.nama_atlet || 'Unknown'
      };
    });

    return {
      success: true,
      data: result.updatedParticipant,
      message: `Kelas ${result.participantName} berhasil diubah dari "${result.oldClass.kategori_event.nama_kategori}" ke "${result.newClass.kategori_event.nama_kategori}"`
    };

  } catch (error: any) {
    console.error('Service - Error updating participant class:', error);
    
    if (error.code === 'P2025') {
      throw new Error('Peserta tidak ditemukan');
    }
    
    if (error.code === 'P2002') {
      throw new Error('Terjadi konflik data saat memperbarui kelas peserta');
    }

    throw new Error(error.message || 'Gagal mengubah kelas peserta');
  }
}

// Helper function to validate participant eligibility
static async validateParticipantEligibility(participant: any, newKelas: any) {
  // If it's a team registration
  if (participant.is_team) {
    // Validate team composition for new class
    if (newKelas.cabang === 'POOMSAE') {
      // Poomsae teams are allowed
      return;
    } else if (newKelas.cabang === 'KYORUGI') {
      // Individual kyorugi only
      throw new Error('Kelas Kyorugi hanya untuk peserta individu');
    }
  } else {
    // Individual participant validation
    const atlet = participant.atlet;
    if (!atlet) {
      throw new Error('Data atlet tidak ditemukan');
    }

    // Age validation
    if (newKelas.kelompok) {
      const today = new Date();
      const birthDate = new Date(atlet.tanggal_lahir);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 : age;

      if (finalAge < newKelas.kelompok.usia_min || finalAge > newKelas.kelompok.usia_max) {
        throw new Error(
          `Umur atlet (${finalAge} tahun) tidak sesuai dengan kelompok usia ${newKelas.kelompok.nama_kelompok} (${newKelas.kelompok.usia_min}-${newKelas.kelompok.usia_max} tahun)`
        );
      }
    }

    // Weight class validation for Kyorugi
    if (newKelas.cabang === 'KYORUGI' && newKelas.kelas_berat) {
      const weight = atlet.berat_badan;
      if (weight < newKelas.kelas_berat.batas_min || weight > newKelas.kelas_berat.batas_max) {
        throw new Error(
          `Berat badan atlet (${weight} kg) tidak sesuai dengan kelas berat ${newKelas.kelas_berat.nama_kelas}`
        );
      }

      // Gender validation for weight class
      if (atlet.jenis_kelamin !== newKelas.kelas_berat.jenis_kelamin) {
        throw new Error('Jenis kelamin atlet tidak sesuai dengan kelas berat yang dipilih');
      }
    }
  }
}

}
