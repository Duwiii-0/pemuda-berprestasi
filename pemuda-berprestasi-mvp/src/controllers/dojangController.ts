import { Request, Response } from 'express';
import { DojangService } from '../services/dojangService';
import { successResponse, errorResponse } from '../utils/response';

export class DojangController {
  // Create new dojang
  static async create(req: Request, res: Response) {
    try {
      const dojangData = req.body;
      const dojang = await DojangService.createDojang(dojangData);
      
      return successResponse(res, dojang, 'Dojang berhasil dibuat', 201);
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all dojang with pagination and search
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await DojangService.getAllDojang(page, limit, search);
      
      return successResponse(res, result.data, 'Data dojang berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return errorResponse(res, error.message, 500);
    }
  }

  // Get dojang by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return errorResponse(res, 'ID dojang tidak valid', 400);
      }

      const dojang = await DojangService.getDojangById(id);
      
      return successResponse(res, dojang, 'Detail dojang berhasil diambil');
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update dojang
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return errorResponse(res, 'ID dojang tidak valid', 400);
      }

      const updateData = {
        id_dojang: id,
        ...req.body
      };

      const updatedDojang = await DojangService.updateDojang(updateData);
      
      return successResponse(res, updatedDojang, 'Dojang berhasil diperbarui');
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete dojang
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return errorResponse(res, 'ID dojang tidak valid', 400);
      }

      const result = await DojangService.deleteDojang(id);
      
      return successResponse(res, null, result.message);
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get dojang by pelatih
  static async getByPelatih(req: Request, res: Response) {
    try {
      const id_pelatih = parseInt(req.params.id_pelatih);
      
      if (isNaN(id_pelatih)) {
        return errorResponse(res, 'ID pelatih tidak valid', 400);
      }

      const dojangList = await DojangService.getDojangByPelatih(id_pelatih);
      
      return successResponse(res, dojangList, 'Data dojang berhasil diambil');
    } catch (error: any) {
      return errorResponse(res, error.message, 500);
    }
  }

  // Get dojang statistics
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await DojangService.getDojangStats();
      
      return successResponse(res, stats, 'Statistik dojang berhasil diambil');
    } catch (error: any) {
      return errorResponse(res, error.message, 500);
    }
  }

  // Get dojang for current pelatih (from auth context)
  static async getMyDojang(req: Request, res: Response) {
    try {
      // Assuming user info is attached to req.user by auth middleware
      const user = (req as any).user;
      
      if (!user || !user.pelatih) {
        return errorResponse(res, 'Data pelatih tidak ditemukan', 401);
      }

      const dojangList = await DojangService.getDojangByPelatih(user.pelatih.id_pelatih);
      
      return successResponse(res, dojangList, 'Data dojang Anda berhasil diambil');
    } catch (error: any) {
      return errorResponse(res, error.message, 500);
    }
  }
}