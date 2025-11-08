import { PrismaClient, Cabang, JenisKelamin } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Skrip ini untuk memigrasikan data kelas Poomsae yang awalnya tidak memiliki pemisah gender.
 *
 * Cara kerja:
 * 1. Mencari semua `tb_kelas_kejuaraan` dengan cabang POOMSAE.
 * 2. Untuk setiap kelas tersebut, akan dibuat dua entri baru di `tb_kelas_poomsae`:
 *    - Satu untuk LAKI_LAKI
 *    - Satu untuk PEREMPUAN
 *    (Menggunakan `upsert` untuk keamanan jika skrip dijalankan lebih dari sekali).
 * 3. Membuat dua `tb_kelas_kejuaraan` baru yang merujuk pada dua `tb_kelas_poomsae` di atas.
 * 4. Mencari semua `tb_peserta_kompetisi` yang terdaftar di `tb_kelas_kejuaraan` yang lama.
 * 5. Memindahkan setiap peserta ke `tb_kelas_kejuaraan` yang baru sesuai dengan jenis kelamin atlet.
 * 6. Data lama (kelas kejuaraan dan kelas poomsae yang campur) tidak dihapus secara otomatis.
 */
async function main() {
  console.log("Memulai skrip migrasi data untuk kelas Poomsae...");

  await prisma.$transaction(async (tx) => {
    // 1. Ambil semua kelas kejuaraan Poomsae yang ada (yang masih campur)
    const mixedGenderPoomsaeClasses = await tx.tb_kelas_kejuaraan.findMany({
      where: {
        cabang: Cabang.POOMSAE,
        id_poomsae: { not: null },
        // Filter untuk hanya mengambil kelas yang belum dipisah
        poomsae: {
          jenis_kelamin: null,
        },
      },
      include: {
        poomsae: true,
      },
    });

    if (mixedGenderPoomsaeClasses.length === 0) {
      console.log("Tidak ada kelas kejuaraan Poomsae yang perlu dimigrasi.");
      return;
    }

    console.log(
      `Ditemukan ${mixedGenderPoomsaeClasses.length} kelas Poomsae untuk diproses.`
    );

    // 2. Loop setiap kelas Poomsae yang campur
    for (const oldKelas of mixedGenderPoomsaeClasses) {
      if (!oldKelas.poomsae || oldKelas.id_poomsae === null) continue;

      console.log(`
Memproses kelas: ${oldKelas.poomsae.nama_kelas} (ID Lama: ${oldKelas.id_kelas_kejuaraan})`);

      // 3. Buat atau dapatkan ID kelas Poomsae yang baru untuk LAKI_LAKI dan PEREMPUAN
      const newPoomsaeMale = await tx.tb_kelas_poomsae.upsert({
        where: {
          id_kelompok_nama_kelas_jenis_kelamin: {
            id_kelompok: oldKelas.poomsae.id_kelompok,
            nama_kelas: oldKelas.poomsae.nama_kelas,
            jenis_kelamin: JenisKelamin.LAKI_LAKI,
          },
        },
        update: {},
        create: {
          id_kelompok: oldKelas.poomsae.id_kelompok,
          nama_kelas: oldKelas.poomsae.nama_kelas,
          jenis_kelamin: JenisKelamin.LAKI_LAKI,
        },
      });

      const newPoomsaeFemale = await tx.tb_kelas_poomsae.upsert({
        where: {
          id_kelompok_nama_kelas_jenis_kelamin: {
            id_kelompok: oldKelas.poomsae.id_kelompok,
            nama_kelas: oldKelas.poomsae.nama_kelas,
            jenis_kelamin: JenisKelamin.PEREMPUAN,
          },
        },
        update: {},
        create: {
          id_kelompok: oldKelas.poomsae.id_kelompok,
          nama_kelas: oldKelas.poomsae.nama_kelas,
          jenis_kelamin: JenisKelamin.PEREMPUAN,
        },
      });
      console.log(
        `  - Upsert kelas Poomsae baru (Putra ID: ${newPoomsaeMale.id_poomsae}, Putri ID: ${newPoomsaeFemale.id_poomsae})`
      );

      // 4. Buat atau dapatkan kelas KEJUARAAN yang baru
      const getOrCreateKelasKejuaraan = async (poomsaeId: number) => {
        let kelas = await tx.tb_kelas_kejuaraan.findFirst({
          where: { id_kompetisi: oldKelas.id_kompetisi, id_poomsae: poomsaeId },
        });
        if (!kelas) {
          kelas = await tx.tb_kelas_kejuaraan.create({
            data: {
              id_kompetisi: oldKelas.id_kompetisi,
              id_kategori_event: oldKelas.id_kategori_event,
              id_kelompok: oldKelas.id_kelompok,
              cabang: oldKelas.cabang,
              id_poomsae: poomsaeId,
            },
          });
          console.log(
            `    - Membuat kelas KEJUARAAN baru (ID: ${kelas.id_kelas_kejuaraan})`
          );
        }
        return kelas;
      };

      const newKelasKejuaraanMale = await getOrCreateKelasKejuaraan(
        newPoomsaeMale.id_poomsae
      );
      const newKelasKejuaraanFemale = await getOrCreateKelasKejuaraan(
        newPoomsaeFemale.id_poomsae
      );
      console.log(
        `  - Dapatkan/Buat kelas KEJUARAAN baru (Putra ID: ${newKelasKejuaraanMale.id_kelas_kejuaraan}, Putri ID: ${newKelasKejuaraanFemale.id_kelas_kejuaraan})`
      );

      // 5. Ambil semua peserta dari kelas lama
      const participants = await tx.tb_peserta_kompetisi.findMany({
        where: { id_kelas_kejuaraan: oldKelas.id_kelas_kejuaraan },
        include: { atlet: true },
      });
      console.log(
        `  - Ditemukan ${participants.length} peserta untuk dipindahkan.`
      );

      // 6. Pindahkan setiap peserta ke kelas kejuaraan yang sesuai
      for (const participant of participants) {
        if (!participant.atlet) continue;

        const targetKelasId =
          participant.atlet.jenis_kelamin === JenisKelamin.LAKI_LAKI
            ? newKelasKejuaraanMale.id_kelas_kejuaraan
            : newKelasKejuaraanFemale.id_kelas_kejuaraan;

        await tx.tb_peserta_kompetisi.update({
          where: { id_peserta_kompetisi: participant.id_peserta_kompetisi },
          data: { id_kelas_kejuaraan: targetKelasId },
        });
        console.log(
          `    - Memindahkan atlet ${participant.atlet.nama_atlet} ke kelas ID: ${targetKelasId}`
        );
      }
    }
  });

  console.log("Migrasi data selesai.");
  console.log(
    "Semua peserta Poomsae telah dipindahkan ke kelas berdasarkan gender."
  );
  console.log(
    "Kelas lama yang campur kini kosong dan bisa dihapus jika diperlukan."
  );
}

main()
  .catch((e) => {
    console.error("Terjadi error selama migrasi data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
