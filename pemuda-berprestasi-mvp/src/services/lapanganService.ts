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
            kelas_kejuaraan: {
              include: {
                kategori_event: true,
                kelompok: true,
                kelas_berat: true,
                poomsae: true,
              },
            },
          },
        },
        antrian: true,
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

  async simpanAntrian(data: { id_lapangan: number; bertanding: number; persiapan: number; pemanasan: number }) {
    const { id_lapangan, bertanding, persiapan, pemanasan } = data;

    const antrian = await prisma.tb_antrian.upsert({
        where: { id_lapangan },
        update: { bertanding, persiapan, pemanasan },
        create: { id_lapangan, bertanding, persiapan, pemanasan },
    });

    return {
        success: true,
        message: "Antrian berhasil disimpan",
        data: antrian,
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

  // ============================================================================
  // 🆕 AUTO-GENERATE NOMOR PARTAI FUNCTIONS
  // ============================================================================

  /**
   * 1️⃣ Get Lapangan Full Data (dengan kelas, bracket, matches)
   */
  async getLapanganFullData(id_lapangan: number) {
    console.log(`\n🔍 Fetching full data for lapangan ${id_lapangan}...`);

    const lapangan = await prisma.tb_lapangan.findUnique({
      where: { id_lapangan },
      include: {
        kelas_list: {
          include: {
            kelas_kejuaraan: {
              include: {
                kategori_event: true,
                kelompok: true,
                kelas_berat: true,
                poomsae: true,
                peserta_kompetisi: {
                  where: { status: 'APPROVED' }
                },
                bagan: {
                  include: {
                    match: {
                      orderBy: [
                        { ronde: 'asc' },
                        { id_match: 'asc' }
                      ]
                    }
                  }
                }
              }
            }
          },
          orderBy: { urutan: 'asc' }
        }
      }
    });

    if (!lapangan) {
      throw new Error('Lapangan tidak ditemukan');
    }

    // Transform data
    const kelasListTransformed = lapangan.kelas_list.map(kl => {
      const kelas = kl.kelas_kejuaraan;
      const isPemula = kelas.kategori_event.nama_kategori.toLowerCase().includes('pemula');
      
      return {
        id_kelas_kejuaraan: kelas.id_kelas_kejuaraan,
        nama_kelas: this.generateNamaKelas(kelas),
        kategori: isPemula ? 'PEMULA' : 'PRESTASI',
        jumlah_peserta: kelas.peserta_kompetisi.length,
        bagan: kelas.bagan.length > 0 ? {
          id_bagan: kelas.bagan[0].id_bagan,
          matches: kelas.bagan[0].match.map(m => ({
            id_match: m.id_match,
            ronde: m.ronde,
            nomor_antrian: m.nomor_antrian,
            nomor_lapangan: m.nomor_lapangan,
            nomor_partai: m.nomor_partai
          }))
        } : null
      };
    });

    console.log(`✅ Found ${kelasListTransformed.length} kelas in lapangan ${lapangan.nama_lapangan}`);

    return {
      success: true,
      data: {
        id_lapangan: lapangan.id_lapangan,
        nama_lapangan: lapangan.nama_lapangan,
        tanggal: lapangan.tanggal,
        kelas_list: kelasListTransformed
      }
    };
  }

  /**
   * 2️⃣ Preview Match Numbers (tanpa save)
   */
  async previewMatchNumbers(id_lapangan: number, starting_number: number = 1) {
    console.log(`\n🔮 Preview match numbers for lapangan ${id_lapangan}`);
    console.log(`   Starting number: ${starting_number}`);

    const fullData = await this.getLapanganFullData(id_lapangan);
    const lapanganData = fullData.data;

    // Generate assignments (tanpa save)
    const result = this.generateMatchAssignments(
      lapanganData.kelas_list,
      lapanganData.nama_lapangan,
      starting_number,
      false // preview only
    );

    return result;
  }

  /**
   * 3️⃣ Auto-Generate Match Numbers (dengan save)
   */
  async autoGenerateMatchNumbers(id_lapangan: number, starting_number: number = 1) {
    console.log(`\n🎯 Auto-generating match numbers for lapangan ${id_lapangan}`);
    console.log(`   Starting number: ${starting_number}`);

    const fullData = await this.getLapanganFullData(id_lapangan);
    const lapanganData = fullData.data;

    // Generate assignments
    const result = this.generateMatchAssignments(
      lapanganData.kelas_list,
      lapanganData.nama_lapangan,
      starting_number,
      true // save to database
    );

    // Bulk update database
    if (result.assignments.length > 0) {
      await prisma.$transaction(
        result.assignments.map(assignment =>
          prisma.tb_match.update({
            where: { id_match: assignment.id_match },
            data: {
              nomor_antrian: assignment.nomor_antrian,
              nomor_lapangan: assignment.nomor_lapangan,
              nomor_partai: assignment.nomor_partai
            }
          })
        )
      );

      console.log(`✅ Successfully updated ${result.assignments.length} matches`);
    }

    return result;
  }

  /**
   * 4️⃣ Reset Match Numbers
   */
  async resetMatchNumbers(id_lapangan: number) {
    console.log(`\n🗑️ Resetting match numbers for lapangan ${id_lapangan}`);

    const fullData = await this.getLapanganFullData(id_lapangan);
    const lapanganData = fullData.data;

    const allMatchIds: number[] = [];
    
    lapanganData.kelas_list.forEach(kelas => {
      if (kelas.bagan && kelas.bagan.matches) {
        kelas.bagan.matches.forEach(match => {
          allMatchIds.push(match.id_match);
        });
      }
    });

    if (allMatchIds.length === 0) {
      return {
        success: true,
        message: 'Tidak ada match untuk direset',
        data: { total_reset: 0 }
      };
    }

    await prisma.$transaction(
      allMatchIds.map(id =>
        prisma.tb_match.update({
          where: { id_match: id },
          data: {
            nomor_antrian: null,
            nomor_lapangan: null,
            nomor_partai: null
          }
        })
      )
    );

    console.log(`✅ Reset ${allMatchIds.length} matches`);

    return {
      success: true,
      message: `Berhasil reset ${allMatchIds.length} nomor partai`,
      data: { total_reset: allMatchIds.length }
    };
  }

  /**
   * 5️⃣ Get Numbering Status
   */
  async getNumberingStatus(id_lapangan: number) {
    const fullData = await this.getLapanganFullData(id_lapangan);
    const lapanganData = fullData.data;

    let totalMatches = 0;
    let matchesWithNumbers = 0;

    lapanganData.kelas_list.forEach(kelas => {
      if (kelas.bagan && kelas.bagan.matches) {
        totalMatches += kelas.bagan.matches.length;
        matchesWithNumbers += kelas.bagan.matches.filter(
          m => m.nomor_antrian !== null
        ).length;
      }
    });

    const hasNumbers = matchesWithNumbers > 0;
    const isComplete = totalMatches > 0 && matchesWithNumbers === totalMatches;

    return {
      success: true,
      data: {
        id_lapangan,
        nama_lapangan: lapanganData.nama_lapangan,
        total_matches: totalMatches,
        matches_with_numbers: matchesWithNumbers,
        has_numbers: hasNumbers,
        is_complete: isComplete,
        percentage: totalMatches > 0 ? (matchesWithNumbers / totalMatches) * 100 : 0
      }
    };
  }

  // ============================================================================
  // 🔧 HELPER FUNCTIONS
  // ============================================================================

  /**
   * Core logic: Generate match assignments
   */
  private generateMatchAssignments(
    kelasList: any[],
    lapanganLetter: string,
    startingNumber: number,
    saveToDb: boolean
  ): any {
    console.log(`\n📊 Generating assignments for ${kelasList.length} kelas...`);

    // Separate PEMULA & PRESTASI
    const pemulaClasses = kelasList.filter(k => k.kategori === 'PEMULA');
    const prestasiClasses = kelasList.filter(k => k.kategori === 'PRESTASI');

    console.log(`   - PEMULA: ${pemulaClasses.length} kelas`);
    console.log(`   - PRESTASI: ${prestasiClasses.length} kelas`);

    // Sort by jumlah peserta (DESC)
    const sortedPemula = [...pemulaClasses].sort((a, b) => b.jumlah_peserta - a.jumlah_peserta);
    const sortedPrestasi = [...prestasiClasses].sort((a, b) => b.jumlah_peserta - a.jumlah_peserta);

    let currentNumber = startingNumber;
    const assignments: any[] = [];

    // Process PEMULA first (habis per kelas)
    console.log(`\n🥋 Processing PEMULA classes...`);
    sortedPemula.forEach(kelas => {
      if (!kelas.bagan || !kelas.bagan.matches) return;

      const startRange = currentNumber;
      const matches = [...kelas.bagan.matches].sort((a, b) => {
        if (a.ronde !== b.ronde) return a.ronde - b.ronde;
        return a.id_match - b.id_match;
      });

      matches.forEach(match => {
        assignments.push({
          id_match: match.id_match,
          nomor_antrian: currentNumber,
          nomor_lapangan: lapanganLetter,
          nomor_partai: `${currentNumber}${lapanganLetter}`,
          kelas_id: kelas.id_kelas_kejuaraan,
          kelas_nama: kelas.nama_kelas,
          round: match.ronde
        });
        currentNumber++;
      });

      const endRange = currentNumber - 1;
      console.log(`   ✅ ${kelas.nama_kelas}: ${startRange}${lapanganLetter}-${endRange}${lapanganLetter} (${matches.length} matches)`);
    });

    // Process PRESTASI (habis per round)
    if (sortedPrestasi.length > 0) {
      console.log(`\n🏆 Processing PRESTASI classes...`);

      // Group by round
      const matchesByRound = new Map<number, any[]>();

      sortedPrestasi.forEach(kelas => {
        if (!kelas.bagan || !kelas.bagan.matches) return;

        kelas.bagan.matches.forEach((match: any) => {
          if (!matchesByRound.has(match.ronde)) {
            matchesByRound.set(match.ronde, []);
          }

          matchesByRound.get(match.ronde)!.push({
            ...match,
            kelas_id: kelas.id_kelas_kejuaraan,
            kelas_nama: kelas.nama_kelas,
            jumlah_peserta: kelas.jumlah_peserta
          });
        });
      });

      // Sort rounds
      const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);

      sortedRounds.forEach(round => {
        const roundMatches = matchesByRound.get(round)!;
        const startRange = currentNumber;

        // Sort: jumlah peserta DESC, then id_match ASC
        const sortedRoundMatches = roundMatches.sort((a, b) => {
          if (a.jumlah_peserta !== b.jumlah_peserta) {
            return b.jumlah_peserta - a.jumlah_peserta;
          }
          return a.id_match - b.id_match;
        });

        sortedRoundMatches.forEach(match => {
          assignments.push({
            id_match: match.id_match,
            nomor_antrian: currentNumber,
            nomor_lapangan: lapanganLetter,
            nomor_partai: `${currentNumber}${lapanganLetter}`,
            kelas_id: match.kelas_id,
            kelas_nama: match.kelas_nama,
            round: match.ronde
          });
          currentNumber++;
        });

        const endRange = currentNumber - 1;
        console.log(`   ✅ Round ${round}: ${startRange}${lapanganLetter}-${endRange}${lapanganLetter} (${sortedRoundMatches.length} matches)`);
      });
    }

    // Generate summary
    const summary = this.generateSummary(assignments, sortedPemula, sortedPrestasi, lapanganLetter);

    const finalRange = assignments.length > 0 
      ? `${startingNumber}${lapanganLetter}-${currentNumber - 1}${lapanganLetter}`
      : '-';

    console.log(`\n✅ Total assignments: ${assignments.length}`);
    console.log(`   Range: ${finalRange}\n`);

    return {
      success: true,
      message: saveToDb 
        ? `Berhasil generate ${assignments.length} nomor partai` 
        : `Preview ${assignments.length} nomor partai`,
      total_matches: assignments.length,
      range: finalRange,
      assignments,
      summary
    };
  }

  /**
   * Generate summary per kelas
   */
  private generateSummary(assignments: any[], pemulaClasses: any[], prestasiClasses: any[], lapanganLetter: string) {
    const summary = {
      pemula: [] as any[],
      prestasi: [] as any[]
    };

    // Summary PEMULA
    pemulaClasses.forEach(kelas => {
      const kelasAssignments = assignments.filter(a => a.kelas_id === kelas.id_kelas_kejuaraan);
      if (kelasAssignments.length > 0) {
        const minNum = Math.min(...kelasAssignments.map(a => a.nomor_antrian));
        const maxNum = Math.max(...kelasAssignments.map(a => a.nomor_antrian));
        summary.pemula.push({
          kelas: kelas.nama_kelas,
          peserta: kelas.jumlah_peserta,
          matches: kelasAssignments.length,
          range: `${minNum}${lapanganLetter}-${maxNum}${lapanganLetter}`
        });
      }
    });

    // Summary PRESTASI
    prestasiClasses.forEach(kelas => {
      const kelasAssignments = assignments.filter(a => a.kelas_id === kelas.id_kelas_kejuaraan);
      if (kelasAssignments.length > 0) {
        const minNum = Math.min(...kelasAssignments.map(a => a.nomor_antrian));
        const maxNum = Math.max(...kelasAssignments.map(a => a.nomor_antrian));
        summary.prestasi.push({
          kelas: kelas.nama_kelas,
          peserta: kelas.jumlah_peserta,
          matches: kelasAssignments.length,
          range: `${minNum}${lapanganLetter}-${maxNum}${lapanganLetter}`
        });
      }
    });

    return summary;
  }

/**
 * Generate nama kelas (helper)
 */
private generateNamaKelas(kelas: any): string {
  const parts: string[] = []; // ✅ Explicitly type as string[]
  
  if (kelas.cabang) parts.push(String(kelas.cabang));
  if (kelas.kategori_event?.nama_kategori) parts.push(String(kelas.kategori_event.nama_kategori));

  const isPoomsaePemula =
    kelas.cabang === 'POOMSAE' &&
    kelas.kategori_event?.nama_kategori === 'Pemula';
  
  if (kelas.kelompok?.nama_kelompok && !isPoomsaePemula) {
    parts.push(String(kelas.kelompok.nama_kelompok));
  }

  if (kelas.kelas_berat) {
    const gender = kelas.kelas_berat.jenis_kelamin === 'LAKI_LAKI' ? 'Putra' : 'Putri';
    parts.push(gender);
  }

  if (kelas.kelas_berat?.nama_kelas) parts.push(String(kelas.kelas_berat.nama_kelas));
  if (kelas.poomsae?.nama_kelas) parts.push(String(kelas.poomsae.nama_kelas));

  return parts.length > 0 ? parts.join(' - ') : 'Kelas Tidak Lengkap';
}
}



export default new LapanganService();
