// src/services/kelasService.ts
import { PrismaClient, JenisKelamin } from "@prisma/client";

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

  getKelasKejuaraan: async (kompetisiId: number, filter: any) => {
    return prisma.tb_kelas_kejuaraan.findMany({
      where: {
        id_kompetisi: kompetisiId,
        cabang: filter.styleType, // ✅ gunakan enum Cabang
        ...(filter.gender ? { kelas_berat: { jenis_kelamin: filter.gender as JenisKelamin } } : {}),
        ...(filter.kelompokId ? { id_kelompok: filter.kelompokId } : {}),
        ...(filter.kelasBeratId ? { id_kelas_berat: filter.kelasBeratId } : {}),
        ...(filter.kelasPoomsaeId ? { id_poomsae: filter.kelasPoomsaeId } : {}),
        ...(filter.categoryType ? { kategori_event: { nama_kategori: filter.categoryType } } : {}), // ✅ ganti kategori → kategori_event
      },
      include: {
        kelompok: true,
        kelas_berat: true, // ✅ pakai nama relasi di schema
        poomsae: true,     // ✅ sesuai schema
        kategori_event: true, // bisa include kategori juga
      },
    });
  },
};
