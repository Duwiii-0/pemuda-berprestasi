// src/services/kelasService.ts
import { PrismaClient, JenisKelamin, Cabang } from "@prisma/client";

const prisma = new PrismaClient();

export const kelasService = {
  getKelompokUsia: async () => {
    return prisma.tb_kelompok_usia.findMany({
      orderBy: { usia_min: "asc" }, // ✅ perbaikan min_usia → usia_min
    });
  },

  getKelasBerat: async (kelompokId: number, jenisKelamin: JenisKelamin) => {
    return prisma.tb_kelas_berat.findMany({
      where: {
        id_kelompok: kelompokId,
        jenis_kelamin: jenisKelamin, // ✅ pakai enum JenisKelamin
      },
      orderBy: { batas_min: "asc" }, // ✅ perbaikan min_berat → batas_min
    });
  },

  getKelasPoomsae: async (kelompokId: number) => {
    return prisma.tb_kelas_poomsae.findMany({
      where: { id_kelompok: kelompokId },
    });
  },

  getKelasKejuaraan: async (
    kompetisiId: number,
    filter: {
      styleType: Cabang;
      gender?: JenisKelamin; // ✅ MADE OPTIONAL
      categoryType?: string;
      kelompokId?: number;
      kelasBeratId?: number;
      poomsaeId?: number;
    }
  ) => {
    try {
      console.log("🔍 Backend filter received:", filter);

      // Base condition
      let whereCondition: any = {
        id_kompetisi: kompetisiId,
        cabang: filter.styleType,
      };

      // Kategori event condition
      if (filter.categoryType) {
        const kategoriEventId = filter.categoryType === "prestasi" ? 2 : 1;
        whereCondition.id_kategori_event = kategoriEventId;
      }

      // Handle different category types
      if (filter.categoryType === "prestasi") {
        if (filter.kelompokId) {
          whereCondition.id_kelompok = filter.kelompokId;
        }

        if (filter.styleType === "KYORUGI" && filter.kelasBeratId) {
          whereCondition.id_kelas_berat = filter.kelasBeratId;
        }

        if (filter.styleType === "POOMSAE" && filter.poomsaeId) {
          whereCondition.id_poomsae = filter.poomsaeId;
        }
      } else if (filter.categoryType === "pemula") {
        if (filter.styleType === "POOMSAE") {
          // POOMSAE pemula: cukup filter poomsae jika ada
          if (filter.poomsaeId) {
            whereCondition.id_poomsae = filter.poomsaeId;
          }
          // Jangan tambahkan OR array atau field lain
        } else {
          // Untuk KYORUGI pemula tetap OR array atau aturan lain
          const orConditions: any[] = [
            { id_kelompok: null, id_kelas_berat: null, id_poomsae: null }, // fallback
          ];
          if (filter.kelompokId)
            orConditions.push({ id_kelompok: filter.kelompokId });
          if (filter.styleType === "KYORUGI" && filter.kelasBeratId)
            orConditions.push({ id_kelas_berat: filter.kelasBeratId });
          whereCondition.OR = orConditions;
        }
      }

      // ✅ NEW: Handle gender filtering for kelas_berat
      // For KYORUGI, we need to filter kelas_berat by gender
      // For team POOMSAE, we skip gender filtering to get mixed gender class
      if (
        filter.styleType === "KYORUGI" &&
        filter.gender &&
        filter.kelasBeratId
      ) {
        // Add gender constraint through kelas_berat relation
        whereCondition.kelas_berat = {
          id_kelas_berat: filter.kelasBeratId,
          jenis_kelamin: filter.gender,
        };
        // Remove the direct id_kelas_berat since we're using relation
        delete whereCondition.id_kelas_berat;
      }

      console.log(
        "🔍 Final Prisma where condition:",
        JSON.stringify(whereCondition, null, 2)
      );

      const kelas = await prisma.tb_kelas_kejuaraan.findMany({
        where: whereCondition,
        include: {
          kelompok: true,
          kelas_berat: true,
          poomsae: true,
          kategori_event: true,
        },
      });

      console.log("✅ Query berhasil, hasil:", kelas);

      if (kelas.length > 0) {
        return { id_kelas_kejuaraan: kelas[0].id_kelas_kejuaraan };
      }

      return null;
    } catch (err: any) {
      console.error("❌ Prisma error:", err);
      if (err instanceof Error) console.error("Stack:", err.stack);
      throw err;
    }
  },

  async getKelasKejuaraanByKompetisi(idKompetisi: number) {
    try {
      console.log(
        "📦 Querying tb_kelas_kejuaraan for kompetisi ID:",
        idKompetisi
      );

      const kelasList = await prisma.tb_kelas_kejuaraan.findMany({
        where: {
          id_kompetisi: idKompetisi,
        },
        include: {
          kompetisi: {
            select: {
              id_kompetisi: true,
              nama_kompetisi: true,
            },
          },
          cabang: true,
          kategori_event: true,
          kelompok: true,
          kelas_berat: true,
          poomsae: true,
        },
        orderBy: {
          id_kelas_kejuaraan: "asc",
        },
      });

      console.log(`✅ Ditemukan ${kelasList.length} kelas kejuaraan`);
      return kelasList;
    } catch (error) {
      console.error(
        "❌ Error in kompetisiService.getKelasKejuaraanByKompetisi:",
        error
      );
      throw error;
    }
  },
};
