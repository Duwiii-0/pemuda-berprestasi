// prisma/seed.ts
import { PrismaClient, JenisKelamin } from "@prisma/client";
  import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const existingAdmin = await prisma.tb_akun.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.tb_akun.create({
      data: {
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        admin: {
          create: { nama: 'Super Admin' }
        }
      }
    });
    console.log('✅ Admin account created');
  } else {
    console.log('ℹ️ Admin already exists');
  }
}

async function seedPelatihDojang() {
  const existingPelatih = await prisma.tb_akun.findUnique({
    where: { email: 'pelatih@example.com' }
  });

  const dojang = await prisma.tb_dojang.upsert({
    where: { id_dojang: 1 },
    update: {},
    create: {
      nama_dojang: "Dojang Utama",
      email: "dojang@example.com",
      no_telp: "0811111111",
      founder: "Master Kim",
      negara: "Indonesia",
      provinsi: "Jawa Barat",
      kota: "Bandung"
    }
  });

  if (!existingPelatih) {
    const hashedPassword = await bcrypt.hash('pelatih123', 10);

    await prisma.tb_akun.create({
      data: {
        email: 'pelatih@example.com',
        password_hash: hashedPassword,
        role: 'PELATIH',
        pelatih: {
          create: {
            nama_pelatih: 'Budi Pelatih',
            no_telp: '08123456789',
            dojang: { connect: { id_dojang: dojang.id_dojang } }
          }
        }
      }
    });
    console.log('✅ Pelatih account created');
  } else {
    console.log('ℹ️ Pelatih already exists');
  }
}

