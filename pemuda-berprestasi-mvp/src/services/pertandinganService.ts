import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAtletMatchInfo = async (id_kompetisi: number) => {
  try {
    const matches = await prisma.tb_match.findMany({
      where: {
        bagan: {
          id_kompetisi: id_kompetisi,
        },
        id_peserta_a: { not: null },
        id_peserta_b: { not: null },
      },
      select: {
        nomor_antrian: true,
        nomor_lapangan: true,
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

    return matches.map((match) => ({
      nomor_antrian: match.nomor_antrian,
      nomor_lapangan: match.nomor_lapangan,
      nama_atlet_a: match.peserta_a?.atlet?.nama_atlet,
      nama_atlet_b: match.peserta_b?.atlet?.nama_atlet,
      foto_atlet_a: match.peserta_a?.atlet?.pas_foto,
      foto_atlet_b: match.peserta_b?.atlet?.pas_foto,
    }));
  } catch (error: any) {
    throw new Error(`Failed to get match info: ${error.message}`);
  }
};
