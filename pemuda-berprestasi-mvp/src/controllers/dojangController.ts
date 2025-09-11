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

  static async create(req: Request, res: Response) {
    try {
      const dojang = await DojangService.createDojang(req.body);
      res.status(201).json(dojang);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // AUTHENTICATED
  static async getMyDojang(req: Request, res: Response) {
  try {
    const idAkun = (req.user as any)?.id_akun;
    if (!idAkun) throw new Error("id_akun tidak ditemukan di token");

    // cari pelatih berdasarkan id_akun
    const pelatih = await prisma.tb_pelatih.findUnique({
      where: { id_akun: idAkun },
      include: { dojang: true },
    });

    if (!pelatih) throw new Error("Pelatih tidak ditemukan");

  res.json({ data: pelatih.dojang });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
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
        Number(limit) || 10,
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
      const dojang = await DojangService.updateDojang({ id_dojang: id, ...req.body });
      res.json({ success: true, data: dojang });
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

export default DojangController;