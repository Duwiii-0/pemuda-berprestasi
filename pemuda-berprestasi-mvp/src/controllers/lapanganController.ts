import { Request, Response } from "express";
import lapanganService from "../services/lapanganService";

export class LapanganController {
  async tambahHariLapangan(req: Request, res: Response) {
    try {
      const { id_kompetisi, jumlah_lapangan } = req.body;

      if (!id_kompetisi || !jumlah_lapangan) {
        return res.status(400).json({
          success: false,
          message: "id_kompetisi dan jumlah_lapangan harus diisi",
        });
      }

      if (jumlah_lapangan < 1) {
        return res.status(400).json({
          success: false,
          message: "jumlah_lapangan minimal 1",
        });
      }

      const result = await lapanganService.tambahHariLapangan({
        id_kompetisi: parseInt(id_kompetisi),
        jumlah_lapangan: parseInt(jumlah_lapangan),
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
