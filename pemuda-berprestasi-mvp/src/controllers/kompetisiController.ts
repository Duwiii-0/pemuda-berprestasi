import { Request, Response } from 'express';
import { KompetisiService } from '../services/kompetisiService';
import { sendSuccess, sendError } from '../utils/response';
import { StatusKompetisi } from '@prisma/client';
import prisma from '../config/database';

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
        limit: parseInt(req.query.limit as string) || 100,
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

  static async registerAtlet(req: Request, res: Response) {
  try {
    const { atlitId, kelasKejuaraanId, atlitId2 } = req.body;

    if (!atlitId || !kelasKejuaraanId) {
      return sendError(res, 'atlitId dan kelasKejuaraanId wajib diisi', 400);
    }

    if (atlitId2 && atlitId === atlitId2) {
      return sendError(res, 'Atlet pertama dan kedua tidak boleh sama', 400);
    }

    // Tentukan apakah ini pendaftaran tim
    let isTeam = false;
    if (atlitId2) {
      const kelas = await prisma.tb_kelas_kejuaraan.findUnique({
        where: { id_kelas_kejuaraan: Number(kelasKejuaraanId) },
      });
      // Asumsinya jika Poomsae dan kelas beregu/berpasangan
      if (kelas?.cabang === "POOMSAE") {
        isTeam = true;
      }
    }

    const registrationData = {
      atlitId: Number(atlitId),
      kelasKejuaraanId: Number(kelasKejuaraanId),
      ...(atlitId2 ? { atlitId2: Number(atlitId2) } : {}),
      isTeam,
    };

    const peserta = await KompetisiService.registerAtlet(registrationData);

    const message = isTeam
      ? 'Tim atlet berhasil didaftarkan ke kelas kejuaraan'
      : 'Atlet berhasil didaftarkan ke kelas kejuaraan';

    return sendSuccess(res, peserta, message, 201);
    
  } catch (error: any) {
    console.error("❌ Controller - Registration error:", error);
    return sendError(res, error.message, 400);
  }
}


  static async getAtletsByKompetisi(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = "1", limit = "1000", id_dojang: idDojangQuery } = req.query; // ⬅️ ambil query
      let idDojang: number | undefined = undefined;

      const kompetisiId = parseInt(id, 10);
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      if (isNaN(kompetisiId)) {
        return res.status(400).json({ message: "Invalid kompetisiId" });
      }
      console.log("Role:", req.user?.role, "idDojang:", idDojang);

      // role PELATIH → selalu pakai id_dojang dari token
      if (req.user?.role === "PELATIH" && req.user.id_dojang) {
        idDojang = req.user.id_dojang;
      }
      // role ADMIN → boleh filter manual lewat query
      else if (req.user?.role === "ADMIN" && idDojangQuery) {
        idDojang = parseInt(idDojangQuery as string, 10);
      }


      const result = await KompetisiService.getAtletsByKompetisi(
        kompetisiId,
        pageNum,
        limitNum,
        idDojang
      );

      return res.status(200).json({
        success: true,
        data: result.peserta,
        total: result.total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error: any) {
      console.error("Error getAtletsByKompetisi:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch atlet by kompetisi",
        error: error.message,
      });
    }
  }
  
  static async updateRegistrationStatus(req: Request, res: Response) {
    try {
      const { id, participantId } = req.params;
      const { status } = req.body;

      if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedPeserta = await KompetisiService.updateRegistrationStatus(
        Number(id),
        Number(participantId),
        status
      );

      return res.status(200).json({
        message: "Status peserta berhasil diperbarui",
        data: updatedPeserta,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

}
