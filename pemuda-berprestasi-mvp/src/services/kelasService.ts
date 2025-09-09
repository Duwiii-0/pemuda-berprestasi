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

getKelasKejuaraan: async (kompetisiId: number, filter: {
  styleType: "KYORUGI" | "POOMSAE",
  gender?: "LAKI_LAKI" | "PEREMPUAN",
  categoryType?: "prestasi" | "pemula",
  kelompokId?: number,
  kelasBeratId?: number,
  poomsaeId?: number,
  isTeamPoomsae?: boolean, // tambahan untuk poomsae beregu/berpasangan
}) => {
  try {
    console.log("🔍 Backend filter received:", filter);

    let whereCondition: any = {
      id_kompetisi: kompetisiId,
      cabang: filter.styleType,
    };

    // Kategori event
    if (filter.categoryType) {
      whereCondition.id_kategori_event = filter.categoryType === "prestasi" ? 2 : 1;
    }

    // ----- POOMSAE -----
    if (filter.styleType === "POOMSAE") {
      if (filter.categoryType === "prestasi") {
        if (filter.kelompokId) whereCondition.id_kelompok = filter.kelompokId;
        if (filter.poomsaeId) whereCondition.id_poomsae = filter.poomsaeId;

        // Jika beregu/berpasangan, jangan kirim gender
        if (!filter.isTeamPoomsae && filter.gender) {
          whereCondition.gender = filter.gender;
        }
      } else if (filter.categoryType === "pemula") {
        // POOMSAE pemula: cukup filter poomsae
        if (filter.poomsaeId) whereCondition.id_poomsae = filter.poomsaeId;
        // jangan kirim gender/kategori lain
      }
    }

    // ----- KYORUGI -----
    if (filter.styleType === "KYORUGI") {
      if (filter.categoryType === "prestasi") {
        if (filter.kelompokId) whereCondition.id_kelompok = filter.kelompokId;

        if (filter.kelasBeratId) {
          if (filter.gender) {
            // filter gender via relation kelas_berat
            whereCondition.kelas_berat = {
              id_kelas_berat: filter.kelasBeratId,
              jenis_kelamin: filter.gender
            };
          } else {
            whereCondition.id_kelas_berat = filter.kelasBeratId;
          }
        }
      } else if (filter.categoryType === "pemula") {
        // KYORUGI pemula: cukup gender
        if (filter.gender) {
          whereCondition.kelas_berat = { jenis_kelamin: filter.gender };
        }
        // umur dan kelas berat diabaikan
      }
    }

    console.log("🔍 Final Prisma where condition:", JSON.stringify(whereCondition, null, 2));

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
}


};
