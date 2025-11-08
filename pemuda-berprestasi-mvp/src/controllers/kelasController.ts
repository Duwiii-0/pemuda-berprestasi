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
      res
        .status(500)
        .json({ message: "Error fetching kelompok usia", error: err });
    }
  },

  async getKelasBerat(req: Request, res: Response) {
    try {
      const { kelompokId, jenis_kelamin } = req.query;
      console.log("Received query:", req.query);

      if (
        !jenis_kelamin ||
        !["LAKI_LAKI", "PEREMPUAN"].includes(jenis_kelamin as string)
      ) {
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
      res
        .status(500)
        .json({ message: "Error fetching kelas berat", error: err });
    }
  },

  async getKelasPoomsae(req: Request, res: Response) {
    try {
      const { kelompokId, jenis_kelamin } = req.query;

      if (
        !jenis_kelamin ||
        !["LAKI_LAKI", "PEREMPUAN"].includes(jenis_kelamin as string)
      ) {
        return res.status(400).json({ message: "Invalid gender value" });
      }

      if (!kelompokId) {
        return res.status(400).json({ message: "kelompokId is required" });
      }

      const data = await kelasService.getKelasPoomsae(
        Number(kelompokId),
        jenis_kelamin as JenisKelamin
      );
      res.json(data);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error fetching kelas poomsae", error: err });
    }
  },

  // Backend Controller - Updated to handle new parameters
  async getKelasKejuaraan(req: Request, res: Response) {
    try {
      const { kompetisiId } = req.params;
      const {
        styleType,
        gender, // ✅ REMOVED validation - now optional
        categoryType,
        kelompokId,
        kelasBeratId,
        poomsaeId,
      } = req.body;

      console.log("🔹 Request params:", req.params);
      console.log("🔹 Request body (filter):", req.body);

      if (!styleType) {
        return res.status(400).json({ message: "styleType is required" });
      }

      if (!categoryType) {
        return res.status(400).json({ message: "categoryType is required" });
      }

      // ✅ REMOVED: gender validation - it's now optional
      // This allows team poomsae to work without specifying gender

      const filter = {
        styleType,
        gender, // ✅ Can be undefined for team categories
        categoryType,
        kelompokId: kelompokId ? Number(kelompokId) : undefined,
        kelasBeratId: kelasBeratId ? Number(kelasBeratId) : undefined,
        poomsaeId: poomsaeId ? Number(poomsaeId) : undefined,
      };

      console.log("🔹 Processed filter:", filter);

      const data = await kelasService.getKelasKejuaraan(
        Number(kompetisiId),
        filter
      );

      console.log("🔹 Data dari service:", data);

      if (!data) {
        return res
          .status(404)
          .json({ message: "No kelas kejuaraan found for given criteria" });
      }

      res.json(data);
    } catch (err) {
      console.error("❌ Error di controller:", err);
      res.status(500).json({
        message: "Error fetching kelas kejuaraan",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },

  async getKelasKejuaraanByKompetisi(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log("🎯 Controller received ID:", id);

      if (!id) {
        return res.status(400).json({ message: "ID kompetisi diperlukan" });
      }

      const kelasList = await kelasService.getKelasKejuaraanByKompetisi(
        Number(id)
      );

      console.log("🎯 Service returned:", kelasList);
      console.log("🎯 Array length:", kelasList.length);

      if (kelasList.length === 0) {
        console.log("⚠️ Sending 404 - No data found");
        return res.status(404).json({
          message: "Tidak ada kelas kejuaraan untuk kompetisi ini",
        });
      }

      console.log("✅ Sending 200 with data");
      return res.status(200).json(kelasList); // ⚠️ PASTIKAN ADA RETURN!
    } catch (error) {
      console.error("❌ Error:", error);
      return res.status(500).json({
        message: "Gagal mengambil data kelas kejuaraan",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
