import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { paginate } from '../utils/pagination';

const prisma = new PrismaClient();

export class WilayahController {
  // Create Wilayah
  static async create(req: Request, res: Response) {
    try {
      const { provinsi, kota } = req.body;

      const newWilayah = await prisma.tb_wilayah.create({
        data: {
          provinsi,
          kota
        }
      });

      return ApiResponse.success(res, newWilayah, 'Wilayah berhasil dibuat', 201);
    } catch (error) {
      console.error('Create wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get All Wilayah with pagination and filters
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, provinsi } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { provinsi: { contains: search as string, mode: 'insensitive' } },
          { kota: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (provinsi) {
        where.provinsi = {
          contains: provinsi as string,
          mode: 'insensitive'
        };
      }

      const { data, pagination } = await paginate(
        prisma.tb_wilayah,
        {
          where,
          include: {
            _count: {
              select: {
                dojang: true
              }
            }
          },
          orderBy: [
            { provinsi: 'asc' },
            { kota: 'asc' }
          ]
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { wilayahs: data, pagination }, 'Wilayah berhasil diambil');
    } catch (error) {
      console.error('Get all wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Wilayah by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const wilayah = await prisma.tb_wilayah.findUnique({
        where: { id_wilayah: parseInt(id) },
        include: {
          dojang: {
            select: {
              id_dojang: true,
              nama_dojang: true,
              status: true,
              _count: {
                select: {
                  atlet: true
                }
              }
            }
          }
        }
      });

      if (!wilayah) {
        return ApiResponse.error(res, 'Wilayah tidak ditemukan', 404);
      }

      return ApiResponse.success(res, wilayah, 'Wilayah berhasil diambil');
    } catch (error) {
      console.error('Get wilayah by id error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Wilayah
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { provinsi, kota } = req.body;

      const updatedWilayah = await prisma.tb_wilayah.update({
        where: { id_wilayah: parseInt(id) },
        data: {
          provinsi,
          kota
        }
      });

      return ApiResponse.success(res, updatedWilayah, 'Wilayah berhasil diupdate');
    } catch (error) {
      console.error('Update wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Delete Wilayah
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if wilayah has dojangs
      const dojangCount = await prisma.tb_dojang.count({
        where: { id_wilayah: parseInt(id) }
      });

      if (dojangCount > 0) {
        return ApiResponse.error(res, 'Tidak dapat menghapus wilayah yang memiliki dojang', 400);
      }

      await prisma.tb_wilayah.delete({
        where: { id_wilayah: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Wilayah berhasil dihapus');
    } catch (error) {
      console.error('Delete wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Provinces
  static async getProvinces(req: Request, res: Response) {
    try {
      const provinces = await prisma.tb_wilayah.findMany({
        select: {
          provinsi: true
        },
        distinct: ['provinsi'],
        orderBy: {
          provinsi: 'asc'
        }
      });

      const provinceList = provinces.map(p => p.provinsi);

      return ApiResponse.success(res, provinceList, 'Daftar provinsi berhasil diambil');
    } catch (error) {
      console.error('Get provinces error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Cities by Province
  static async getCitiesByProvince(req: Request, res: Response) {
    try {
      const { provinsi } = req.params;

      const cities = await prisma.tb_wilayah.findMany({
        where: {
          provinsi: {
            equals: provinsi,
            mode: 'insensitive'
          }
        },
        select: {
          id_wilayah: true,
          kota: true
        },
        orderBy: {
          kota: 'asc'
        }
      });

      return ApiResponse.success(res, cities, 'Daftar kota berhasil diambil');
    } catch (error) {
      console.error('Get cities by province error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Bulk Create Wilayah
  static async bulkCreate(req: Request, res: Response) {
    try {
      const { wilayah_list } = req.body;

      const createdWilayah = await prisma.tb_wilayah.createMany({
        data: wilayah_list.map((wilayah: any) => ({
          provinsi: wilayah.provinsi,
          kota: wilayah.kota
        })),
        skipDuplicates: true
      });

      return ApiResponse.success(res, { created: createdWilayah.count }, 'Wilayah berhasil dibuat secara bulk', 201);
    } catch (error) {
      console.error('Bulk create wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Search Wilayah (for dropdowns)
  static async search(req: Request, res: Response) {
    try {
      const { q, provinsi } = req.query;

      const where: any = {};

      if (q) {
        where.OR = [
          { provinsi: { contains: q as string, mode: 'insensitive' } },
          { kota: { contains: q as string, mode: 'insensitive' } }
        ];
      }

      if (provinsi) {
        where.provinsi = {
          equals: provinsi as string,
          mode: 'insensitive'
        };
      }

      const wilayahs = await prisma.tb_wilayah.findMany({
        where,
        select: {
          id_wilayah: true,
          provinsi: true,
          kota: true
        },
        take: 20,
        orderBy: [
          { provinsi: 'asc' },
          { kota: 'asc' }
        ]
      });

      return ApiResponse.success(res, wilayahs, 'Pencarian wilayah berhasil');
    } catch (error) {
      console.error('Search wilayah error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Wilayah Statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const totalWilayah = await prisma.tb_wilayah.count();
      const totalProvinsi = await prisma.tb_wilayah.groupBy({
        by: ['provinsi']
      });
      
      const wilayahWithDojang = await prisma.tb_wilayah.count({
        where: {
          dojang: {
            some: {}
          }
        }
      });

      const stats = {
        total_wilayah: totalWilayah,
        total_provinsi: totalProvinsi.length,
        wilayah_with_dojang: wilayahWithDojang,
        wilayah_without_dojang: totalWilayah - wilayahWithDojang
      };

      return ApiResponse.success(res, stats, 'Statistik wilayah berhasil diambil');
    } catch (error) {
      console.error('Get wilayah statistics error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}