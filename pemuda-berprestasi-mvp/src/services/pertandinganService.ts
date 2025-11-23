import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAtletMatchInfo = async (id_kompetisi: number, hari?: number) => { // NEW: Add hari parameter
  try {
    let matchWhereClause: any = { 
      bagan: {
        id_kompetisi: id_kompetisi,
      },
      // Hapus filter ketat untuk id_peserta_a, id_peserta_b, dan status APPROVED
      // Ini akan memungkinkan pertandingan BYE dan pertandingan yang belum ditentukan peserta untuk ikut diambil.
      stage_name: {
        not: null, // Hanya pertandingan dengan stage_name yang sudah ditentukan
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

    return matches.map((match) => {
      let nama_atlet_a: string | undefined;
      let foto_atlet_a: string | undefined;
      let nama_atlet_b: string | undefined;
      let foto_atlet_b: string | undefined;

      if (match.peserta_a && match.peserta_b) {
        // Both participants present (normal match)
        nama_atlet_a = match.peserta_a.atlet?.nama_atlet;
        foto_atlet_a = match.peserta_a.atlet?.pas_foto;
        nama_atlet_b = match.peserta_b.atlet?.nama_atlet;
        foto_atlet_b = match.peserta_b.atlet?.pas_foto;
      } else if (match.peserta_a && !match.peserta_b) {
        // Peserta A but no Peserta B (BYE for A)
        nama_atlet_a = match.peserta_a.atlet?.nama_atlet;
        foto_atlet_a = match.peserta_a.atlet?.pas_foto;
        nama_atlet_b = "BYE"; // Placeholder for BYE
        foto_atlet_b = undefined;
      } else if (!match.peserta_a && match.peserta_b) {
        // Peserta B but no Peserta A (BYE for B)
        nama_atlet_a = "BYE"; // Placeholder for BYE
        foto_atlet_a = undefined;
        nama_atlet_b = match.peserta_b.atlet?.nama_atlet;
        foto_atlet_b = match.peserta_b.atlet?.pas_foto;
      } else {
        // No participants (TBD match)
        nama_atlet_a = "TBD"; // Placeholder for TBD
        foto_atlet_a = undefined;
        nama_atlet_b = "TBD"; // Placeholder for TBD
        foto_atlet_b = undefined;
      }

      return {
        nomor_antrian: match.nomor_antrian,
        nomor_lapangan: match.nomor_lapangan,
        stage_name: match.stage_name,
        nama_atlet_a: nama_atlet_a,
        nama_atlet_b: nama_atlet_b,
        foto_atlet_a: foto_atlet_a,
        foto_atlet_b: foto_atlet_b,
      };
    });
  } catch (error: any) {
    throw new Error(`Failed to get match info: ${error.message}`);
  }
};
