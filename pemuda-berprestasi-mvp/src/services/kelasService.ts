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
  styleType: Cabang,
  gender?: JenisKelamin,
  categoryType?: string,
  kelompokId?: number,
  kelasBeratId?: number,
  poomsaeId?: number,
}) => {
  try {
    console.log("🔍 Backend filter received:", filter);

    let whereCondition: any = {
      id_kompetisi: kompetisiId,
      cabang: filter.styleType,
    };

    // Kategori event
    if (filter.categoryType) {
      const kategoriEventId = filter.categoryType === "prestasi" ? 2 : 1;
      whereCondition.id_kategori_event = kategoriEventId;
    }

    // Handle POOMSAE
    if (filter.styleType === "POOMSAE") {
      if (filter.categoryType === "prestasi") {
        if (filter.kelompokId) whereCondition.id_kelompok = filter.kelompokId;
        if (filter.poomsaeId) whereCondition.id_poomsae = filter.poomsaeId;
        if (filter.gender) whereCondition.gender = filter.gender; // optional
      } else if (filter.categoryType === "pemula") {
        if (filter.poomsaeId) whereCondition.id_poomsae = filter.poomsaeId;
        // gender dan kelompok diabaikan
      }
    }

    // Handle KYORUGI
    if (filter.styleType === "KYORUGI") {
      if (filter.categoryType === "prestasi") {
        if (filter.kelompokId) whereCondition.id_kelompok = filter.kelompokId;
        if (filter.kelasBeratId) whereCondition.id_kelas_berat = filter.kelasBeratId;
        if (filter.gender) {
          // filter gender via relation ke kelas_berat
          whereCondition.kelas_berat = {
            id_kelas_berat: filter.kelasBeratId,
            jenis_kelamin: filter.gender
          };
          delete whereCondition.id_kelas_berat; // pakai relation
        }
      } else if (filter.categoryType === "pemula") {
        if (filter.gender) {
          whereCondition.kelas_berat = {
            jenis_kelamin: filter.gender
          };
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
