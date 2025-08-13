import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { paginate } from '../utils/pagination';

const prisma = new PrismaClient();

export class KompetisiController {
  // Create Kompetisi (Admin only)
  static async create(req: Request, res: Response) {
    try {
      const { 
        id_penyelenggara,
        tanggal_mulai,
        tanggal_selesai,
        nama_event,
        type_kompetisi,
        venues,
        kelas_kejuaraan
      } = req.body;

      const newKompetisi = await prisma.tb_kompetisi.create({
        data: {
          id_penyelenggara,
          tanggal_mulai: new Date(tanggal_mulai),
          tanggal_selesai: new Date(tanggal_selesai),
          nama_event,
          type_kompetisi
        },
        include: {
          penyelenggara: true
        }
      });

      // Create venues if provided
      if (venues && venues.length > 0) {
        await prisma.tb_venue.createMany({
          data: venues.map((venue: any) => ({
            id_kompetisi: newKompetisi.id_kompetisi,
            nama_venue: venue.nama_venue,
            lokasi: venue.lokasi
          }))
        });
      }

      // Create kelas kejuaraan if provided
      if (kelas_kejuaraan && kelas_kejuaraan.length > 0) {
        await prisma.tb_kelas_kejuaraan.createMany({
          data: kelas_kejuaraan.map((kelas: any) => ({
            id_kompetisi: newKompetisi.id_kompetisi,
            cabang: kelas.cabang,
            kategori_usia: kelas.kategori_usia,
            kategori_berat: kelas.kategori_berat
          }))
        });
      }

      const kompetisiWithDetails = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: newKompetisi.id_kompetisi },
        include: {
          penyelenggara: true,
          venue: true,
          kelas_kejuaraan: true
        }
      });

      return ApiResponse.success(res, kompetisiWithDetails, 'Kompetisi berhasil dibuat', 201);
    } catch (error) {
      console.error('Create kompetisi error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get All Kompetisi with pagination and filters
  static async getAll(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        type_kompetisi, 
        status, 
        date_from, 
        date_to 
      } = req.query;

      const where: any = {};

      if (search) {
        where.nama_event = {
          contains: search as string,
          mode: 'insensitive'
        };
      }

      if (type_kompetisi) {
        where.type_kompetisi = type_kompetisi;
      }

      if (status) {
        where.status = status;
      }

      if (date_from && date_to) {
        where.tanggal_mulai = {
          gte: new Date(date_from as string),
          lte: new Date(date_to as string)
        };
      }

      const { data, pagination } = await paginate(
        prisma.tb_kompetisi,
        {
          where,
          include: {
            penyelenggara: true,
            _count: {
              select: {
                kelas_kejuaraan: true,
                venue: true
              }
            }
          },
          orderBy: { tanggal_mulai: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { kompetisis: data, pagination }, 'Kompetisi berhasil diambil');
    } catch (error) {
      console.error('Get all kompetisis error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Kompetisi by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi: parseInt(id) },
        include: {
          penyelenggara: true,
          venue: true,
          kelas_kejuaraan: {
            include: {
              _count: {
                select: {
                  peserta_kompetisi: true
                }
              }
            }
          }
        }
      });

      if (!kompetisi) {
        return ApiResponse.error(res, 'Kompetisi tidak ditemukan', 404);
      }

      return ApiResponse.success(res, kompetisi, 'Kompetisi berhasil diambil');
    } catch (error) {
      console.error('Get kompetisi by id error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Published Kompetisi (for public)
  static async getPublished(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, type_kompetisi } = req.query;

      const where: any = {
        status: 'PUBLISHED',
        tanggal_selesai: {
          gte: new Date()
        }
      };

      if (type_kompetisi) {
        where.type_kompetisi = type_kompetisi;
      }

      const { data, pagination } = await paginate(
        prisma.tb_kompetisi,
        {
          where,
          include: {
            penyelenggara: {
              select: {
                nama_penyelenggara: true
              }
            },
            kelas_kejuaraan: {
              select: {
                cabang: true,
                kategori_usia: true,
                kategori_berat: true
              }
            }
          },
          orderBy: { tanggal_mulai: 'asc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { kompetisis: data, pagination }, 'Kompetisi published berhasil diambil');
    } catch (error) {
      console.error('Get published kompetisis error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Kompetisi
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        tanggal_mulai,
        tanggal_selesai,
        nama_event,
        type_kompetisi
      } = req.body;

      const updatedKompetisi = await prisma.tb_kompetisi.update({
        where: { id_kompetisi: parseInt(id) },
        data: {
          tanggal_mulai: new Date(tanggal_mulai),
          tanggal_selesai: new Date(tanggal_selesai),
          nama_event,
          type_kompetisi
        },
        include: {
          penyelenggara: true,
          venue: true,
          kelas_kejuaraan: true
        }
      });

      return ApiResponse.success(res, updatedKompetisi, 'Kompetisi berhasil diupdate');
    } catch (error) {
      console.error('Update kompetisi error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Kompetisi Status
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedKompetisi = await prisma.tb_kompetisi.update({
        where: { id_kompetisi: parseInt(id) },
        data: { status },
        include: {
          penyelenggara: true
        }
      });

      return ApiResponse.success(res, updatedKompetisi, `Status kompetisi berhasil diubah menjadi ${status}`);
    } catch (error) {
      console.error('Update kompetisi status error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Delete Kompetisi
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if kompetisi has participants
      const participantCount = await prisma.tb_peserta_kompetisi.count({
        where: {
          kelas_kejuaraan: {
            id_kompetisi: parseInt(id)
          }
        }
      });

      if (participantCount > 0) {
        return ApiResponse.error(res, 'Tidak dapat menghapus kompetisi yang sudah memiliki peserta', 400);
      }

      await prisma.tb_kompetisi.delete({
        where: { id_kompetisi: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Kompetisi berhasil dihapus');
    } catch (error) {
      console.error('Delete kompetisi error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Register Atlet to Kompetisi
  static async registerAtlet(req: Request, res: Response) {
    try {
      const { id_kompetisi } = req.params;
      const { registrations } = req.body; // Array of {id_atlet, id_kelas_kejuaraan}
      const { id_pelatih } = req.user;

      // Validate kompetisi exists and is published
      const kompetisi = await prisma.tb_kompetisi.findFirst({
        where: {
          id_kompetisi: parseInt(id_kompetisi),
          status: 'PUBLISHED'
        }
      });

      if (!kompetisi) {
        return ApiResponse.error(res, 'Kompetisi tidak ditemukan atau belum dipublish', 404);
      }

      // Validate all athletes belong to the pelatih
      const atletIds = registrations.map((reg: any) => reg.id_atlet);
      const validAtlets = await prisma.tb_atlet.findMany({
        where: {
          id_atlet: { in: atletIds },
          id_pelatih_pembuat: id_pelatih
        }
      });

      if (validAtlets.length !== atletIds.length) {
        return ApiResponse.error(res, 'Beberapa atlet tidak valid atau tidak dimiliki', 400);
      }

      // Create registrations
      const newRegistrations = await prisma.tb_peserta_kompetisi.createMany({
        data: registrations.map((reg: any) => ({
          id_atlet: reg.id_atlet,
          id_kelas_kejuaraan: reg.id_kelas_kejuaraan
        })),
        skipDuplicates: true
      });

      return ApiResponse.success(res, { created: newRegistrations.count }, 'Atlet berhasil didaftarkan ke kompetisi', 201);
    } catch (error) {
      console.error('Register atlet error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Kompetisi Participants
  static async getParticipants(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, id_kelas_kejuaraan, status_pendaftaran } = req.query;

      const where: any = {
        kelas_kejuaraan: {
          id_kompetisi: parseInt(id)
        }
      };

      if (id_kelas_kejuaraan) {
        where.id_kelas_kejuaraan = parseInt(id_kelas_kejuaraan as string);
      }

      if (status_pendaftaran) {
        where.status_pendaftaran = status_pendaftaran;
      }

      const { data, pagination } = await paginate(
        prisma.tb_peserta_kompetisi,
        {
          where,
          include: {
            atlet: {
              include: {
                dojang: {
                  select: {
                    nama_dojang: true,
                    wilayah: {
                      select: {
                        provinsi: true,
                        kota: true
                      }
                    }
                  }
                }
              }
            },
            kelas_kejuaraan: {
              select: {
                cabang: true,
                kategori_usia: true,
                kategori_berat: true
              }
            }
          },
          orderBy: { id_peserta_kompetisi: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { participants: data, pagination }, 'Peserta kompetisi berhasil diambil');
    } catch (error) {
      console.error('Get kompetisi participants error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Participant Status
  static async updateParticipantStatus(req: Request, res: Response) {
    try {
      const { id_peserta } = req.params;
      const { status_pendaftaran } = req.body;

      const updatedParticipant = await prisma.tb_peserta_kompetisi.update({
        where: { id_peserta_kompetisi: parseInt(id_peserta) },
        data: { status_pendaftaran },
        include: {
          atlet: {
            select: {
              nama_atlet: true
            }
          },
          kelas_kejuaraan: {
            select: {
              cabang: true,
              kategori_usia: true
            }
          }
        }
      });

      return ApiResponse.success(res, updatedParticipant, `Status pendaftaran berhasil diubah menjadi ${status_pendaftaran}`);
    } catch (error) {
      console.error('Update participant status error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get My Registrations (for pelatih)
  static async getMyRegistrations(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { page = 1, limit = 10, status_pendaftaran } = req.query;

      const where: any = {
        atlet: {
          id_pelatih_pembuat: id_pelatih
        }
      };

      if (status_pendaftaran) {
        where.status_pendaftaran = status_pendaftaran;
      }

      const { data, pagination } = await paginate(
        prisma.tb_peserta_kompetisi,
        {
          where,
          include: {
            atlet: {
              select: {
                nama_atlet: true,
                jenis_kelamin: true,
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
                    nama_event: true,
                    tanggal_mulai: true,
                    tanggal_selesai: true,
                    status: true
                  }
                }
              }
            }
          },
          orderBy: { id_peserta_kompetisi: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { registrations: data, pagination }, 'Pendaftaran saya berhasil diambil');
    } catch (error) {
      console.error('Get my registrations error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Kompetisi Statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const totalKompetisi = await prisma.tb_kompetisi.count();
      const publishedKompetisi = await prisma.tb_kompetisi.count({
        where: { status: 'PUBLISHED' }
      });
      const ongoingKompetisi = await prisma.tb_kompetisi.count({
        where: {
          status: 'PUBLISHED',
          tanggal_mulai: { lte: new Date() },
          tanggal_selesai: { gte: new Date() }
        }
      });
      const totalPeserta = await prisma.tb_peserta_kompetisi.count();

      const stats = {
        total_kompetisi: totalKompetisi,
        published_kompetisi: publishedKompetisi,
        ongoing_kompetisi: ongoingKompetisi,
        total_peserta: totalPeserta
      };

      return ApiResponse.success(res, stats, 'Statistik kompetisi berhasil diambil');
    } catch (error) {
      console.error('Get kompetisi statistics error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}