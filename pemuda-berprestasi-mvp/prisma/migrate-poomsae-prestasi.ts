
import { PrismaClient, JenisKelamin } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai script migrasi data peserta Poomsae Prestasi...");

  // 1. Mencari semua peserta individu yang relevan
  const sourceParticipants = await prisma.tb_peserta_kompetisi.findMany({
    where: {
      is_team: false, // Hanya peserta individu
      atlet: {
        jenis_kelamin: { not: null }, // Pastikan atlet punya data gender
      },
      kelas_kejuaraan: {
        cabang: "POOMSAE",
        kategori_event: {
          nama_kategori: "Prestasi",
        },
        poomsae_type: null, // Cari yang poomsae_type-nya masih kosong
      },
    },
    include: {
      atlet: {
        select: {
          id_atlet: true,
          nama_atlet: true,
          jenis_kelamin: true,
        },
      },
      kelas_kejuaraan: {
        include: {
          kelompok: true,
          poomsae: true,
        },
      },
    },
  });

  if (sourceParticipants.length === 0) {
    console.log("✅ Tidak ada peserta yang perlu dimigrasi. Semua sudah benar.");
    return;
  }

  console.log(
    `🔍 Ditemukan ${sourceParticipants.length} peserta yang akan diproses.`
  );

  let successCount = 0;
  let notFoundCount = 0;
  let alreadyCorrectCount = 0;

  // 2. Iterasi setiap peserta
  for (const participant of sourceParticipants) {
    if (!participant.atlet || !participant.kelas_kejuaraan) {
      console.log(`- ⏭️ Melewatkan peserta ${participant.id_peserta_kompetisi} karena data atlet/kelas tidak lengkap.`);
      continue;
    }

    const athlete = participant.atlet;
    const sourceClass = participant.kelas_kejuaraan;
    const athleteGender = athlete.jenis_kelamin;

    // 3. Mencari kelas tujuan yang benar
    const destinationClass = await prisma.tb_kelas_kejuaraan.findFirst({
      where: {
        // Kriteria kelas harus sama, kecuali poomsae_type dan relasi poomsae
        id_kompetisi: sourceClass.id_kompetisi,
        id_kategori_event: sourceClass.id_kategori_event,
        id_kelompok: sourceClass.id_kelompok,
        cabang: "POOMSAE",
        
        // Kriteria Tipe dan Gender yang benar
        poomsae_type: 'RECOGNIZED',
        jenis_kelamin: athleteGender, // Gender kelas harus cocok dengan gender atlet

        // Kriteria relasi poomsae juga harus cocok
        poomsae: {
          jenis_kelamin: athleteGender,
          // Mencocokkan nama kelas poomsae secara fleksibel, misal 'Individu' akan cocok dengan 'Individu Putra'
          nama_kelas: {
            contains: sourceClass.poomsae?.nama_kelas
          }
        }
      },
    });

    // 4. Update data peserta jika kelas tujuan ditemukan
    if (destinationClass) {
      if (destinationClass.id_kelas_kejuaraan === sourceClass.id_kelas_kejuaraan) {
        console.log(`- ➡️ Peserta ${athlete.nama_atlet} (${athlete.id_atlet}) sudah berada di kelas yang benar.`);
        alreadyCorrectCount++;
      } else {
        await prisma.tb_peserta_kompetisi.update({
          where: {
            id_peserta_kompetisi: participant.id_peserta_kompetisi,
          },
          data: {
            id_kelas_kejuaraan: destinationClass.id_kelas_kejuaraan,
          },
        });
        console.log(
          `- 🔄 Memindahkan ${athlete.nama_atlet} (${athlete.id_atlet}) dari kelas ${sourceClass.id_kelas_kejuaraan} ke kelas baru ${destinationClass.id_kelas_kejuaraan}.`
        );
        successCount++;
      }
    } else {
      console.log(
        `- ❌ Gagal menemukan kelas tujuan 'RECOGNIZED' untuk ${athlete.nama_atlet} (${athlete.id_atlet}) dengan gender ${athleteGender} dan kelompok ${sourceClass.kelompok?.nama_kelompok}.`
      );
      notFoundCount++;
    }
  }

  console.log("\n✅ Script Selesai.");
  console.log("=========================================");
  console.log(`- Berhasil dipindahkan: ${successCount} peserta.`);
  console.log(`- Gagal (kelas tujuan tidak ditemukan): ${notFoundCount} peserta.`);
  console.log(`- Sudah benar (tidak perlu dipindah): ${alreadyCorrectCount} peserta.`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat menjalankan script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
