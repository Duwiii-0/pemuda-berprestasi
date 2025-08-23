import { Request, Response } from 'express';
import { DojangService } from '../services/dojangService';
import { sendSuccess, sendError } from '../utils/response';

export class DojangController {
  // Create new dojang
  static async create(req: Request, res: Response) {
    try {
      const dojangData = req.body;
      const dojang = await DojangService.createDojang(dojangData);
      
      return sendSuccess(res, dojang, 'Dojang berhasil dibuat', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
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
}