import { Request, Response } from 'express';
import { KompetisiService } from '../services/kompetisiService';
import { sendSuccess, sendError } from '../utils/response';
import { StatusKompetisi } from '@prisma/client';

export class KompetisiController {
  // Create new kompetisi
  static async create(req: Request, res: Response) {
    try {
      const kompetisiData = req.body;

      // Convert string dates to Date objects
      if (kompetisiData.tanggal_mulai) {
        kompetisiData.tanggal_mulai = new Date(kompetisiData.tanggal_mulai);
      }
      if (kompetisiData.tanggal_selesai) {
        kompetisiData.tanggal_selesai = new Date(kompetisiData.tanggal_selesai);
      }

      const kompetisi = await KompetisiService.createKompetisi(kompetisiData);
      return sendSuccess(res, kompetisi, 'Kompetisi berhasil dibuat', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get all kompetisi with optional filters
  static async getAll(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        status: req.query.status as StatusKompetisi,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      };

      const result = await KompetisiService.getAllKompetisi(filters);
      return sendSuccess(res, result.data, 'Data kompetisi berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get kompetisi by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const kompetisi = await KompetisiService.getKompetisiById(id);
      return sendSuccess(res, kompetisi, 'Detail kompetisi berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  // Update kompetisi
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const updateData = {
        id_kompetisi: id,
        ...req.body,
      };

      // Convert string dates to Date objects if provided
      if (updateData.tanggal_mulai) updateData.tanggal_mulai = new Date(updateData.tanggal_mulai);
      if (updateData.tanggal_selesai) updateData.tanggal_selesai = new Date(updateData.tanggal_selesai);

      const updatedKompetisi = await KompetisiService.updateKompetisi(updateData);
      return sendSuccess(res, updatedKompetisi, 'Kompetisi berhasil diperbarui');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Delete kompetisi
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 'ID kompetisi tidak valid', 400);

      const result = await KompetisiService.deleteKompetisi(id);
      return sendSuccess(res, null, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
