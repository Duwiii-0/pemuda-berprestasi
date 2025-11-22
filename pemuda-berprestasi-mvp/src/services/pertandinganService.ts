import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAtletMatchInfo = async (id_kompetisi: number, hari?: number) => { // NEW: Add hari parameter
  try {
    let matchWhereClause: any = { // NEW: Build where clause dynamically
      bagan: {
        id_kompetisi: id_kompetisi,
      },
      id_peserta_a: { not: null },
      id_peserta_b: { not: null },
      // Filter: hanya yang memiliki stage_name
      stage_name: {
        not: null,
      },
      // Filter: hanya peserta yang approved
      peserta_a: {
        status: "APPROVED", // sesuaikan dengan nama field di database Anda
      },
      peserta_b: {
        status: "APPROVED", // sesuaikan dengan nama field di database Anda
      },
    };

    if (hari !== undefined) { // NEW: Add hari filter if provided
      matchWhereClause.hari = hari;
    }

    const matches = await prisma.tb_match.findMany({
      where: matchWhereClause, // NEW: Use dynamic where clause
      select: {
        nomor_antrian: true,
        nomor_lapangan: true,
        stage_name: true, // Tambahkan stage_name di select
        peserta_a: {
          select: {
            status: true, // Tambahkan untuk debugging
            atlet: {
              select: {
                nama_atlet: true,
                pas_foto: true,
              },
            },
          },
        },
        peserta_b: {
          select: {
            status: true, // Tambahkan untuk debugging
            atlet: {
              select: {
                nama_atlet: true,
                pas_foto: true,
              },
            },
          },
        },
      },
    });

    return matches.map((match) => ({
      nomor_antrian: match.nomor_antrian,
      nomor_lapangan: match.nomor_lapangan,
      stage_name: match.stage_name, // Tambahkan stage_name di return
      nama_atlet_a: match.peserta_a?.atlet?.nama_atlet,
      nama_atlet_b: match.peserta_b?.atlet?.nama_atlet,
      foto_atlet_a: match.peserta_a?.atlet?.pas_foto,
      foto_atlet_b: match.peserta_b?.atlet?.pas_foto,
    }));
  } catch (error: any) {
    throw new Error(`Failed to get match info: ${error.message}`);
  }
};
