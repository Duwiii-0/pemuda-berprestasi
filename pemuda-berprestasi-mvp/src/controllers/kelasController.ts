// src/controllers/kelasController.ts
import { Request, Response } from "express";
import { kelasService } from "../services/kelasService";
import { JenisKelamin } from "@prisma/client";

export const kelasController = {
  async getKelompokUsia(req: Request, res: Response) {
    try {
      const data = await kelasService.getKelompokUsia();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching kelompok usia", error: err });
    }
  },

  async getKelasBerat(req: Request, res: Response) {
  try {
    const { kelompokId, jenis_kelamin } = req.query;
    console.log("Received query:", req.query);

    if (!jenis_kelamin || !["LAKI_LAKI", "PEREMPUAN"].includes(jenis_kelamin as string)) {
      return res.status(400).json({ message: "Invalid gender value" });
    }

    if (!kelompokId) {
      return res.status(400).json({ message: "kelompokId is required" });
    }

    const data = await kelasService.getKelasBerat(
      Number(kelompokId),
      jenis_kelamin as JenisKelamin
    );

    console.log("Data fetched from Prisma:", data); // ✅ lihat data dari Prisma
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching kelas berat", error: err });
  }
},

  async getKelasPoomsae(req: Request, res: Response) {
    try {
      const { kelompokId } = req.query;
      const data = await kelasService.getKelasPoomsae(Number(kelompokId));
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching kelas poomsae", error: err });
    }
  },

  async getKelasKejuaraan(req: Request, res: Response) {
    try {
      const { kompetisiId } = req.params;
      const filter = req.body;
      const data = await kelasService.getKelasKejuaraan(Number(kompetisiId), filter);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching kelas kejuaraan", error: err });
    }
  },
};
