import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TambahHariLapanganDTO {
  id_kompetisi: number;
  jumlah_lapangan: number;
}

export class LapanganService {
  private readonly TANGGAL_MULAI = new Date("2025-11-22");

  async tambahHariLapangan(data: TambahHariLapanganDTO) {
    const { id_kompetisi, jumlah_lapangan } = data;

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

    const namaLapangan = this.generateNamaLapangan(jumlah_lapangan);

    const lapanganBaru = await prisma.tb_lapangan.createMany({
      data: namaLapangan.map((nama) => ({
        id_kompetisi,
        nama_lapangan: nama,
        tanggal: tanggalBaru,
      })),
    });

    const lapanganResult = await prisma.tb_lapangan.findMany({
      where: { id_kompetisi, tanggal: tanggalBaru },
      orderBy: { nama_lapangan: "asc" },
    });

    return {
      success: true,
      message: `Berhasil menambahkan ${jumlah_lapangan} lapangan untuk tanggal ${tanggalBaru.toLocaleDateString(
        "id-ID"
      )}`,
      data: {
        tanggal: tanggalBaru,
        jumlah_lapangan: lapanganBaru.count,
        lapangan: lapanganResult,
      },
    };
  }

  private generateNamaLapangan(jumlah: number): string[] {
    const namaLapangan: string[] = [];
    for (let i = 0; i < jumlah; i++) {
      namaLapangan.push(this.getColumnName(i));
    }
    return namaLapangan;
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
}

export default new LapanganService();
