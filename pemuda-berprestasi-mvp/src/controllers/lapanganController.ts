import { Request, Response } from "express";
import lapanganService from "../services/lapangan.service";

export class LapanganController {
  async tambahHariLapangan(req: Request, res: Response) {
    try {
      const { id_kompetisi } = req.body;

      if (!id_kompetisi) {
        return res.status(400).json({
          success: false,
          message: "id_kompetisi harus diisi",
        });
      }

      const result = await lapanganService.tambahHariLapangan({
        id_kompetisi: parseInt(id_kompetisi),
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error tambah hari lapangan:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Terjadi kesalahan saat menambah hari lapangan",
      });
    }
  }

  async tambahLapanganKeHari(req: Request, res: Response) {
    try {
      const { id_kompetisi, tanggal } = req.body;

      if (!id_kompetisi || !tanggal) {
        return res.status(400).json({
          success: false,
          message: "id_kompetisi dan tanggal harus diisi",
        });
      }

      const result = await lapanganService.tambahLapanganKeHari({
        id_kompetisi: parseInt(id_kompetisi),
        tanggal,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error tambah lapangan:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menambah lapangan",
      });
    }
  }

  async hapusLapangan(req: Request, res: Response) {
    try {
      const { id_lapangan } = req.body;

      if (!id_lapangan) {
        return res.status(400).json({
          success: false,
          message: "id_lapangan harus diisi",
        });
      }

      const result = await lapanganService.hapusLapangan(parseInt(id_lapangan));

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error hapus lapangan:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menghapus lapangan",
      });
    }
  }

  async getHariLapanganByKompetisi(req: Request, res: Response) {
    try {
      const { id_kompetisi } = req.params;

      if (!id_kompetisi) {
        return res.status(400).json({
          success: false,
          message: "id_kompetisi harus diisi",
        });
      }

      const result = await lapanganService.getHariLapanganByKompetisi(
        parseInt(id_kompetisi)
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error get hari lapangan:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Terjadi kesalahan saat mengambil data lapangan",
      });
    }
  }

  async hapusHariLapangan(req: Request, res: Response) {
    try {
      const { id_kompetisi, tanggal } = req.body;

      if (!id_kompetisi || !tanggal) {
        return res.status(400).json({
          success: false,
          message: "id_kompetisi dan tanggal harus diisi",
        });
      }

      const result = await lapanganService.hapusHariLapangan(
        parseInt(id_kompetisi),
        tanggal
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error hapus hari lapangan:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Terjadi kesalahan saat menghapus hari lapangan",
      });
    }
  }
}

export default new LapanganController();
