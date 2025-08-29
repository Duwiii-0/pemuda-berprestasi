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
  categoryType?: string,  // "prestasi" | "pemula"
  kelompokId?: number,    // ID dari kelompok umur
  kelasBeratId?: number,  // ID dari kelas berat
}) => {
  try {
    console.log("🔍 Backend filter received:", filter);

    // 1. Mapping categoryType ke kategori_event
    let kategoriEventCondition = {};
    if (filter.categoryType) {
      // Asumsi: prestasi = id 1, pemula = id 2 (sesuaikan dengan database)
      const kategoriEventId = filter.categoryType === "prestasi" ? 1 : 2;
      kategoriEventCondition = { id_kategori_event: kategoriEventId };
    }

    // 2. Build where condition
    const whereCondition = {
      id_kompetisi: kompetisiId,
      cabang: filter.styleType,
      ...kategoriEventCondition,
      
      // Optional conditions berdasarkan ID
      ...(filter.kelompokId ? { id_kelompok: filter.kelompokId } : {}),
      ...(filter.kelasBeratId ? { id_kelas_berat: filter.kelasBeratId } : {}),
      
      // Untuk pemula, mungkin tidak perlu kelompok/berat
      ...(filter.categoryType === "pemula" ? {
        // Pemula biasanya tidak ada klasifikasi ketat
        OR: [
          { id_kelompok: null, id_kelas_berat: null },
          { id_kelompok: filter.kelompokId || undefined }
        ]
      } : {}),
    };

    console.log("🔍 Prisma where condition:", JSON.stringify(whereCondition, null, 2));

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
    
    // Return first match dengan struktur yang diharapkan frontend
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
