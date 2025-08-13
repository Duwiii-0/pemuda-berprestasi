import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/response';

const prisma = new PrismaClient();

export class KelasKejuaraanController {
  // Create Kelas Kejuaraan
  static async create(req: Request, res: Response) {
    try {
      const { id_kompetisi, cabang, kategori_usia, kategori_berat } = req.body;

      // Validate kompetisi exists
      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi }
      });

      if (!kompetisi) {
        return ApiResponse.error(res, 'Kompetisi tidak ditemukan', 404);
      }

      const newKelasKejuaraan = await prisma.tb_kelas_kejuaraan.create({
        data: {
          id_kompetisi,
          cabang,
          kategori_usia,
          kategori_berat
        },
        include: {
          kompetisi: {
            select: {
              nama_event: true
            }
          }
        }
      });

      return ApiResponse.success(res, newKelasKejuaraan, 'Kelas kejuaraan berhasil dibuat', 201);
    } catch (error) {
      console.error('Create kelas kejuaraan error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Kelas Kejuaraan by Kompetisi
  static async getByKompetisi(req: Request, res: Response) {
    try {
      const { id_kompetisi } = req.params;

      const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findMany({
        where: { id_kompetisi: parseInt(id_kompetisi) },
        include: {
          _count: {
            select: {
              peserta_kompetisi: true
            }
          }
        },
        orderBy: [
          { cabang: 'asc' },
          { kategori_usia: 'asc' }
        ]
      });

      return ApiResponse.success(res, kelasKejuaraan, 'Kelas kejuaraan berhasil diambil');
    } catch (error) {
      console.error('Get kelas kejuaraan by kompetisi error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Kelas Kejuaraan by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan: parseInt(id) },
        include: {
          kompetisi: true,
          peserta_kompetisi: {
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
              }
            }
          }
        }
      });

      if (!kelasKejuaraan) {
        return ApiResponse.error(res, 'Kelas kejuaraan tidak ditemukan', 404);
      }

      return ApiResponse.success(res, kelasKejuaraan, 'Kelas kejuaraan berhasil diambil');
    } catch (error) {
      console.error('Get kelas kejuaraan by id error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Kelas Kejuaraan
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { cabang, kategori_usia, kategori_berat } = req.body;

      const updatedKelasKejuaraan = await prisma.tb_kelas_kejuaraan.update({
        where: { id_kelas_kejuaraan: parseInt(id) },
        data: {
          cabang,
          kategori_usia,
          kategori_berat
        },
        include: {
          kompetisi: {
            select: {
              nama_event: true
            }
          }
        }
      });

      return ApiResponse.success(res, updatedKelasKejuaraan, 'Kelas kejuaraan berhasil diupdate');
    } catch (error) {
      console.error('Update kelas kejuaraan error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Delete Kelas Kejuaraan
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if kelas has participants
      const participantCount = await prisma.tb_peserta_kompetisi.count({
        where: { id_kelas_kejuaraan: parseInt(id) }
      });

      if (participantCount > 0) {
        return ApiResponse.error(res, 'Tidak dapat menghapus kelas kejuaraan yang sudah memiliki peserta', 400);
      }

      await prisma.tb_kelas_kejuaraan.delete({
        where: { id_kelas_kejuaraan: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Kelas kejuaraan berhasil dihapus');
    } catch (error) {
      console.error('Delete kelas kejuaraan error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Bulk Create Kelas Kejuaraan
  static async bulkCreate(req: Request, res: Response) {
    try {
      const { id_kompetisi, kelas_kejuaraan } = req.body;

      // Validate kompetisi exists
      const kompetisi = await prisma.tb_kompetisi.findUnique({
        where: { id_kompetisi }
      });

      if (!kompetisi) {
        return ApiResponse.error(res, 'Kompetisi tidak ditemukan', 404);
      }

      const createdKelas = await prisma.tb_kelas_kejuaraan.createMany({
        data: kelas_kejuaraan.map((kelas: any) => ({
          id_kompetisi,
          cabang: kelas.cabang,
          kategori_usia: kelas.kategori_usia,
          kategori_berat: kelas.kategori_berat
        })),
        skipDuplicates: true
      });

      return ApiResponse.success(res, { created: createdKelas.count }, 'Kelas kejuaraan berhasil dibuat secara bulk', 201);
    } catch (error) {
      console.error('Bulk create kelas kejuaraan error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Available Kelas for Registration
  static async getAvailableKelas(req: Request, res: Response) {
    try {
      const { id_kompetisi } = req.params;
      const { cabang, jenis_kelamin } = req.query;

      const where: any = {
        id_kompetisi: parseInt(id_kompetisi)
      };

      if (cabang) {
        where.cabang = cabang;
      }

      const kelasKejuaraan = await prisma.tb_kelas_kejuaraan.findMany({
        where,
        select: {
          id_kelas_kejuaraan: true,
          cabang: true,
          kategori_usia: true,
          kategori_berat: true,
          _count: {
            select: {
              peserta_kompetisi: true
            }
          }
        },
        orderBy: [
          { cabang: 'asc' },
          { kategori_usia: 'asc' }
        ]
      });

      return ApiResponse.success(res, kelasKejuaraan, 'Kelas kejuaraan yang tersedia berhasil diambil');
    } catch (error) {
      console.error('Get available kelas error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}