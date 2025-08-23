import { Request, Response } from 'express';
import { KompetisiService } from '../services/kompetisiService';
import { sendSuccess, sendError } from '../utils/response';
import { TypeKompetisi, StatusKompetisi, StatusPendaftaran } from '@prisma/client';

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

  // Get all kompetisi with filters
  static async getAll(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        type_kompetisi: req.query.type_kompetisi as TypeKompetisi,
        status: req.query.status as StatusKompetisi,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined
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
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

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
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      const updateData = {
        id_kompetisi: id,
        ...req.body
      };

      // Convert string dates to Date objects if provided
      if (updateData.tanggal_mulai) {
        updateData.tanggal_mulai = new Date(updateData.tanggal_mulai);
      }

      if (updateData.tanggal_selesai) {
        updateData.tanggal_selesai = new Date(updateData.tanggal_selesai);
      }

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
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      const result = await KompetisiService.deleteKompetisi(id);
      
      return sendSuccess(res, null, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Add kelas kejuaraan to kompetisi
  static async addKelasKejuaraan(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const kelasData = req.body.kelas_kejuaraan;
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      if (!Array.isArray(kelasData) || kelasData.length === 0) {
        return sendError(res, 'Data kelas kejuaraan harus berupa array dan tidak boleh kosong', 400);
      }

      const result = await KompetisiService.addKelasKejuaraan(id, kelasData);
      
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Register atlet to kompetisi
  static async registerAtlet(req: Request, res: Response) {
    try {
      const { id_atlet, id_kelas_kejuaraan } = req.body;

      if (!id_atlet || !id_kelas_kejuaraan) {
        return sendError(res, 'ID atlet dan ID kelas kejuaraan diperlukan', 400);
      }

      const registrationData = {
        id_atlet: parseInt(id_atlet),
        id_kelas_kejuaraan: parseInt(id_kelas_kejuaraan)
      };

      const pesertaKompetisi = await KompetisiService.registerAtlet(registrationData);
      
      return sendSuccess(res, pesertaKompetisi, 'Atlet berhasil didaftarkan ke kompetisi', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Update registration status
  static async updateRegistrationStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return sendError(res, 'ID pendaftaran tidak valid', 400);
      }

      if (!Object.values(StatusPendaftaran).includes(status)) {
        return sendError(res, 'Status pendaftaran tidak valid', 400);
      }

      const updatedRegistration = await KompetisiService.updateRegistrationStatus(id, status);
      
      return sendSuccess(res, updatedRegistration, 'Status pendaftaran berhasil diperbarui');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get participants of a competition
  static async getParticipants(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      const result = await KompetisiService.getKompetisiParticipants(id, page, limit);
      
      return sendSuccess(res, result.data, 'Data peserta kompetisi berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Publish kompetisi
  static async publish(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      const publishedKompetisi = await KompetisiService.publishKompetisi(id);
      
      return sendSuccess(res, publishedKompetisi, 'Kompetisi berhasil dipublikasi');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get kompetisi statistics
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await KompetisiService.getKompetisiStats();
      
      return sendSuccess(res, stats, 'Statistik kompetisi berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get published competitions (public endpoint)
  static async getPublished(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        type_kompetisi: req.query.type_kompetisi as TypeKompetisi,
        status: StatusKompetisi.PUBLISHED,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined
      };

      const result = await KompetisiService.getAllKompetisi(filters);
      
      return sendSuccess(res, result.data, 'Data kompetisi yang dipublikasi berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get upcoming competitions
  static async getUpcoming(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: StatusKompetisi.PUBLISHED,
        start_date: new Date() // Only upcoming competitions
      };

      const result = await KompetisiService.getAllKompetisi(filters);
      
      return sendSuccess(res, result.data, 'Data kompetisi mendatang berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get competition classes for registration
  static async getCompetitionClasses(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID kompetisi tidak valid', 400);
      }

      const kompetisi = await KompetisiService.getKompetisiById(id);
      
      if (kompetisi.status !== StatusKompetisi.PUBLISHED) {
        return sendError(res, 'Kompetisi belum dipublikasi', 400);
      }

      return sendSuccess(res, kompetisi.kelas_kejuaraan, 'Data kelas kejuaraan berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  
  // Bulk register atlet
  static async bulkRegisterAtlet(req: Request, res: Response) {
  type RegistrationResult = Awaited<ReturnType<typeof KompetisiService.registerAtlet>>;
  
  try {
    const { registrations } = req.body;

    if (!Array.isArray(registrations) || registrations.length === 0) {
      return sendError(res, 'Data pendaftaran harus berupa array dan tidak boleh kosong', 400);
    }

    // ⬇️ kasih tipe eksplisit
    const results: RegistrationResult[] = [];
    const errors: { index: number; registration: any; error: string }[] = [];

    for (let i = 0; i < registrations.length; i++) {
      try {
        const registration = registrations[i];
        const result = await KompetisiService.registerAtlet({
          id_atlet: parseInt(registration.id_atlet),
          id_kelas_kejuaraan: parseInt(registration.id_kelas_kejuaraan)
        });
        results.push(result);
      } catch (error: any) {
        errors.push({
          index: i,
          registration: registrations[i],
          error: error.message
        });
      }
    }

    return sendSuccess(res, {
      successful: results,
      failed: errors,
      summary: {
        total: registrations.length,
        successful: results.length,
        failed: errors.length
      }
    }, 'Proses pendaftaran massal selesai');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

}