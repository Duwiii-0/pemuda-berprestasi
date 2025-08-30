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
      whereCondition.OR = [
        { 
          id_kelompok: null, 
          id_kelas_berat: null,
          id_poomsae: null 
        },
        ...(filter.kelompokId ? [{ id_kelompok: filter.kelompokId }] : [])
      ];
    }

    console.log("🔍 Final Prisma where condition:", JSON.stringify(whereCondition, null, 2));

    // ✅ DEBUGGING: Check if any data exists for this competition
    const totalKelas = await prisma.tb_kelas_kejuaraan.count({
      where: { id_kompetisi: kompetisiId }
    });
    console.log(`📊 Total kelas for competition ${kompetisiId}:`, totalKelas);

    // ✅ DEBUGGING: Check specific combinations
    const kelasByKompetisi = await prisma.tb_kelas_kejuaraan.findMany({
      where: { 
        id_kompetisi: kompetisiId,
        cabang: filter.styleType 
      },
      select: {
        id_kelas_kejuaraan: true,
        cabang: true,
        id_kategori_event: true,
        id_kelompok: true,
        id_kelas_berat: true,
        id_poomsae: true
      }
    });
    console.log(`🔍 Available kelas for ${filter.styleType}:`, kelasByKompetisi);

    // ✅ DEBUGGING: Check exact match without complex conditions
    const exactMatch = await prisma.tb_kelas_kejuaraan.findFirst({
      where: {
        id_kompetisi: kompetisiId,
        cabang: filter.styleType,
        id_kategori_event: filter.categoryType === "prestasi" ? 2 : 1,
        id_kelompok: filter.kelompokId,
        id_kelas_berat: filter.kelasBeratId,
      }
    });
    console.log("🎯 Exact match result:", exactMatch);

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
