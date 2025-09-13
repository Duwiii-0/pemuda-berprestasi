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
          select: {
            id_kelas_kejuaraan: true,
            cabang: true,
            kompetisi: {
              select: {
                id_kompetisi: true,
                nama_event: true,
                status: true,
                tanggal_mulai: true,
                tanggal_selesai: true
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

    if (!existingPeserta) {
      throw new Error('Peserta tidak ditemukan dalam kompetisi ini');
    }

    // Validasi status kompetisi
    const kompetisi = existingPeserta.kelas_kejuaraan!.kompetisi;
    if (kompetisi.status === 'SEDANG_DIMULAI' || kompetisi.status === 'SELESAI') {
      throw new Error('Tidak dapat menghapus peserta dari kompetisi yang sudah dimulai atau selesai');
    }

    // Cek apakah ada pertandingan yang sudah terjadwal untuk peserta ini
    const existingMatches = await prisma.tb_match.findMany({
      where: {
        OR: [
          { id_peserta_a: participantId },
          { id_peserta_b: participantId }
        ]
      },
      select: {
        id_match: true,
        ronde: true,
        skor_a: true,
        skor_b: true
      }
    });

    if (existingMatches.length > 0) {
      const activeMatches = existingMatches.filter(match => 
        match.skor_a > 0 || match.skor_b > 0
      );
      
      if (activeMatches.length > 0) {
        throw new Error('Tidak dapat menghapus peserta yang sudah memiliki pertandingan dengan skor');
      }

      // Hapus pertandingan yang belum dimulai
      await prisma.tb_match.deleteMany({
        where: {
          OR: [
            { id_peserta_a: participantId },
            { id_peserta_b: participantId }
          ],
          skor_a: 0,
          skor_b: 0
        }
      });
    }

    // Mulai transaction untuk menghapus peserta
    const result = await prisma.$transaction(async (tx) => {
      // Jika ini adalah tim, hapus anggota tim terlebih dahulu
      if (existingPeserta.is_team && existingPeserta.anggota_tim.length > 0) {
        await tx.tb_peserta_tim.deleteMany({
          where: {
            id_peserta_kompetisi: participantId
          }
        });
      }

      // Hapus drawing seed jika ada
      await tx.tb_drawing_seed.deleteMany({
        where: {
          id_peserta_kompetisi: participantId
        }
      });

      // Hapus peserta dari kompetisi
      const deletedPeserta = await tx.tb_peserta_kompetisi.delete({
        where: {
          id_peserta_kompetisi: participantId
        }
      });

      return {
        deletedPeserta,
        cancelledMatches: existingMatches.length,
        kompetisi: {
          id: kompetisi.id_kompetisi,
          nama: kompetisi.nama_event,
          status: kompetisi.status
        }
      };
    });

    // Format response data
    let pesertaName: string;
    if (existingPeserta.is_team && existingPeserta.anggota_tim.length > 0) {
      const namaAnggota = existingPeserta.anggota_tim.map(anggota => anggota.atlet.nama_atlet);
      pesertaName = `Tim ${namaAnggota.join(' & ')}`;
    } else if (existingPeserta.atlet) {
      pesertaName = existingPeserta.atlet.nama_atlet;
    } else {
      pesertaName = 'Peserta Tidak Diketahui';
    }

    return {
      success: true,
      data: {
        id_peserta_kompetisi: participantId,
        peserta_name: pesertaName,
        kelas: existingPeserta.kelas_kejuaraan!.kategori_event.nama_kategori,
        cabang: existingPeserta.kelas_kejuaraan!.cabang,
        is_team: existingPeserta.is_team,
        cancelled_matches: result.cancelledMatches,
        kompetisi: result.kompetisi
      },
      message: `${pesertaName} berhasil dihapus dari kelas ${existingPeserta.kelas_kejuaraan!.kategori_event.nama_kategori}`
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
