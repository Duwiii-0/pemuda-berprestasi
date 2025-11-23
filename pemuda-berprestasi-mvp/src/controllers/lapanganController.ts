import { Request, Response } from "express";
import lapanganService from "../services/lapanganService";

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

  async simpanKelasLapangan(req: Request, res: Response) {
    try {
      const { id_lapangan, kelas_kejuaraan_ids } = req.body;

      if (!id_lapangan || !Array.isArray(kelas_kejuaraan_ids)) {
        return res.status(400).json({
          success: false,
          message: "id_lapangan dan kelas_kejuaraan_ids (array) harus diisi",
        });
      }

      const result = await lapanganService.simpanKelasLapangan({
        id_lapangan: parseInt(id_lapangan),
        kelas_kejuaraan_ids: kelas_kejuaraan_ids.map((id: any) => parseInt(id)),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error simpan kelas lapangan:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Terjadi kesalahan saat menyimpan kelas lapangan",
      });
    }
  }

  async simpanAntrian(req: Request, res: Response) {
    try {
      const { id_lapangan, bertanding, persiapan, pemanasan } = req.body;

      if (!id_lapangan) {
        return res.status(400).json({
          success: false,
          message: "id_lapangan is required",
        });
      }

      const result = await lapanganService.simpanAntrian({
        id_lapangan: parseInt(id_lapangan),
        bertanding: parseInt(bertanding),
        persiapan: parseInt(persiapan),
        pemanasan: parseInt(pemanasan),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error saving antrian:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menyimpan antrian",
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

  async getKelasKejuaraanByLapangan(req: Request, res: Response) {
    try {
      const { id_lapangan } = req.params;

      if (!id_lapangan) {
        return res.status(400).json({
          success: false,
          message: "id_lapangan harus diisi",
        });
      }

      const result = await lapanganService.getKelasKejuaraanByLapangan(
        parseInt(id_lapangan)
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error get kelas kejuaraan by lapangan:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Terjadi kesalahan saat mengambil kelas kejuaraan",
      });
    }
  }
  // ============================================================================
// 🆕 AUTO-GENERATE NOMOR PARTAI FUNCTIONS
// ============================================================================

/**
 * 1️⃣ GET /api/lapangan/:id_lapangan/full-data
 * Fetch lapangan dengan kelas, bracket, dan matches lengkap
 */
async getLapanganFullData(req: Request, res: Response) {
  try {
    const { id_lapangan } = req.params;

    if (!id_lapangan) {
      return res.status(400).json({
        success: false,
        message: "id_lapangan harus diisi",
      });
    }

    const result = await lapanganService.getLapanganFullData(
      parseInt(id_lapangan)
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error get lapangan full data:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Terjadi kesalahan saat mengambil data lapangan",
    });
  }
}

/**
 * 2️⃣ GET /api/lapangan/:id_lapangan/preview-numbers
 * Preview nomor partai tanpa save ke database
 */
async previewMatchNumbers(req: Request, res: Response) {
  try {
    const { id_lapangan } = req.params;
    const { starting_number } = req.query;

    if (!id_lapangan) {
      return res.status(400).json({
        success: false,
        message: "id_lapangan harus diisi",
      });
    }

    const startNum = starting_number ? parseInt(starting_number as string) : 1;

    if (startNum < 1) {
      return res.status(400).json({
        success: false,
        message: "starting_number harus >= 1",
      });
    }

    const result = await lapanganService.previewMatchNumbers(
      parseInt(id_lapangan),
      startNum
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error preview match numbers:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Terjadi kesalahan saat preview nomor partai",
    });
  }
}

/**
 * 3️⃣ POST /api/lapangan/:id_lapangan/auto-generate-numbers
 * Generate dan save nomor partai ke database
 */
async autoGenerateMatchNumbers(req: Request, res: Response) {
  try {
    const { id_lapangan } = req.params;
    const { starting_number, hari } = req.body; // Extract hari here

    if (!id_lapangan) {
      return res.status(400).json({
        success: false,
        message: "id_lapangan harus diisi",
      });
    }

    const startNum = starting_number ? parseInt(starting_number) : 1;
    const parsedHari = hari ? parseInt(hari) : undefined; // Parse hari

    if (startNum < 1) {
      return res.status(400).json({
        success: false,
        message: "starting_number harus >= 1",
      });
    }

    const result = await lapanganService.autoGenerateMatchNumbers(
      parseInt(id_lapangan),
      startNum,
      parsedHari // Pass hari to the service
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error auto-generate match numbers:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Terjadi kesalahan saat generate nomor partai",
    });
  }
}

/**
 * 4️⃣ DELETE /api/lapangan/:id_lapangan/reset-numbers
 * Reset semua nomor partai di lapangan ini
 */
async resetMatchNumbers(req: Request, res: Response) {
  try {
    const { id_lapangan } = req.params;

    if (!id_lapangan) {
      return res.status(400).json({
        success: false,
        message: "id_lapangan harus diisi",
      });
    }

    const result = await lapanganService.resetMatchNumbers(
      parseInt(id_lapangan)
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error reset match numbers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat reset nomor partai",
    });
  }
}

/**
 * 5️⃣ GET /api/lapangan/:id_lapangan/numbering-status
 * Check apakah lapangan ini sudah punya nomor partai atau belum
 */
async getNumberingStatus(req: Request, res: Response) {
  try {
    const { id_lapangan } = req.params;

    if (!id_lapangan) {
      return res.status(400).json({
        success: false,
        message: "id_lapangan harus diisi",
      });
    }

    const result = await lapanganService.getNumberingStatus(
      parseInt(id_lapangan)
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error get numbering status:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Terjadi kesalahan saat cek status penomoran",
    });
  }
}
}


export default new LapanganController();
