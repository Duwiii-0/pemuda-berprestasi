import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { paginate } from '../utils/pagination';

const prisma = new PrismaClient();

export class DojangController {
  // Create Dojang
  static async create(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { nama_dojang, email, no_telp, founder, no_sk, id_wilayah } = req.body;

      // Check if no_sk already exists
      const existingDojang = await prisma.tb_dojang.findUnique({
        where: { no_sk }
      });

      if (existingDojang) {
        return ApiResponse.error(res, 'Nomor SK sudah terdaftar', 400);
      }

      const newDojang = await prisma.tb_dojang.create({
        data: {
          nama_dojang,
          email,
          no_telp,
          founder,
          no_sk,
          id_wilayah: id_wilayah || null,
          id_pelatih_pendaftar: id_pelatih
        },
        include: {
          wilayah: true,
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              email: true
            }
          }
        }
      });

      return ApiResponse.success(res, newDojang, 'Dojang berhasil didaftarkan', 201);
    } catch (error) {
      console.error('Create dojang error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get All Dojangs with pagination and filters
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, status, id_wilayah } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { nama_dojang: { contains: search as string, mode: 'insensitive' } },
          { founder: { contains: search as string, mode: 'insensitive' } },
          { no_sk: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (id_wilayah) {
        where.id_wilayah = parseInt(id_wilayah as string);
      }

      const { data, pagination } = await paginate(
        prisma.tb_dojang,
        {
          where,
          include: {
            wilayah: true,
            pelatih_pendaftar: {
              select: {
                id_pelatih: true,
                nama_pelatih: true,
                email: true
              }
            },
            _count: {
              select: {
                atlet: true
              }
            }
          },
          orderBy: { id_dojang: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { dojangs: data, pagination }, 'Dojang berhasil diambil');
    } catch (error) {
      console.error('Get all dojangs error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Dojang by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const dojang = await prisma.tb_dojang.findUnique({
        where: { id_dojang: parseInt(id) },
        include: {
          wilayah: true,
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              email: true
            }
          },
          atlet: {
            select: {
              id_atlet: true,
              nama_atlet: true,
              tanggal_lahir: true,
              jenis_kelamin: true
            }
          }
        }
      });

      if (!dojang) {
        return ApiResponse.error(res, 'Dojang tidak ditemukan', 404);
      }

      return ApiResponse.success(res, dojang, 'Dojang berhasil diambil');
    } catch (error) {
      console.error('Get dojang by id error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Dojangs by Pelatih (logged in pelatih's dojangs)
  static async getByPelatih(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { page = 1, limit = 10, status } = req.query;

      const where: any = {
        id_pelatih_pendaftar: id_pelatih
      };

      if (status) {
        where.status = status;
      }

      const { data, pagination } = await paginate(
        prisma.tb_dojang,
        {
          where,
          include: {
            wilayah: true,
            _count: {
              select: {
                atlet: true
              }
            }
          },
          orderBy: { id_dojang: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { dojangs: data, pagination }, 'Dojang pelatih berhasil diambil');
    } catch (error) {
      console.error('Get dojangs by pelatih error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Dojang
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { id_pelatih } = req.user;
      const { nama_dojang, email, no_telp, founder, id_wilayah } = req.body;

      // Check if dojang exists and belongs to the pelatih
      const existingDojang = await prisma.tb_dojang.findFirst({
        where: {
          id_dojang: parseInt(id),
          id_pelatih_pendaftar: id_pelatih
        }
      });

      if (!existingDojang) {
        return ApiResponse.error(res, 'Dojang tidak ditemukan atau tidak memiliki akses', 404);
      }

      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang: parseInt(id) },
        data: {
          nama_dojang,
          email,
          no_telp,
          founder,
          id_wilayah: id_wilayah || null
        },
        include: {
          wilayah: true,
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              email: true
            }
          }
        }
      });

      return ApiResponse.success(res, updatedDojang, 'Dojang berhasil diupdate');
    } catch (error) {
      console.error('Update dojang error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Dojang Status (Admin only)
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedDojang = await prisma.tb_dojang.update({
        where: { id_dojang: parseInt(id) },
        data: { status },
        include: {
          wilayah: true,
          pelatih_pendaftar: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              email: true
            }
          }
        }
      });

      return ApiResponse.success(res, updatedDojang, `Status dojang berhasil diubah menjadi ${status}`);
    } catch (error) {
      console.error('Update dojang status error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Delete Dojang
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { id_pelatih } = req.user;

      // Check if dojang exists and belongs to the pelatih
      const existingDojang = await prisma.tb_dojang.findFirst({
        where: {
          id_dojang: parseInt(id),
          id_pelatih_pendaftar: id_pelatih
        },
        include: {
          _count: {
            select: {
              atlet: true
            }
          }
        }
      });

      if (!existingDojang) {
        return ApiResponse.error(res, 'Dojang tidak ditemukan atau tidak memiliki akses', 404);
      }

      // Check if dojang has athletes
      if (existingDojang._count.atlet > 0) {
        return ApiResponse.error(res, 'Tidak dapat menghapus dojang yang memiliki atlet', 400);
      }

      await prisma.tb_dojang.delete({
        where: { id_dojang: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Dojang berhasil dihapus');
    } catch (error) {
      console.error('Delete dojang error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Dojang Statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;

      const stats = await prisma.tb_dojang.groupBy({
        by: ['status'],
        where: {
          id_pelatih_pendaftar: id_pelatih
        },
        _count: {
          status: true
        }
      });

      const totalAtlets = await prisma.tb_atlet.count({
        where: {
          dojang: {
            id_pelatih_pendaftar: id_pelatih
          }
        }
      });

      const formattedStats = {
        total_dojangs: stats.reduce((acc, curr) => acc + curr._count.status, 0),
        pending: stats.find(s => s.status === 'PENDING')?._count.status || 0,
        active: stats.find(s => s.status === 'ACTIVE')?._count.status || 0,
        inactive: stats.find(s => s.status === 'INACTIVE')?._count.status || 0,
        total_atlets: totalAtlets
      };

      return ApiResponse.success(res, formattedStats, 'Statistik dojang berhasil diambil');
    } catch (error) {
      console.error('Get dojang statistics error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}