import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting to seed Poomsae Prestasi classes...');

  const ID_KOMPETISI = 1;
  const ID_KATEGORI_EVENT_PRESTASI = 2;

  // 1. Get all relevant Poomsae classes (ID 19 to 54)
  const poomsaeClassesToSeed = await prisma.tb_kelas_poomsae.findMany({
    where: {
      id_poomsae: {
        gte: 19,
        lte: 54,
      },
    },
  });

  if (poomsaeClassesToSeed.length === 0) {
    console.log('⚠️ No Poomsae classes found in the range 19-54. Exiting.');
    return;
  }

  console.log(`✅ Found ${poomsaeClassesToSeed.length} Poomsae classes to process.`);

  // 2. Prepare the new competition classes data
  const newCompetitionClasses = [];

  for (const poomsaeClass of poomsaeClassesToSeed) {
    // For each Poomsae class, create two competition classes: one for recognized, one for freestyle
    newCompetitionClasses.push({
      id_kompetisi: ID_KOMPETISI,
      id_kategori_event: ID_KATEGORI_EVENT_PRESTASI,
      cabang: 'POOMSAE',
      id_poomsae: poomsaeClass.id_poomsae,
      id_kelompok: poomsaeClass.id_kelompok,
      poomsae_type: 'recognized',
    });

    newCompetitionClasses.push({
      id_kompetisi: ID_KOMPETISI,
      id_kategori_event: ID_KATEGORI_EVENT_PRESTASI,
      cabang: 'POOMSAE',
      id_poomsae: poomsaeClass.id_poomsae,
      id_kelompok: poomsaeClass.id_kelompok,
      poomsae_type: 'freestyle',
    });
  }

  console.log(`✨ Preparing to create ${newCompetitionClasses.length} new competition classes.`);

  // 3. Create the new competition classes in the database
  const result = await prisma.tb_kelas_kejuaraan.createMany({
    data: newCompetitionClasses,
    skipDuplicates: true, // Prevent errors if you run the seed multiple times
  });

  console.log(`🎉 Successfully created ${result.count} new Poomsae Prestasi competition classes.`);
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔚 Seeding finished.');
  });
