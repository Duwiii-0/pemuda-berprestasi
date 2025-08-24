import { Request, Response } from 'express';
import { DojangService } from '../services/dojangService';
import { sendSuccess, sendError } from '../utils/response';

export class DojangController {
  // Create new dojang (support public registration)
  static async create(req: Request, res: Response) {
    try {
      const dojangData = req.body;
      console.log("Payload diterima:", req.body);
      
      // Validasi minimal untuk registrasi publik
      if (!dojangData.nama_dojang || dojangData.nama_dojang.trim().length === 0) {
        return sendError(res, 'Nama dojang harus diisi', 400);
      }

      // Validasi email jika ada
      if (dojangData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dojangData.email)) {
        return sendError(res, 'Format email tidak valid', 400);
      }

      // Sanitasi data
      const sanitizedData = {
        nama_dojang: dojangData.nama_dojang.trim(),
        email: dojangData.email ? dojangData.email.trim() : null,
        no_telp: dojangData.no_telp ? dojangData.no_telp.trim() : null,
        founder: dojangData.founder ? dojangData.founder.trim() : null,
        negara: dojangData.negara ? dojangData.negara.trim() : null,
        provinsi: dojangData.provinsi ? dojangData.provinsi.trim() : null,
        kota: dojangData.kota ? dojangData.kota.trim() : null,
        id_pelatih_pendaftar: dojangData.id_pelatih_pendaftar || null, // Bisa null untuk registrasi publik
      };

      const dojang = await DojangService.createDojang(sanitizedData);
      
      return sendSuccess(res, dojang, 'Dojang berhasil didaftarkan! Menunggu persetujuan admin.', 201);
    } catch (error: any) {
      console.error('Error creating dojang:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return sendError(res, 'Nama dojang sudah terdaftar. Silakan gunakan nama lain.', 400);
      }
      
      return sendError(res, error.message || 'Terjadi kesalahan saat mendaftarkan dojang', 400);
    }
  }

  // Get all dojang with pagination and search
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await DojangService.getAllDojang(page, limit, search);
      
      return sendSuccess(res, result.data, 'Data dojang berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get pending dojangs (for admin)
  static async getPending(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DojangService.getPendingDojangs(page, limit);
      
      return sendSuccess(res, result.data, 'Data dojang pending berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Approve dojang (for admin)
  static async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { id_pelatih_pendaftar } = req.body;
      
      if (isNaN(id)) {
        return sendError(res, 'ID dojang tidak valid', 400);
      }

      if (!id_pelatih_pendaftar) {
        return sendError(res, 'ID pelatih pendaftar harus diisi', 400);
      }

      const result = await DojangService.approveDojang(id, id_pelatih_pendaftar);
      
      return sendSuccess(res, result, 'Dojang berhasil diapprove');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Reject dojang (for admin)
  static async reject(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (isNaN(id)) {
        return sendError(res, 'ID dojang tidak valid', 400);
      }

      const result = await DojangService.rejectDojang(id, reason);
      
      return sendSuccess(res, result, 'Dojang berhasil ditolak');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get dojang by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID dojang tidak valid', 400);
      }

      const dojang = await DojangService.getDojangById(id);
      
      return sendSuccess(res, dojang, 'Detail dojang berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  // Update dojang
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID dojang tidak valid', 400);
      }

      const updateData = {
        id_dojang: id,
        ...req.body
      };

      const updatedDojang = await DojangService.updateDojang(updateData);
      
      return sendSuccess(res, updatedDojang, 'Dojang berhasil diperbarui');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Delete dojang
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID dojang tidak valid', 400);
      }

      const result = await DojangService.deleteDojang(id);
      
      return sendSuccess(res, null, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get dojang by pelatih
  static async getByPelatih(req: Request, res: Response) {
    try {
      const id_pelatih = parseInt(req.params.id_pelatih);
      
      if (isNaN(id_pelatih)) {
        return sendError(res, 'ID pelatih tidak valid', 400);
      }

      const dojangList = await DojangService.getDojangByPelatih(id_pelatih);
      
      return sendSuccess(res, dojangList, 'Data dojang berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get dojang statistics
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await DojangService.getDojangStats();
      
      return sendSuccess(res, stats, 'Statistik dojang berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get dojang for current pelatih (from auth context)
  static async getMyDojang(req: Request, res: Response) {
    try {
      // Assuming user info is attached to req.user by auth middleware
      const user = (req as any).user;
      
      if (!user || !user.pelatih) {
        return sendError(res, 'Data pelatih tidak ditemukan', 401);
      }

      const dojangList = await DojangService.getDojangByPelatih(user.pelatih.id_pelatih);
      
      return sendSuccess(res, dojangList, 'Data dojang Anda berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Check dojang name availability
  static async checkNameAvailability(req: Request, res: Response) {
    try {
      const { nama_dojang } = req.query;
      
      if (!nama_dojang) {
        return sendError(res, 'Nama dojang harus diisi', 400);
      }

      const isAvailable = await DojangService.checkNameAvailability(nama_dojang as string);
      
      return sendSuccess(res, { available: isAvailable }, 'Pengecekan nama berhasil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
}