async function seedAtlet() {
  const pelatih = await prisma.tb_pelatih.findFirst();
  const dojang = await prisma.tb_dojang.findFirst();

  if (!pelatih || !dojang) {
    console.log("⚠️ Skip seeding atlet, pelatih/dojang belum ada");
    return;
  }

  await prisma.tb_atlet.createMany({
    data: [
      // CADET (11-13 tahun)
      {
        nama_atlet: 'Budi Santoso',
        nik: '3201012012110001',
        belt: 'kuning',
        tanggal_lahir: new Date('2012-05-15'),
        berat_badan: 35,
        tinggi_badan: 145,
        umur: 11,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'LAKI_LAKI',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_budi.pdf',
        pas_foto: 'budi.jpg',
        sertifikat_belt: 'belt_budi.pdf'
      },
      {
        nama_atlet: 'Siti Rahma',
        nik: '3201012011110002',
        belt: 'hijau',
        tanggal_lahir: new Date('2011-08-20'),
        berat_badan: 32,
        tinggi_badan: 142,
        umur: 12,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'PEREMPUAN',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_siti.pdf',
        pas_foto: 'siti.jpg',
        sertifikat_belt: 'belt_siti.pdf'
      },

      // JUNIOR (14-17 tahun)
      {
        nama_atlet: 'Ahmad Fajar',
        nik: '3201012008080003',
        belt: 'biru',
        tanggal_lahir: new Date('2008-03-10'),
        berat_badan: 58,
        tinggi_badan: 168,
        umur: 15,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'LAKI_LAKI',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_ahmad.pdf',
        pas_foto: 'ahmad.jpg',
        sertifikat_belt: 'belt_ahmad.pdf'
      },  
      {
        nama_atlet: 'Dewi Putri',
        nik: '3201012007070004',
        belt: 'merah',
        tanggal_lahir: new Date('2007-11-25'),
        berat_badan: 49,
        tinggi_badan: 160,
        umur: 16,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'PEREMPUAN',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_dewi.pdf',
        pas_foto: 'dewi.jpg',
        sertifikat_belt: 'belt_dewi.pdf'
      },

      // SENIOR (18-40 tahun)
      {
        nama_atlet: 'Rudi Hermawan',
        nik: '3201012005050005',
        belt: 'hitam',
        tanggal_lahir: new Date('2005-04-30'),
        berat_badan: 68,
        tinggi_badan: 175,
        umur: 20,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'LAKI_LAKI',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_rudi.pdf',
        pas_foto: 'rudi.jpg',
        sertifikat_belt: 'belt_rudi.pdf'
      },
      {
        nama_atlet: 'Maya Sari',
        nik: '3201012004040006',
        belt: 'hitam',
        tanggal_lahir: new Date('2004-07-15'),
        berat_badan: 57,
        tinggi_badan: 165,
        umur: 21,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'PEREMPUAN',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_maya.pdf',
        pas_foto: 'maya.jpg',
        sertifikat_belt: 'belt_maya.pdf'
      },
      {
        nama_atlet: 'Doni Kusuma',
        nik: '3201012003030007',
        belt: 'hitam',
        tanggal_lahir: new Date('2003-09-20'),
        berat_badan: 80,
        tinggi_badan: 180,
        umur: 22,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'LAKI_LAKI',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_doni.pdf',
        pas_foto: 'doni.jpg',
        sertifikat_belt: 'belt_doni.pdf'
      },
      {
        nama_atlet: 'Linda Wati',
        nik: '3201012002020008',
        belt: 'hitam',
        tanggal_lahir: new Date('2002-12-05'),
        berat_badan: 62,
        tinggi_badan: 167,
        umur: 23,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'PEREMPUAN',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_linda.pdf',
        pas_foto: 'linda.jpg',
        sertifikat_belt: 'belt_linda.pdf'
      },
      {
        nama_atlet: 'Rizki Pratama',
        nik: '3201012001010009',
        belt: 'hitam',
        tanggal_lahir: new Date('2001-02-28'),
        berat_badan: 74,
        tinggi_badan: 178,
        umur: 24,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'LAKI_LAKI',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_rizki.pdf',
        pas_foto: 'rizki.jpg',
        sertifikat_belt: 'belt_rizki.pdf'
      },
      {
        nama_atlet: 'Anisa Putri',
        nik: '3201012000000010',
        belt: 'hitam',
        tanggal_lahir: new Date('2000-06-15'),
        berat_badan: 53,
        tinggi_badan: 163,
        umur: 25,
        provinsi: 'Jawa Barat',
        kota: 'Bandung',
        jenis_kelamin: 'PEREMPUAN',
        id_dojang: dojang.id_dojang,
        id_pelatih_pembuat: pelatih.id_pelatih,
        akte_kelahiran: 'akte_anisa.pdf',
        pas_foto: 'anisa.jpg',
        sertifikat_belt: 'belt_anisa.pdf'
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ 10 Atlet seeded");
}

async function seedKelompokUsia() {
  await prisma.tb_kelompok_usia.createMany({
    data: [
      { nama_kelompok: "Cadet", usia_min: 11, usia_max: 13 },
      { nama_kelompok: "Junior", usia_min: 14, usia_max: 17 },
      { nama_kelompok: "Senior", usia_min: 18, usia_max: 40 }
    ],
    skipDuplicates: true
  });

  console.log("✅ Kelompok usia seeded");
}

async function seedKelasBerat() {
  // Data kelas berat berdasarkan tabel
  const kelasBeratData = [

    //cadet
    // Putra
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 33.1, batas_max: 37.0, nama_kelas: 'Under 37 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 37.1, batas_max: 41.0, nama_kelas: 'Under 41 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 41.1, batas_max: 45.0, nama_kelas: 'Under 45 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 45.1, batas_max: 49.0, nama_kelas: 'Under 49 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 49.1, batas_max: 53.0, nama_kelas: 'Under 53 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 53.1, batas_max: 57.0, nama_kelas: 'Under 57 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 57.1, batas_max: 61.0, nama_kelas: 'Under 61 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 61.1, batas_max: 65.0, nama_kelas: 'Under 65 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 65.1, batas_max: 200.0, nama_kelas: 'Over 65 kg' },

    // Putri
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 29.0, nama_kelas: 'Under 29 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 29.1, batas_max: 33.0, nama_kelas: 'Under 33 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 33.1, batas_max: 37.0, nama_kelas: 'Under 37 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 37.1, batas_max: 41.0, nama_kelas: 'Under 41 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 41.1, batas_max: 44.0, nama_kelas: 'Under 44 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 44.1, batas_max: 47.0, nama_kelas: 'Under 47 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 47.1, batas_max: 51.0, nama_kelas: 'Under 51 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 51.1, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 55.1, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
    { id_kelompok: 1, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 59.1, batas_max: 200.0, nama_kelas: 'Over 59 kg' },

    // Junior - Putra
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 0, batas_max: 45.0, nama_kelas: 'Under 45 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 45.1, batas_max: 48.0, nama_kelas: 'Under 48 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 48.1, batas_max: 51.0, nama_kelas: 'Under 51 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 51.1, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 55.1, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 59.1, batas_max: 63.0, nama_kelas: 'Under 63 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 63.1, batas_max: 68.0, nama_kelas: 'Under 68 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 68.1, batas_max: 73.0, nama_kelas: 'Under 73 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 73.1, batas_max: 78.0, nama_kelas: 'Under 78 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.LAKI_LAKI, batas_min: 78.1, batas_max: 200.0, nama_kelas: 'Over 78 kg' },

    // Junior - Putri
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0, batas_max: 42.0, nama_kelas: 'Under 42 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 42.1, batas_max: 44.0, nama_kelas: 'Under 44 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 44.1, batas_max: 46.0, nama_kelas: 'Under 46 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 46.1, batas_max: 49.0, nama_kelas: 'Under 49 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 49.1, batas_max: 52.0, nama_kelas: 'Under 52 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 52.1, batas_max: 55.0, nama_kelas: 'Under 55 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 55.1, batas_max: 59.0, nama_kelas: 'Under 59 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 59.1, batas_max: 63.0, nama_kelas: 'Under 63 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 63.1, batas_max: 68.0, nama_kelas: 'Under 68 kg' },
    { id_kelompok: 2, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 68.1, batas_max: 200.0, nama_kelas: 'Over 68 kg' },

    // senior
    // PUTRA
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 0,     batas_max: 54.0,  nama_kelas: "Under 54 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 54.01, batas_max: 58.0,  nama_kelas: "Under 58 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 58.01, batas_max: 63.0,  nama_kelas: "Under 63 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 63.01, batas_max: 68.0,  nama_kelas: "Under 68 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 68.01, batas_max: 74.0,  nama_kelas: "Under 74 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 74.01, batas_max: 80.0,  nama_kelas: "Under 80 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 80.01, batas_max: 87.0,  nama_kelas: "Under 87 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.LAKI_LAKI , batas_min: 87.1,  batas_max: 999,   nama_kelas: "Over 87 kg" },
    
    // PUTRI
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 0,     batas_max: 46.0,  nama_kelas: "Under 46 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 46.01, batas_max: 49.0,  nama_kelas: "Under 49 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 49.01, batas_max: 53.0,  nama_kelas: "Under 53 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 53.01, batas_max: 57.0,  nama_kelas: "Under 57 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 57.01, batas_max: 62.0,  nama_kelas: "Under 62 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 62.01, batas_max: 67.0,  nama_kelas: "Under 67 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 67.01, batas_max: 73.0,  nama_kelas: "Under 73 kg" },
    { id_kelompok: 3, jenis_kelamin: JenisKelamin.PEREMPUAN, batas_min: 73.1,  batas_max: 999,   nama_kelas: "Over 73 kg" },
  ];

  await prisma.tb_kelas_berat.createMany({
    data: kelasBeratData,
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

async function seedPenyelenggara() {
  const penyelenggara = await prisma.tb_penyelenggara.create({
    data: {
      nama_penyelenggara: "Pengurus Besar Taekwondo Indonesia",
      email: "info@pbti.or.id",
      no_telp: "08123456789",
    },
  });



  console.log("✅ Penyelenggara seeded");
  return penyelenggara;
}

async function seedKompetisi(penyelenggaraId: number) {
  const kompetisi = await prisma.tb_kompetisi.create({
    data: {
      nama_event: "Sriwijaya Competition",
      tanggal_mulai: new Date("2025-09-01"),
      tanggal_selesai: new Date("2025-09-05"),
      lokasi: 'Jakarta',
      id_penyelenggara: penyelenggaraId,
      status: "PENDAFTARAN"
    },
  });

  console.log("✅ Kompetisi created:", kompetisi.nama_event);
  return kompetisi;
}

async function seedKelasKejuaraan(idKompetisi: number) {
  const kategoriEvents = await prisma.tb_kategori_event.findMany();
  const kelompokUsia = await prisma.tb_kelompok_usia.findMany();
  const kelasBerat = await prisma.tb_kelas_berat.findMany();
  const kelasPoomsae = await prisma.tb_kelas_poomsae.findMany();

  const data: any[] = [];

  for (const kategori of kategoriEvents) {
    if (kategori.nama_kategori.toLowerCase() === "pemula") {
      // KYORUGI pemula → gender saja
      data.push({
        id_kompetisi: idKompetisi,
        cabang: "KYORUGI",
        id_kategori_event: kategori.id_kategori_event,
        id_kelompok: null,
        id_kelas_berat: null,
        id_poomsae: null
      });

      // POOMSAE pemula → gender saja
      data.push({
        id_kompetisi: idKompetisi,
        cabang: "POOMSAE",
        id_kategori_event: kategori.id_kategori_event,
        id_kelompok: null,
        id_kelas_berat: null,
        id_poomsae: null
      });

      // Skip loop kelompok & kelas untuk pemula
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
  await seedAdmin();
  await seedPelatihDojang();
  await seedKelompokUsia();
  await seedAtlet();
  await seedKelasBerat();
  await seedKategoriEvent();
  await seedKelasPoomsae();

  const penyelenggara = await seedPenyelenggara();
  const kompetisi = await seedKompetisi(penyelenggara.id_penyelenggara);

  await seedKelasKejuaraan(kompetisi.id_kompetisi);
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
