import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lapanganMapping: { [key: string]: number } = {
  A: 40,
  B: 48,
  C: 49,
};

async function main() {
  console.log('Starting script to backfill id_lapangan...');

  for (const [nomorLapangan, idLapangan] of Object.entries(lapanganMapping)) {
    try {
      console.log(`Updating matches where nomor_lapangan = '${nomorLapangan}' AND hari = 2 to id_lapangan = ${idLapangan}...`);
      
      const result = await prisma.tb_match.updateMany({
        where: {
          nomor_lapangan: nomorLapangan,
          hari: 2, // NEW: Add this condition
        },
        data: {
          id_lapangan: idLapangan,
        },
      });

      console.log(`✅ Success! Updated ${result.count} matches for Lapangan ${nomorLapangan} on Hari 2.`);
    } catch (error) {
      console.error(`❌ Failed to update matches for Lapangan ${nomorLapangan}:`, error);
    }
  }

  console.log('Script finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
