import { PrismaClient, JenisKelamin } from "@prisma/client";
  import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();


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
