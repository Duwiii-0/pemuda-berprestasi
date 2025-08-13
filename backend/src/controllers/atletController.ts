import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { paginate } from '../utils/pagination';

const prisma = new PrismaClient();

export class AtletController {
  // Create Atlet
  static async create(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { 
        nama_atlet, 
        tanggal_lahir, 
        jenis_kelamin, 
        id_dojang 
      } = req.body;

      const files = req.files as any;

      // Validate required files
      if (!files?.akte_kelahiran || !files?.pas_foto || !files?.sertifikat_belt) {
        return ApiResponse.error(res, 'File akte kelahiran, pas foto, dan sertifikat belt wajib diupload', 400);
      }

      // Check if dojang exists and belongs to the pelatih
      const dojang = await prisma.tb_dojang.findFirst({
        where: {
          id_dojang,
          id_pelatih_pendaftar: id_pelatih,
          status: 'ACTIVE'
        }
      });

      if (!dojang) {
        return ApiResponse.error(res, 'Dojang tidak ditemukan atau tidak aktif', 404);
      }

      const newAtlet = await prisma.tb_atlet.create({
        data: {
          nama_atlet,
          tanggal_lahir: new Date(tanggal_lahir),
          jenis_kelamin,
          id_dojang,
          id_pelatih_pembuat: id_pelatih,
          akte_kelahiran: files.akte_kelahiran[0].filename,
          pas_foto: files.pas_foto[0].filename,
          sertifikat_belt: files.sertifikat_belt[0].filename,
          ktp: files.ktp ? files.ktp[0].filename : null
        },
        include: {
          dojang: {
            select: {
              id_dojang: true,
              nama_dojang: true
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

      return ApiResponse.success(res, newAtlet, 'Atlet berhasil didaftarkan', 201);
    } catch (error) {
      console.error('Create atlet error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get All Atlets with pagination and filters
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, jenis_kelamin, id_dojang } = req.query;

      const where: any = {};

      if (search) {
        where.nama_atlet = {
          contains: search as string,
          mode: 'insensitive'
        };
      }

      if (jenis_kelamin) {
        where.jenis_kelamin = jenis_kelamin;
      }

      if (id_dojang) {
        where.id_dojang = parseInt(id_dojang as string);
      }

      const { data, pagination } = await paginate(
        prisma.tb_atlet,
        {
          where,
          include: {
            dojang: {
              select: {
                id_dojang: true,
                nama_dojang: true,
                wilayah: {
                  select: {
                    provinsi: true,
                    kota: true
                  }
                }
              }
            },
            pelatih_pembuat: {
              select: {
                id_pelatih: true,
                nama_pelatih: true
              }
            }
          },
          orderBy: { id_atlet: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { atlets: data, pagination }, 'Atlet berhasil diambil');
    } catch (error) {
      console.error('Get all atlets error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Atlet by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const atlet = await prisma.tb_atlet.findUnique({
        where: { id_atlet: parseInt(id) },
        include: {
          dojang: {
            include: {
              wilayah: true
            }
          },
          pelatih_pembuat: {
            select: {
              id_pelatih: true,
              nama_pelatih: true,
              email: true
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
                  }
                }
              }
            }
          }
        }
      });

      if (!atlet) {
        return ApiResponse.error(res, 'Atlet tidak ditemukan', 404);
      }

      return ApiResponse.success(res, atlet, 'Atlet berhasil diambil');
    } catch (error) {
      console.error('Get atlet by id error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Atlets by Pelatih
  static async getByPelatih(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { page = 1, limit = 10, search, jenis_kelamin, id_dojang } = req.query;

      const where: any = {
        id_pelatih_pembuat: id_pelatih
      };

      if (search) {
        where.nama_atlet = {
          contains: search as string,
          mode: 'insensitive'
        };
      }

      if (jenis_kelamin) {
        where.jenis_kelamin = jenis_kelamin;
      }

      if (id_dojang) {
        where.id_dojang = parseInt(id_dojang as string);
      }

      const { data, pagination } = await paginate(
        prisma.tb_atlet,
        {
          where,
          include: {
            dojang: {
              select: {
                id_dojang: true,
                nama_dojang: true
              }
            }
          },
          orderBy: { id_atlet: 'desc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { atlets: data, pagination }, 'Atlet pelatih berhasil diambil');
    } catch (error) {
      console.error('Get atlets by pelatih error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Atlets by Dojang
  static async getByDojang(req: Request, res: Response) {
    try {
      const { id_dojang } = req.params;
      const { page = 1, limit = 10, search, jenis_kelamin } = req.query;

      const where: any = {
        id_dojang: parseInt(id_dojang)
      };

      if (search) {
        where.nama_atlet = {
          contains: search as string,
          mode: 'insensitive'
        };
      }

      if (jenis_kelamin) {
        where.jenis_kelamin = jenis_kelamin;
      }

      const { data, pagination } = await paginate(
        prisma.tb_atlet,
        {
          where,
          select: {
            id_atlet: true,
            nama_atlet: true,
            tanggal_lahir: true,
            jenis_kelamin: true,
            pas_foto: true
          },
          orderBy: { nama_atlet: 'asc' }
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, { atlets: data, pagination }, 'Atlet dojang berhasil diambil');
    } catch (error) {
      console.error('Get atlets by dojang error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Atlet
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { id_pelatih } = req.user;
      const { nama_atlet, tanggal_lahir, jenis_kelamin, id_dojang } = req.body;
      const files = req.files as any;

      // Check if atlet exists and belongs to the pelatih
      const existingAtlet = await prisma.tb_atlet.findFirst({
        where: {
          id_atlet: parseInt(id),
          id_pelatih_pembuat: id_pelatih
        }
      });

      if (!existingAtlet) {
        return ApiResponse.error(res, 'Atlet tidak ditemukan atau tidak memiliki akses', 404);
      }

      // If changing dojang, validate it
      if (id_dojang && id_dojang !== existingAtlet.id_dojang) {
        const dojang = await prisma.tb_dojang.findFirst({
          where: {
            id_dojang,
            id_pelatih_pendaftar: id_pelatih,
            status: 'ACTIVE'
          }
        });

        if (!dojang) {
          return ApiResponse.error(res, 'Dojang tidak ditemukan atau tidak aktif', 404);