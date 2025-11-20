import { PrismaClient, JenisKelamin } from '@prisma/client';
import fs from 'fs'
import path from 'path'
import { ATLET_FOLDER_MAP, AtletFileType } from '../constants/fileMapping'


export interface FileInfo {
  filename: string
  path: string
  exists: boolean
  uploadedAt?: Date
}

interface AtletFileInfo {
  akte_kelahiran: FileInfo | null
  pas_foto: FileInfo | null
  sertifikat_belt: FileInfo | null
  ktp: FileInfo | null
}

const prisma = new PrismaClient();

interface CreateAtletData {
  nama_atlet: string;
  nik: string;
  umur: number;
  belt: string;
  tanggal_lahir: Date;
  berat_badan: number;
  tinggi_badan: number;
  jenis_kelamin: JenisKelamin;
  no_telp?: string;
  provinsi: string;
  kota?: string;
  alamat?: string;
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

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  return today.getFullYear() - birthDate.getFullYear();
}

export class AtletService {
  // Create new atlet
  static async createAtlet(data: CreateAtletData) {
    try {
      // Validate dojang exists
      const age = calculateAge(new Date(data.tanggal_lahir));
      const bener_id_dojang = Number(data.id_dojang);
      const id_pelatih = Number(data.id_pelatih_pembuat);

      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang: Number(data.id_dojang) }
      });

      if (!dojang) {
        throw new Error('Dojang tidak ditemukan');
      }

      // Validate pelatih exists
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih: Number(data.id_pelatih_pembuat) }
      });

      if (!pelatih) {
        throw new Error('Pelatih tidak ditemukan');
      }

      // Create atlet
      const atlet = await prisma.tb_atlet.create({
        data: {
          ...data,
          id_dojang: Number(data.id_dojang),
          id_pelatih_pembuat: Number(data.id_pelatih_pembuat),
          umur: age
        },
        include: {
          dojang: {
            select: {
              id_dojang: true,
              kota: true
            }
          },
          pelatih_pembuat: {
            select: {
              id_pelatih: true,
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
        limit = 100,
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
        const age = calculateAge(birthDate);
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
      
      const age = calculateAge(new Date(atlet.tanggal_lahir));

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
        updateData.umur = calculateAge(new Date(updateData.tanggal_lahir));
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
  static async getAtletByDojang(id_dojang: number, page: number = 1, limit: number = 1000) {
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
              dojang: {
                select: {
                  provinsi: true // <-- tambahkan ini
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
        const age = calculateAge(birthDate);


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
  // SERVICE - Fixed TypeScript errors
static async getEligible(
  kelasId: number,
  filter: { 
    id_dojang: number;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
    kelompokUsiaId?: number;
    kelasBeratId?: number;
  }
) {
  console.log("🔍 Service filter received:", filter);

  // Build where condition dynamically
  const whereCondition: any = {
    id_dojang: filter.id_dojang,
    jenis_kelamin: filter.jenis_kelamin,
  };

  // ✅ FIXED: Handle kelompok usia filter
  if (filter.kelompokUsiaId) {
    const kelompok = await prisma.tb_kelompok_usia.findUnique({
      where: { id_kelompok: filter.kelompokUsiaId }
    });
    
    console.log("📋 Found kelompok:", kelompok);
    
    if (kelompok) {
      whereCondition.umur = {
        gte: kelompok.usia_min,
        lte: kelompok.usia_max,
      };
    }
  }

  // ✅ FIXED: Handle kelas berat filter
  if (filter.kelasBeratId) {
    const kelasBerat = await prisma.tb_kelas_berat.findUnique({
      where: { id_kelas_berat: filter.kelasBeratId }
    });
    
    console.log("⚖️ Found kelasBerat:", kelasBerat);
    
    if (kelasBerat) {
      whereCondition.berat_badan = {
        gte: kelasBerat.batas_min,
        lte: kelasBerat.batas_max,
      };
    }
  }

  console.log("🎯 Final where condition:", JSON.stringify(whereCondition, null, 2));

  // Cari atlet yang eligible
  const atletEligible = await prisma.tb_atlet.findMany({
    where: whereCondition,
    include: {
      dojang: { select: { id_dojang: true, nama_dojang: true } }
    }
  });

  console.log("👥 Found athletes:", atletEligible.length);
  console.log("🔍 Sample athlete data:", atletEligible[0] || "No athletes found");

  return atletEligible;
}





  // Get atlet statistics
  static async getAtletStats() {
    try {
      const [totalAtlet, maleCount, femaleCount, registeredInCompetition] = await Promise.all([
        prisma.tb_atlet.count(),
        prisma.tb_atlet.count({ where: { jenis_kelamin: 'LAKI_LAKI' } }),
        prisma.tb_atlet.count({ where: { jenis_kelamin: 'PEREMPUAN' } }),
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

      allAtlet.forEach(atlet => {
        const age = calculateAge(new Date(atlet.tanggal_lahir));
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

  // PERBAIKAN: AtletService.handleFileUpload method
static async handleFileUpload(id_atlet: number, files: any): Promise<AtletFileInfo> {
  const atlet = await prisma.tb_atlet.findUnique({
    where: { id_atlet }
  })

  if (!atlet) {
    throw new Error('Atlet tidak ditemukan')
  }

  const updateData: any = {}

  // PERBAIKAN: Hanya simpan filename saja, JANGAN include subfolder path
  // Karena subfolder sudah dihandle di multer dan getUploadedFiles
  if (files.akte_kelahiran && files.akte_kelahiran[0]) {
    updateData.akte_kelahiran = files.akte_kelahiran[0].filename // filename saja
  }

  if (files.pas_foto && files.pas_foto[0]) {
    updateData.pas_foto = files.pas_foto[0].filename // filename saja
  }

  if (files.sertifikat_belt && files.sertifikat_belt[0]) {
    updateData.sertifikat_belt = files.sertifikat_belt[0].filename // filename saja
  }

  if (files.ktp && files.ktp[0]) {
    updateData.ktp = files.ktp[0].filename // filename saja
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.tb_atlet.update({
      where: { id_atlet },
      data: updateData
    })
  }

  return await this.getUploadedFiles(id_atlet)
}

  // Ambil info file yang sudah di-upload
  // ✅ FIXED: getUploadedFiles method - hanya return filename saja
static async getUploadedFiles(id_atlet: number): Promise<AtletFileInfo> {
  const atlet = await prisma.tb_atlet.findUnique({
    where: { id_atlet },
    select: {
      akte_kelahiran: true,
      pas_foto: true,
      sertifikat_belt: true,
      ktp: true
    }
  })

  if (!atlet) {
    throw new Error('Atlet tidak ditemukan')
  }

  const checkFile = (filename: string | null, type: AtletFileType): FileInfo | null => {
    if (!filename) return null
    
    // PERBAIKAN: Extract filename saja jika masih ada path
    const actualFilename = filename.includes('/') ? filename.split('/').pop() || filename : filename
    
    // PERBAIKAN: Untuk check file existence, gunakan full path ke disk
    const folder = ATLET_FOLDER_MAP[type]
    const diskPath = path.join(process.cwd(), 'uploads', 'atlet', folder, actualFilename)
    const exists = fs.existsSync(diskPath)
    
    return {
      filename: actualFilename, // ← HANYA FILENAME SAJA
      path: `${folder}/${actualFilename}`, // ← PATH RELATIF UNTUK FRONTEND
      exists,
      uploadedAt: exists ? fs.statSync(diskPath).mtime : undefined
    }
  }

  return {
    akte_kelahiran: checkFile(atlet.akte_kelahiran, 'akte_kelahiran'),
    pas_foto: checkFile(atlet.pas_foto, 'pas_foto'),
    sertifikat_belt: checkFile(atlet.sertifikat_belt, 'sertifikat_belt'),
    ktp: checkFile(atlet.ktp, 'ktp')
  }
}

  // PERBAIKAN: AtletService.deleteFile method
// PERBAIKAN: AtletService.deleteFile method
static async deleteFile(id_atlet: number, fileType: keyof AtletFileInfo) {
  const atlet = await prisma.tb_atlet.findUnique({
    where: { id_atlet }
  })

  if (!atlet) throw new Error('Atlet tidak ditemukan')

  const filename = atlet[fileType]
  if (!filename) throw new Error('File tidak ditemukan')

  // PERBAIKAN: Construct file path properly
  const folder = ATLET_FOLDER_MAP[fileType as AtletFileType]
  
  // PERBAIKAN: Jika filename sudah include subfolder, extract filename saja
  const actualFilename = filename.includes('/') ? filename.split('/').pop() || filename : filename
  
  const filePath = path.join(process.cwd(), 'uploads', 'atlet', folder, actualFilename)

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await prisma.tb_atlet.update({
    where: { id_atlet },
    data: { [fileType]: null }
  })

  return { message: `${fileType} deleted successfully` }
}

  static async getAtletByKompetisi(id_kompetisi: number, cabang?: "KYORUGI" | "POOMSAE") {
    const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findMany({
      where: {
        id_kompetisi,
        ...(cabang ? { cabang } : {})
      },
      select: {
        peserta_kompetisi: {
          select: {
            atlet: true,
            status: true
          }
        }
      }
    });
  
    // flatten all peserta into one array
    const atletFlat = kelasKejuaraan.flatMap(kelas =>
      kelas.peserta_kompetisi.map(p => ({
        ...p.atlet,
        status: p.status
      }))
    );
  
    return atletFlat;
  }

}
