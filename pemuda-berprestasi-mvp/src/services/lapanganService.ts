import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TambahHariLapanganDTO {
  id_kompetisi: number;
}

interface TambahLapanganDTO {
  id_kompetisi: number;
  tanggal: string;
}

interface SimpanKelasLapanganDTO {
  id_lapangan: number;
  kelas_kejuaraan_ids: number[];
}

export class LapanganService {
  private readonly TANGGAL_MULAI = new Date("2025-11-22");

  async tambahHariLapangan(data: TambahHariLapanganDTO) {
    const { id_kompetisi } = data;

    const kompetisi = await prisma.tb_kompetisi.findUnique({
      where: { id_kompetisi },
    });

    if (!kompetisi) {
      throw new Error("Kompetisi tidak ditemukan");
    }

    const lapanganTerakhir = await prisma.tb_lapangan.findFirst({
      where: { id_kompetisi },
      orderBy: { tanggal: "desc" },
    });

    let tanggalBaru: Date;
    if (lapanganTerakhir) {
      tanggalBaru = new Date(lapanganTerakhir.tanggal);
      tanggalBaru.setDate(tanggalBaru.getDate() + 1);
    } else {
      tanggalBaru = new Date(this.TANGGAL_MULAI);
    }

    const lapanganBaru = await prisma.tb_lapangan.create({
      data: {
        id_kompetisi,
        nama_lapangan: "A",
        tanggal: tanggalBaru,
      },
    });

    return {
      success: true,
      message: `Berhasil menambahkan hari pertandingan untuk tanggal ${tanggalBaru.toLocaleDateString(
        "id-ID"
      )}`,
      data: {
        tanggal: tanggalBaru,
        lapangan: lapanganBaru,
      },
    };
  }

  async tambahLapanganKeHari(data: TambahLapanganDTO) {
    const { id_kompetisi, tanggal } = data;
    const targetDate = new Date(tanggal);

    const lapanganExisting = await prisma.tb_lapangan.findMany({
      where: {
        id_kompetisi,
        tanggal: targetDate,
      },
      orderBy: { nama_lapangan: "asc" },
    });

    if (lapanganExisting.length === 0) {
      throw new Error("Hari pertandingan tidak ditemukan");
    }

    const jumlahLapangan = lapanganExisting.length;
    const namaLapanganBaru = this.getColumnName(jumlahLapangan);

    const lapanganBaru = await prisma.tb_lapangan.create({
      data: {
        id_kompetisi,
        nama_lapangan: namaLapanganBaru,
        tanggal: targetDate,
      },
    });

    return {
      success: true,
      message: `Berhasil menambahkan lapangan ${namaLapanganBaru}`,
      data: lapanganBaru,
    };
  }

  // Simpan kelas kejuaraan yang dipilih untuk lapangan
  async simpanKelasLapangan(data: SimpanKelasLapanganDTO) {
    const { id_lapangan, kelas_kejuaraan_ids } = data;

    // Cek apakah lapangan exist
    const lapangan = await prisma.tb_lapangan.findUnique({
      where: { id_lapangan },
    });

    if (!lapangan) {
      throw new Error("Lapangan tidak ditemukan");
    }

    // Hapus semua relasi lama
    await prisma.tb_lapangan_kelas.deleteMany({
      where: { id_lapangan },
    });

    // Buat relasi baru dengan urutan
    if (kelas_kejuaraan_ids.length > 0) {
      const createData = kelas_kejuaraan_ids.map((id_kelas, index) => ({
        id_lapangan,
        id_kelas_kejuaraan: id_kelas,
        urutan: index + 1,
      }));

      await prisma.tb_lapangan_kelas.createMany({
        data: createData,
      });
    }

    return {
      success: true,
      message: `Berhasil menyimpan ${kelas_kejuaraan_ids.length} kelas kejuaraan untuk lapangan ${lapangan.nama_lapangan}`,
      data: {
        id_lapangan,
        jumlah_kelas: kelas_kejuaraan_ids.length,
      },
    };
  }

  async hapusLapangan(id_lapangan: number) {
    const adaJadwal = await prisma.tb_jadwal_pertandingan.findFirst({
      where: { id_lapangan },
    });

    if (adaJadwal) {
      throw new Error(
        "Tidak dapat menghapus lapangan karena sudah ada jadwal yang terdaftar"
      );
    }

    // Delete cascade akan otomatis hapus tb_lapangan_kelas
    const deleted = await prisma.tb_lapangan.delete({
      where: { id_lapangan },
    });

    return {
      success: true,
      message: `Berhasil menghapus lapangan ${deleted.nama_lapangan}`,
      data: deleted,
    };
  }

  private getColumnName(index: number): string {
    let nama = "";
    index++;
    while (index > 0) {
      const modulo = (index - 1) % 26;
      nama = String.fromCharCode(65 + modulo) + nama;
      index = Math.floor((index - modulo) / 26);
    }
    return nama;
  }

  async getHariLapanganByKompetisi(id_kompetisi: number) {
    const lapangan = await prisma.tb_lapangan.findMany({
      where: { id_kompetisi },
      include: {
        kelas_list: {
          orderBy: { urutan: "asc" },
          include: {
            kelas_kejuaraan: true,
          },
        },
      },
      orderBy: [{ tanggal: "asc" }, { nama_lapangan: "asc" }],
    });

    type LapanganType = (typeof lapangan)[0];

    const groupedByDate = lapangan.reduce((acc, lap) => {
      const dateKey = lap.tanggal.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(lap);
      return acc;
    }, {} as Record<string, LapanganType[]>);

    return {
      success: true,
      data: {
        total_hari: Object.keys(groupedByDate).length,
        total_lapangan: lapangan.length,
        hari_pertandingan: Object.entries(groupedByDate).map(
          ([tanggal, lap]) => ({
            tanggal,
            jumlah_lapangan: lap.length,
            lapangan: lap,
          })
        ),
      },
    };
  }

  async hapusHariLapangan(id_kompetisi: number, tanggal: string) {
    const targetDate = new Date(tanggal);

    const adaJadwal = await prisma.tb_jadwal_pertandingan.findFirst({
      where: {
        lapangan: {
          id_kompetisi,
          tanggal: targetDate,
        },
      },
    });

    if (adaJadwal) {
      throw new Error(
        "Tidak dapat menghapus hari pertandingan karena sudah ada jadwal yang terdaftar"
      );
    }

    // Delete cascade akan otomatis hapus tb_lapangan_kelas
    const deleted = await prisma.tb_lapangan.deleteMany({
      where: { id_kompetisi, tanggal: targetDate },
    });

    return {
      success: true,
      message: `Berhasil menghapus ${
        deleted.count
      } lapangan pada tanggal ${targetDate.toLocaleDateString("id-ID")}`,
      data: { jumlah_dihapus: deleted.count },
    };
  }

  // Get kelas kejuaraan per lapangan (untuk antrian/bagan)
  async getKelasKejuaraanByLapangan(id_lapangan: number) {
    const lapanganKelas = await prisma.tb_lapangan_kelas.findMany({
      where: { id_lapangan },
      include: {
        kelas_kejuaraan: {
          include: {
            kategori_event: true,
            kelompok: true,
            kelas_berat: true,
            poomsae: true,
          },
        },
      },
      orderBy: { urutan: "asc" },
    });

    return {
      success: true,
      data: {
        id_lapangan,
        jumlah_kelas: lapanganKelas.length,
        kelas_list: lapanganKelas.map((lk) => ({
          urutan: lk.urutan,
          kelas: lk.kelas_kejuaraan,
        })),
      },
    };
  }
}

export default new LapanganService();
y;
