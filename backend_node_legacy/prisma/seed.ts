// prisma/seed.ts
import { PrismaClient, JenisKelamin } from "@prisma/client";
  import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();


async function seedKelompokUsia() {
  await prisma.tb_kelompok_usia.createMany({
    data: [
      { nama_kelompok: "Super pracadet", usia_min: 5, usia_max: 8 },
      { nama_kelompok: "Pracadet", usia_min: 9, usia_max: 11 },
      { nama_kelompok: "Cadet", usia_min: 12, usia_max: 14 },
      { nama_kelompok: "Junior", usia_min: 15, usia_max: 17 },
      { nama_kelompok: "Senior", usia_min: 18, usia_max: 40 },
      { nama_kelompok: 'pemula', usia_min: 1, usia_max: 999}
    ],
    skipDuplicates: true
  });

  console.log("✅ Kelompok usia seeded");
}

async function seedKelasBerat() {
  // Data kelas berat berdasarkan tabel
  const kelasBerat = [
  // ================= SUPER PRA-CADET (2017-2020) =================
  // LAKI-LAKI
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 19.0, nama_kelas: 'Under 19 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 19.01, batas_max: 21.0, nama_kelas: 'Under 21 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 21.01, batas_max: 24.0, nama_kelas: 'Under 24 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 24.01, batas_max: 27.0, nama_kelas: 'Under 27 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 27.01, batas_max: 30.0, nama_kelas: 'Under 30 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 30.01, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 33.01, batas_max: 200.0, nama_kelas: 'Over 33 kg' },

  // PEREMPUAN
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 18.0, nama_kelas: 'Under 18 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 18.01, batas_max: 20.0, nama_kelas: 'Under 20 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 20.01, batas_max: 23.0, nama_kelas: 'Under 23 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 23.01, batas_max: 26.0, nama_kelas: 'Under 26 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 26.01, batas_max: 29.0, nama_kelas: 'Under 29 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 29.01, batas_max: 32.0, nama_kelas: 'Under 32 kg' },
  { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 32.01, batas_max: 200.0, nama_kelas: 'Over 32 kg' },

  // ================= PRA-CADET (2014-2016) =================
  // LAKI-LAKI
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 20.0, nama_kelas: 'Under 20 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 20.01, batas_max: 22.0, nama_kelas: 'Under 22 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 22.01, batas_max: 24.0, nama_kelas: 'Under 24 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 24.01, batas_max: 26.0, nama_kelas: 'Under 26 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 26.01, batas_max: 28.0, nama_kelas: 'Under 28 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 28.01, batas_max: 30.0, nama_kelas: 'Under 30 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 30.01, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 33.01, batas_max: 36.0, nama_kelas: 'Under 36 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 36.01, batas_max: 39.0, nama_kelas: 'Under 39 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 39.01, batas_max: 200.0, nama_kelas: 'Over 39 kg' },

  // PEREMPUAN
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 19.0, nama_kelas: 'Under 19 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 19.01, batas_max: 21.0, nama_kelas: 'Under 21 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 21.01, batas_max: 23.0, nama_kelas: 'Under 23 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 23.01, batas_max: 25.0, nama_kelas: 'Under 25 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 25.01, batas_max: 27.0, nama_kelas: 'Under 27 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 27.01, batas_max: 29.0, nama_kelas: 'Under 29 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 29.01, batas_max: 32.0, nama_kelas: 'Under 32 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 32.01, batas_max: 35.0, nama_kelas: 'Under 35 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 35.01, batas_max: 38.0, nama_kelas: 'Under 38 kg' },
  { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 38.01, batas_max: 200.0, nama_kelas: 'Over 38 kg' },

  // ================= CADET (2011-2013) =================
  // LAKI-LAKI
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 33.01, batas_max: 37.0, nama_kelas: 'Under 37 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 37.01, batas_max: 41.0, nama_kelas: 'Under 41 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 41.01, batas_max: 45.0, nama_kelas: 'Under 45 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 45.01, batas_max: 49.0, nama_kelas: 'Under 49 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 49.01, batas_max: 53.0, nama_kelas: 'Under 53 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 53.01, batas_max: 57.0, nama_kelas: 'Under 57 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 57.01, batas_max: 61.0, nama_kelas: 'Under 61 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 61.01, batas_max: 65.0, nama_kelas: 'Under 65 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 65.01, batas_max: 200.0, nama_kelas: 'Over 65 kg' },

  // PEREMPUAN
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 29.0, nama_kelas: 'Under 29 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 29.01, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 33.01, batas_max: 37.0, nama_kelas: 'Under 37 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 37.01, batas_max: 41.0, nama_kelas: 'Under 41 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 41.01, batas_max: 44.0, nama_kelas: 'Under 44 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 44.01, batas_max: 47.0, nama_kelas: 'Under 47 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 47.01, batas_max: 51.0, nama_kelas: 'Under 51 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 51.01, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 55.01, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
  { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 59.01, batas_max: 200.0, nama_kelas: 'Over 59 kg' },

  // ================= JUNIOR (2008-2010) =================
  // LAKI-LAKI
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 45.0, nama_kelas: 'Under 45 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 45.01, batas_max: 48.0, nama_kelas: 'Under 48 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 48.01, batas_max: 51.0, nama_kelas: 'Under 51 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 51.01, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 55.01, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 59.01, batas_max: 63.0, nama_kelas: 'Under 63 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 63.01, batas_max: 68.0, nama_kelas: 'Under 68 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 68.01, batas_max: 73.0, nama_kelas: 'Under 73 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 73.01, batas_max: 78.0, nama_kelas: 'Under 78 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 78.01, batas_max: 200.0, nama_kelas: 'Over 78 kg' },

  // PEREMPUAN
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 42.0, nama_kelas: 'Under 42 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 42.01, batas_max: 44.0, nama_kelas: 'Under 44 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 44.01, batas_max: 46.0, nama_kelas: 'Under 46 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 46.01, batas_max: 49.0, nama_kelas: 'Under 49 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 49.01, batas_max: 52.0, nama_kelas: 'Under 52 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 52.01, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 55.01, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 59.01, batas_max: 63.0, nama_kelas: 'Under 63 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 63.01, batas_max: 68.0, nama_kelas: 'Under 68 kg' },
  { id_kelompok: 4, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 68.01, batas_max: 200.0, nama_kelas: 'Over 68 kg' },

  // ================= SENIOR (2007 dan sebelumnya) =================
  // LAKI-LAKI
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 54.0, nama_kelas: 'Under 54 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 54.01, batas_max: 58.0, nama_kelas: 'Under 58 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 58.01, batas_max: 63.0, nama_kelas: 'Under 63 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 58.01, batas_max: 63.0, nama_kelas: 'Under 65 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 63.01, batas_max: 68.0, nama_kelas: 'Under 68 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 68.01, batas_max: 74.0, nama_kelas: 'Under 74 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 74.01, batas_max: 80.0, nama_kelas: 'Under 80 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 80.01, batas_max: 87.0, nama_kelas: 'Under 87 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 87.01, batas_max: 200.0, nama_kelas: 'Over 87 kg' },

  // PEREMPUAN
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 46.0, nama_kelas: 'Under 46 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 46.01, batas_max: 49.0, nama_kelas: 'Under 49 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 49.01, batas_max: 53.0, nama_kelas: 'Under 53 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 53.01, batas_max: 57.0, nama_kelas: 'Under 57 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 53.01, batas_max: 57.0, nama_kelas: 'Under 59 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 57.01, batas_max: 62.0, nama_kelas: 'Under 62 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 62.01, batas_max: 67.0, nama_kelas: 'Under 67 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 67.01, batas_max: 73.0, nama_kelas: 'Under 73 kg' },
  { id_kelompok: 5, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 73.01, batas_max: 200.0, nama_kelas: 'Over 73 kg' },
];


  await prisma.tb_kelas_berat.createMany({
    data: kelasBerat,
    skipDuplicates: true
  });

  console.log("✅ Kelas berat seeded");
}

