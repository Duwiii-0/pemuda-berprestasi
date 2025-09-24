import { Request, Response } from 'express';
import { DojangService } from '../services/dojangService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DojangController {
  // PUBLIC
  static async checkNameAvailability(req: Request, res: Response) {
    try {
      const available = await DojangService.checkNameAvailability(req.query.nama as string);
      res.json({ available });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      // contoh: hitung total dojang
      const result = await DojangService.getAllDojang(1, 1000);
      res.json({ totalDojang: result.pagination.totalItems });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

// Tambahkan ini di DojangController.create untuk debugging
static async create(req: Request, res: Response) {
  try {
    // DEBUGGING EXTENSIVE
    console.log('=== FULL DEBUG ===');
    console.log('req.body exists:', !!req.body);
    console.log('req.body:', req.body);
    console.log('req.body type:', typeof req.body);
    console.log('req.file exists:', !!req.file);
    console.log('req.file:', req.file);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('nama_dojang value:', req.body?.nama_dojang);
    console.log('nama_dojang type:', typeof req.body?.nama_dojang);
    console.log('==================');

    // TEMPORARY: Return immediately untuk test
    return res.status(200).json({
      success: true,
      message: 'Debug test - controller reached',
      debug: {
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        hasFile: !!req.file,
        namaDojang: req.body?.nama_dojang
      }
    });

    // Comment out semua code di bawah ini sementara
    /*
    const createData = { ...req.body };
    
    if (req.file && req.file.fieldname === 'logo') {
      createData.logo = req.file.filename;
    }
    
    const dojang = await DojangService.createDojang(createData);
    
    const responseData = {
      ...dojang,
      logo_url: dojang.logo ? `/uploads/dojang/logos/${dojang.logo}` : null
    };
    
    res.status(201).json({
      success: true,
      message: 'Dojang berhasil didaftarkan',
      data: responseData
    });
    */
  } catch (err: any) {
    console.error('❌ Create dojang error:', err.message);
    console.error('❌ Full error:', err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
}

  // AUTHENTICATED
static async getMyDojang(req: Request, res: Response) {
  try {
    const idAkun = (req.user as any)?.id_akun;
    if (!idAkun) {
      return res.status(401).json({ 
        message: "id_akun tidak ditemukan di token",
        data: null 
      });
    }

    console.log('🔍 getMyDojang - idAkun:', idAkun);

    // cari pelatih berdasarkan id_akun
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_akun: idAkun },
      include: { dojang: true },
    });

    console.log('👤 Pelatih found:', !!pelatih);
    console.log('🏢 Dojang exists:', !!pelatih?.dojang);

    if (!pelatih) {
      return res.status(404).json({ 
        message: "Pelatih tidak ditemukan",
        data: null 
      });
    }

    // PERBAIKAN: Handle case dimana pelatih belum punya dojang
    if (!pelatih.dojang) {
      console.log('⚠️ Pelatih belum memiliki dojang');
      return res.status(200).json({ 
        message: "Pelatih belum memiliki dojang",
        data: null 
      });
    }

    // TAMBAHAN: Add logo_url untuk frontend
    const dojangWithLogo = {
      ...pelatih.dojang,
      logo_url: pelatih.dojang.logo ? `/uploads/dojang/logos/${pelatih.dojang.logo}` : null
    };

    console.log('✅ Returning dojang:', dojangWithLogo.nama_dojang);
    
    // PERBAIKAN: Return format yang konsisten
    res.status(200).json(dojangWithLogo);
    
  } catch (err: any) {
    console.error('❌ getMyDojang Error:', err.message);
    res.status(500).json({ 
      message: `Database error: ${err.message}`,
      data: null 
    });
  }
}


  static async getByPelatih(req: Request, res: Response) {
    try {
      const idPelatih = parseInt(req.params.id_pelatih);
      const dojang = await DojangService.getByPelatih(idPelatih);
      res.json(dojang);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const { page, limit, search } = req.query;
      const result = await DojangService.getAllDojang(
        Number(page) || 1,
        Number(limit) || 1000,
        search as string
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dojang = await DojangService.getDojangById(id);
      res.json(dojang);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

static async update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    // TAMBAHAN: Prepare data dengan logo jika ada file upload
    const updateData = { 
      id_dojang: id, 
      ...req.body 
    };

    // TAMBAHAN: Handle logo upload
    if (req.file && req.file.fieldname === 'logo') {
      updateData.logo = req.file.filename;
      console.log('Logo uploaded:', req.file.filename);
    }

    const dojang = await DojangService.updateDojang(updateData);
    
    // TAMBAHAN: Return dengan logo_url untuk frontend
    const responseData = {
      ...dojang,
      logo_url: dojang.logo ? `/uploads/dojang/logos/${dojang.logo}` : null
    };
    
    res.json({ success: true, data: responseData });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await DojangService.deleteDojang(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}