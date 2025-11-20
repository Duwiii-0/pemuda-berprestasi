// src/controllers/atletController.ts - DENGAN DEBUG LOGGING
import { Request, Response } from 'express';
import { AtletService } from '../services/atletService';
import { sendSuccess, sendError } from '../utils/response';
import { JenisKelamin } from '@prisma/client';

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
static async create(req: Request, res: Response) {
  try {
    console.log("🔍 DEBUG: Request received")
    console.log("📋 Body:", JSON.stringify(req.body, null, 2))
    console.log("📎 Files:", req.files ? Object.keys(req.files) : 'No files')
    
    const files = req.files as { [fieldname: string]: MulterFile[] }
    
    // Validasi files received
    if (files) {
      Object.keys(files).forEach(key => {
        const file = files[key][0]
        console.log(`✅ File ${key}:`, {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          destination: file.destination,
          mimetype: file.mimetype
        })
      })
    } else {
      console.log("⚠️ WARNING: No files received")
    }

    // Prepare data dengan null fallback yang aman
    const atletData = {
      ...req.body,
      akte_kelahiran: files?.akte_kelahiran?.[0]?.filename || null,
      pas_foto: files?.pas_foto?.[0]?.filename || null, 
      sertifikat_belt: files?.sertifikat_belt?.[0]?.filename || null,
      ktp: files?.ktp?.[0]?.filename || null,
    }

    // Data type conversion
    if (atletData.tanggal_lahir) {
      atletData.tanggal_lahir = new Date(atletData.tanggal_lahir)
    }

    if (atletData.berat_badan) {
      atletData.berat_badan = parseFloat(atletData.berat_badan)
    }

    if (atletData.tinggi_badan) {
      atletData.tinggi_badan = parseFloat(atletData.tinggi_badan) 
    }

    // Convert string ke number untuk foreign keys
    if (atletData.id_dojang) {
      atletData.id_dojang = parseInt(atletData.id_dojang)
    }

    if (atletData.id_pelatih_pembuat) {
      atletData.id_pelatih_pembuat = parseInt(atletData.id_pelatih_pembuat)
    }

    console.log("🚀 Final data to create:", {
      nama_atlet: atletData.nama_atlet,
      jenis_kelamin: atletData.jenis_kelamin,
      id_dojang: atletData.id_dojang,
      id_pelatih_pembuat: atletData.id_pelatih_pembuat,
      files: {
        akte_kelahiran: atletData.akte_kelahiran,
        pas_foto: atletData.pas_foto,
        sertifikat_belt: atletData.sertifikat_belt,
        ktp: atletData.ktp
      }
    })

    const atlet = await AtletService.createAtlet(atletData)
    console.log("✅ Atlet created with ID:", atlet?.id_atlet)

    return sendSuccess(res, atlet, 'Atlet berhasil dibuat', 201)
  } catch (error: any) {
    console.error("❌ Controller Error:", error.message)
    console.error("📝 Stack:", error.stack)
    return sendError(res, error.message, 400)
  }
}

  // Update atlet
  // Update atlet - FIXED VERSION (following dojang pattern)
static async update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendError(res, 'ID atlet tidak valid', 400);
    }

    console.log("🔄 Updating atlet ID:", id);
    console.log("📋 Request body:", req.body);
    console.log("📎 Files received:", req.files ? Object.keys(req.files) : 'No files');

    // Handle uploaded files (following dojang pattern)
    const files = req.files as { [fieldname: string]: MulterFile[] };
    
    const updateData: any = {
      id_atlet: id,
      ...req.body
    };

    // Add file filenames if files are uploaded (just like dojang logo)
    if (files?.akte_kelahiran?.[0]) {
      updateData.akte_kelahiran = files.akte_kelahiran[0].filename;
      console.log("✅ Akte kelahiran file:", files.akte_kelahiran[0].filename);
    }

    if (files?.pas_foto?.[0]) {
      updateData.pas_foto = files.pas_foto[0].filename;
      console.log("✅ Pas foto file:", files.pas_foto[0].filename);
    }

    if (files?.sertifikat_belt?.[0]) {
      updateData.sertifikat_belt = files.sertifikat_belt[0].filename;
      console.log("✅ Sertifikat belt file:", files.sertifikat_belt[0].filename);
    }

    if (files?.ktp?.[0]) {
      updateData.ktp = files.ktp[0].filename;
      console.log("✅ KTP file:", files.ktp[0].filename);
    }

    // Convert data types (same as before)
    if (updateData.tanggal_lahir) {
      updateData.tanggal_lahir = new Date(updateData.tanggal_lahir);
    }

    if (updateData.berat_badan) {
      updateData.berat_badan = parseFloat(updateData.berat_badan);
    }

    if (updateData.tinggi_badan) {
      updateData.tinggi_badan = parseFloat(updateData.tinggi_badan);
    }

    console.log("🚀 Final update data:", updateData);

    const updatedAtlet = await AtletService.updateAtlet(updateData);
    
    console.log("✅ Update successful:", updatedAtlet?.id_atlet);
    
    return sendSuccess(res, updatedAtlet, 'Atlet berhasil diperbarui');
  } catch (error: any) {
    console.error("❌ Update error:", error.message);
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

  // Get all atlet
  static async getAll(req: Request, res: Response) {
    try {
      console.log("🔍 DEBUG: Getting all atlet with query:", req.query);
      
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 1000,
        search: req.query.search as string,
        id_dojang: req.query.id_dojang ? parseInt(req.query.id_dojang as string) : undefined,
        jenis_kelamin: req.query.jenis_kelamin as JenisKelamin,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
        min_weight: req.query.min_weight ? parseFloat(req.query.min_weight as string) : undefined,
        max_weight: req.query.max_weight ? parseFloat(req.query.max_weight as string) : undefined
      };

      console.log("🎯 DEBUG: Parsed filters:", filters);

      const result = await AtletService.getAllAtlet(filters);
      
      console.log(`✅ DEBUG: Found ${result.data.length} atlet`);
      
      return sendSuccess(res, result.data, 'Data atlet berhasil diambil', 200, result.pagination);
    } catch (error: any) {
      console.error("❌ DEBUG: Error in getAll:", error);
      return sendError(res, error.message, 500);
    }
  }

  // Get atlet by ID
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      console.log("🔍 DEBUG: Getting atlet with ID:", id);

      if (isNaN(id)) {
        console.log("⚠️ DEBUG: Invalid ID provided");
        return sendError(res, 'ID atlet tidak valid', 400);
      }

      const atlet = await AtletService.getAtletById(id);
      
      if (!atlet) {
        console.log("⚠️ DEBUG: Atlet not found");
        return sendError(res, 'Atlet tidak ditemukan', 404);
      }

      console.log("✅ DEBUG: Atlet found:", atlet.id_atlet);
      
      return sendSuccess(res, atlet, 'Data atlet berhasil diambil');
    } catch (error: any) {
      console.error("❌ DEBUG: Error in getById:", error);
      return sendError(res, error.message, 500);
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