async function seedKategoriEvent() {
  await prisma.tb_kategori_event.createMany({
    data: [
      { nama_kategori: "Pemula" },
      { nama_kategori: "Prestasi" }
    ],
    skipDuplicates: true
  });

  console.log("✅ Kategori Event seeded");
}

async function seedKelasPoomsae() {
  // Ambil semua kelompok usia yang ada
  const kelompokUsia = await prisma.tb_kelompok_usia.findMany();

  const data: { id_kelompok: number; nama_kelas: string }[] = [];

  for (const kelompok of kelompokUsia) {
    data.push(
      { id_kelompok: kelompok.id_kelompok, nama_kelas: "Individu" },
      { id_kelompok: kelompok.id_kelompok, nama_kelas: "Beregu" },
      { id_kelompok: kelompok.id_kelompok, nama_kelas: "Berpasangan" }
    );
  }

  await prisma.tb_kelas_poomsae.createMany({
    data,
    skipDuplicates: true,
  });

  console.log("✅ Kelas Poomsae seeded");
}

async function seedKelasKejuaraan(idKompetisi: number) {
  const kategoriEvents = await prisma.tb_kategori_event.findMany();
  const kelompokUsia = await prisma.tb_kelompok_usia.findMany();
  const kelasBerat = await prisma.tb_kelas_berat.findMany();
  const kelasPoomsae = await prisma.tb_kelas_poomsae.findMany();

  const data: any[] = [];

  for (const kategori of kategoriEvents) {
    if (kategori.nama_kategori.toLowerCase() === "pemula") {
      // KYORUGI pemula → buat semua kombinasi kelompok usia dan kelas berat
      for (const kelompok of kelompokUsia) {
        const kelasBeratByKelompok = kelasBerat.filter(k => k.id_kelompok === kelompok.id_kelompok);
        for (const kb of kelasBeratByKelompok) {
          data.push({
            id_kompetisi: idKompetisi,
            cabang: "KYORUGI",
            id_kategori_event: kategori.id_kategori_event,
            id_kelompok: kelompok.id_kelompok,
            id_kelas_berat: kb.id_kelas_berat,
            id_poomsae: null
          });
        }
      }

      // POOMSAE pemula → semua kelas POOMSAE pemula
      const poomsaePemula = kelasPoomsae.filter(kp => {
        const kelompok = kelompokUsia.find(k => k.id_kelompok === kp.id_kelompok);
        return kelompok?.nama_kelompok.toLowerCase() === "pemula";
      });

      for (const kp of poomsaePemula) {
        data.push({
          id_kompetisi: idKompetisi,
          cabang: "POOMSAE",
          id_kategori_event: kategori.id_kategori_event,
          id_kelompok: kp.id_kelompok,
          id_kelas_berat: null,
          id_poomsae: kp.id_poomsae
        });
      }

      // Skip loop kelompok & kelas untuk kategori pemula di bawah
      continue;
    }

    // kategori prestasi → lakukan loop seperti biasa
    for (const kelompok of kelompokUsia) {
      const kelasBeratByKelompok = kelasBerat.filter(k => k.id_kelompok === kelompok.id_kelompok);
      for (const kb of kelasBeratByKelompok) {
        data.push({
          id_kompetisi: idKompetisi,
          cabang: "KYORUGI",
          id_kategori_event: kategori.id_kategori_event,
          id_kelompok: kelompok.id_kelompok,
          id_kelas_berat: kb.id_kelas_berat,
          id_poomsae: null
        });
      }

      const kelasPoomsaeByKelompok = kelasPoomsae.filter(p => p.id_kelompok === kelompok.id_kelompok);
      for (const kp of kelasPoomsaeByKelompok) {
        data.push({
          id_kompetisi: idKompetisi,
          cabang: "POOMSAE",
          id_kategori_event: kategori.id_kategori_event,
          id_kelompok: kelompok.id_kelompok,
          id_kelas_berat: null,
          id_poomsae: kp.id_poomsae
        });
      }
    } 
  }

  await prisma.tb_kelas_kejuaraan.createMany({
    data,
    skipDuplicates: true
  });

  console.log("✅ Kelas Kejuaraan seeded,", data.length);
}

async function main() {
  
  await seedKelompokUsia();
  await seedKelasBerat();
  await seedKategoriEvent();
  await seedKelasPoomsae();
  await seedKelasKejuaraan(1);
}


main()
  .then(() => console.log('🎉 Seeding completed'))
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
