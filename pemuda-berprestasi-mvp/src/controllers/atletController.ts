import { Request, Response } from 'express';
import { AtletService } from '../services/atletService';
import { sendSuccess, sendError } from '../utils/response';
import { JenisKelamin } from '@prisma/client';
import prisma from '../config/database'

// Define Multer file interface locally
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export class AtletController {
  // Create new atlet
  static async create(req: Request, res: Response) {
  try {
    const files = req.files as { [fieldname: string]: MulterFile[] };
    
    const atletData: any = {
      ...req.body,
      akte_kelahiran: files?.akte_kelahiran?.[0]?.filename,
      pas_foto: files?.pas_foto?.[0]?.filename,
      sertifikat_belt: files?.sertifikat_belt?.[0]?.filename,
      ktp: files?.ktp?.[0]?.filename,
    };
    
    // Convert string date to Date object
    if (atletData.tanggal_lahir) {
      atletData.tanggal_lahir = new Date(atletData.tanggal_lahir);
    }

    // Convert weight and height to numbers
    if (atletData.berat_badan) {
      atletData.berat_badan = parseFloat(atletData.berat_badan);
    }

    if (atletData.tinggi_badan) { 
      atletData.tinggi_badan = parseFloat(atletData.tinggi_badan);
    }

    const atlet = await AtletService.createAtlet(atletData);

    return sendSuccess(res, atlet, 'Atlet berhasil dibuat', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}


  // Get all atlet with filters and pagination
  static async getAll(req: Request, res: Response) {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 100,
        search: req.query.search as string,
        id_dojang: req.query.id_dojang ? parseInt(req.query.id_dojang as string) : undefined,
        jenis_kelamin: req.query.jenis_kelamin as JenisKelamin,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
        min_weight: req.query.min_weight ? parseFloat(req.query.min_weight as string) : undefined,
        max_weight: req.query.max_weight ? parseFloat(req.query.max_weight as string) : undefined
      };

      const result = await AtletService.getAllAtlet(filters);
      
      return sendSuccess(res, result.data, 'Data atlet berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get atlet by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID atlet tidak valid', 400);
      }

      const atlet = await AtletService.getAtletById(id);
      
      return sendSuccess(res, atlet, 'Detail atlet berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  // Update atlet
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID atlet tidak valid', 400);
      }

      const updateData = {
        id_atlet: id,
        ...req.body
      };

      // Convert string date to Date object if provided
      if (updateData.tanggal_lahir) {
        updateData.tanggal_lahir = new Date(updateData.tanggal_lahir);
      }

      // Convert weight and height to numbers if provided
      if (updateData.berat_badan) {
        updateData.berat_badan = parseFloat(updateData.berat_badan);
      }

      if (updateData.tinggi_badan) {
        updateData.tinggi_badan = parseFloat(updateData.tinggi_badan);
      }

      const updatedAtlet = await AtletService.updateAtlet(updateData);
      
      return sendSuccess(res, updatedAtlet, 'Atlet berhasil diperbarui');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Delete atlet
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID atlet tidak valid', 400);
      }

      const result = await AtletService.deleteAtlet(id);
      
      return sendSuccess(res, null, result.message);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

    // Get atlet by dojang
    static async getByDojang(req: Request, res: Response) {
      try {
        const id_dojang = parseInt(req.params.id_dojang);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 1000;
        if (isNaN(id_dojang)) {
          return sendError(res, 'ID dojang tidak valid', 400);
        }

        const result = await AtletService.getAtletByDojang(id_dojang, page, limit);
        
        return sendSuccess(res, result.data, 'Data atlet berhasil diambil', 200, result.pagination);
      } catch (error: any) {
        return sendError(res, error.message, 500);
      }
    }

  // Get eligible atlet for competition class
  static async getEligible(req: Request, res: Response) {
  try {
    const { kelasId, dojangId, gender, kelompokUsiaId, kelasBeratId } = req.body;

    console.log("🔄 Controller received:", { 
      kelasId, 
      dojangId, 
      gender, 
      kelompokUsiaId, 
      kelasBeratId 
    });

    // ✅ Validation
    if (!kelasId) {
      return res.status(400).json({ message: "kelasId is required" });
    }

    if (!dojangId) {
      return res.status(400).json({ message: "dojangId is required" });
    }

    if (!gender) {
      return res.status(400).json({ message: "gender is required" });
    }

    // ✅ Map gender value to match database enum
    const jenisKelamin = gender === 'LAKI_LAKI' || gender === 'PEREMPUAN' 
      ? gender 
      : gender.toUpperCase() as 'LAKI_LAKI' | 'PEREMPUAN';

    console.log("🎯 Mapped jenis_kelamin:", jenisKelamin);

    const filter = {
      id_dojang: Number(dojangId),
      jenis_kelamin: jenisKelamin,
      kelompokUsiaId: kelompokUsiaId ? Number(kelompokUsiaId) : undefined,
      kelasBeratId: kelasBeratId ? Number(kelasBeratId) : undefined,
    };

    console.log("📋 Service filter:", filter);

    const eligibleAtlits = await AtletService.getEligible(kelasId, filter);
    
    console.log("👥 Found eligible atlits:", eligibleAtlits?.length || 0);

    // ✅ Mapping untuk format yang konsisten
    const formattedAtlits = eligibleAtlits.map(atlet => ({
      id: atlet.id_atlet,
      nama: atlet.nama_atlet,
      provinsi: atlet.provinsi,
      bb: atlet.berat_badan,
      tb: atlet.tinggi_badan,
      belt: atlet.belt,
      umur: atlet.umur,
      jenis_kelamin: atlet.jenis_kelamin,
      dojang: atlet.dojang?.nama_dojang
    }));

    console.log("📤 Formatted response:", formattedAtlits);
    res.json(formattedAtlits);
    
  } catch (err) {
    console.error("❌ Error fetching eligible atlits:", err);
    res.status(500).json({ 
      message: "Internal server error", 
      error: process.env.NODE_ENV === 'development' ? err : undefined 
    });
  }
  }

  // Get atlet statistics
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AtletService.getAtletStats();
      
      return sendSuccess(res, stats, 'Statistik atlet berhasil diambil');
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Get atlet for current pelatih (from auth context)


  // Upload atlet documents
  static async uploadDocuments(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 'ID atlet tidak valid', 400);
      }

      // Check if atlet exists
      const atlet = await AtletService.getAtletById(id);
      
      if (!atlet) {
        return sendError(res, 'Atlet tidak ditemukan', 404);
      }

      // Handle file uploads (assuming files are processed by multer middleware)
      const files = req.files as any;
      const updateData: any = { id_atlet: id };

      if (files?.akte_kelahiran) {
        updateData.akte_kelahiran = files.akte_kelahiran[0].filename;
      }

      if (files?.pas_foto) {
        updateData.pas_foto = files.pas_foto[0].filename;
      }

      if (files?.sertifikat_belt) {
        updateData.sertifikat_belt = files.sertifikat_belt[0].filename;
      }

      if (files?.ktp) {
        updateData.ktp = files.ktp[0].filename;
      }

      const updatedAtlet = await AtletService.updateAtlet(updateData);
      
      return sendSuccess(res, updatedAtlet, 'Dokumen atlet berhasil diupload');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Get all athletes in a competition
static async getByKompetisi(req: Request, res: Response) {
  try {
    const id_kompetisi = parseInt(req.params.id_kompetisi);
    const cabang = (req.query.cabang as 'KYORUGI' | 'POOMSAE') || undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;

    if (isNaN(id_kompetisi)) {
      return sendError(res, 'ID kompetisi tidak valid', 400);
    }

    // Panggil service
    const atletList = await AtletService.getAtletByKompetisi(id_kompetisi, cabang);

    // Pagination manual
    const totalItems = atletList.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedData = atletList.slice((page - 1) * limit, page * limit);

    return sendSuccess(
      res,
      paginatedData,
      'Data atlet berhasil diambil',
      200,
      {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    );
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

}
