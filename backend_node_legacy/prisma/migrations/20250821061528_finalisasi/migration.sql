-- CreateTable
CREATE TABLE `tb_pelatih` (
    `id_pelatih` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pelatih` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `no_telp` VARCHAR(15) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `foto_ktp` VARCHAR(255) NULL,
    `sertifikat_sabuk` VARCHAR(255) NULL,

    UNIQUE INDEX `tb_pelatih_email_key`(`email`),
    PRIMARY KEY (`id_pelatih`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_penyelenggara` (
    `id_penyelenggara` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_penyelenggara` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NULL,
    `no_telp` VARCHAR(15) NULL,

    PRIMARY KEY (`id_penyelenggara`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_dojang` (
    `id_dojang` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_dojang` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NULL,
    `no_telp` VARCHAR(15) NULL,
    `founder` VARCHAR(150) NULL,
    `negara` VARCHAR(100) NULL,
    `provinsi` VARCHAR(100) NULL,
    `kota` VARCHAR(100) NULL,
    `id_pelatih_pendaftar` INTEGER NOT NULL,

    INDEX `tb_dojang_id_pelatih_pendaftar_fkey`(`id_pelatih_pendaftar`),
    PRIMARY KEY (`id_dojang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_atlet` (
    `id_atlet` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_atlet` VARCHAR(150) NOT NULL,
    `tanggal_lahir` DATETIME(3) NOT NULL,
    `berat_badan` DOUBLE NOT NULL,
    `tinggi_badan` DOUBLE NOT NULL,
    `jenis_kelamin` ENUM('L', 'P') NOT NULL,
    `id_dojang` INTEGER NOT NULL,
    `id_pelatih_pembuat` INTEGER NOT NULL,
    `akte_kelahiran` VARCHAR(255) NOT NULL,
    `pas_foto` VARCHAR(255) NOT NULL,
    `sertifikat_belt` VARCHAR(255) NOT NULL,
    `ktp` VARCHAR(255) NULL,

    INDEX `tb_atlet_id_dojang_fkey`(`id_dojang`),
    INDEX `tb_atlet_id_pelatih_pembuat_fkey`(`id_pelatih_pembuat`),
    PRIMARY KEY (`id_atlet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kompetisi` (
    `id_kompetisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_penyelenggara` INTEGER NOT NULL,
    `tanggal_mulai` DATETIME(3) NOT NULL,
    `tanggal_selesai` DATETIME(3) NOT NULL,
    `nama_event` VARCHAR(255) NOT NULL,
    `type_kompetisi` ENUM('OPEN', 'TRAINING', 'GRADE_B', 'GRADE_C') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',

    INDEX `tb_kompetisi_id_penyelenggara_fkey`(`id_penyelenggara`),
    PRIMARY KEY (`id_kompetisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kategori_event` (
    `id_kategori_event` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kategori` VARCHAR(150) NOT NULL,

    PRIMARY KEY (`id_kategori_event`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kelompok_usia` (
    `id_kelompok` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kelompok` VARCHAR(100) NOT NULL,
    `usia_min` INTEGER NOT NULL,
    `usia_max` INTEGER NOT NULL,

    PRIMARY KEY (`id_kelompok`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kelas_berat` (
    `id_kelas_berat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kelompok` INTEGER NOT NULL,
    `gender` ENUM('L', 'P') NOT NULL,
    `batas_min` DOUBLE NOT NULL,
    `batas_max` DOUBLE NOT NULL,
    `nama_kelas` VARCHAR(100) NOT NULL,

    INDEX `tb_kelas_berat_id_kelompok_fkey`(`id_kelompok`),
    PRIMARY KEY (`id_kelas_berat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kelas_poomsae` (
    `id_poomsae` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kelompok` INTEGER NOT NULL,
    `level` VARCHAR(50) NOT NULL,
    `daftar_taeguk` VARCHAR(255) NULL,

    PRIMARY KEY (`id_poomsae`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_kelas_kejuaraan` (
    `id_kelas_kejuaraan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kategori_event` INTEGER NOT NULL,
    `id_kelompok` INTEGER NULL,
    `id_kelas_berat` INTEGER NULL,
    `id_poomsae` INTEGER NULL,
    `id_kompetisi` INTEGER NOT NULL,
    `cabang` ENUM('POOMSAE', 'KYORUGI') NOT NULL,

    INDEX `tb_kelas_kejuaraan_id_kompetisi_fkey`(`id_kompetisi`),
    PRIMARY KEY (`id_kelas_kejuaraan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_peserta_kompetisi` (
    `id_peserta_kompetisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_atlet` INTEGER NOT NULL,
    `id_kelas_kejuaraan` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',

    INDEX `tb_peserta_kompetisi_id_atlet_fkey`(`id_atlet`),
    INDEX `tb_peserta_kompetisi_id_kelas_kejuaraan_fkey`(`id_kelas_kejuaraan`),
    PRIMARY KEY (`id_peserta_kompetisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_venue` (
    `id_venue` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kompetisi` INTEGER NOT NULL,
    `nama_venue` VARCHAR(150) NOT NULL,
    `lokasi` VARCHAR(255) NULL,

    INDEX `tb_venue_id_kompetisi_fkey`(`id_kompetisi`),
    PRIMARY KEY (`id_venue`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_bagan` (
    `id_bagan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kompetisi` INTEGER NOT NULL,
    `id_kelas_kejuaraan` INTEGER NOT NULL,

    INDEX `tb_bagan_id_kompetisi_fkey`(`id_kompetisi`),
    INDEX `tb_bagan_id_kelas_kejuaraan_fkey`(`id_kelas_kejuaraan`),
    PRIMARY KEY (`id_bagan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_drawing_seed` (
    `id_seed` INTEGER NOT NULL AUTO_INCREMENT,
    `id_bagan` INTEGER NOT NULL,
    `id_peserta_kompetisi` INTEGER NOT NULL,
    `seed_num` INTEGER NOT NULL,

    INDEX `tb_drawing_seed_id_bagan_fkey`(`id_bagan`),
    INDEX `tb_drawing_seed_id_peserta_kompetisi_fkey`(`id_peserta_kompetisi`),
    PRIMARY KEY (`id_seed`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_match` (
    `id_match` INTEGER NOT NULL AUTO_INCREMENT,
    `id_bagan` INTEGER NOT NULL,
    `ronde` INTEGER NOT NULL,
    `id_peserta_a` INTEGER NULL,
    `id_peserta_b` INTEGER NULL,
    `skor_a` INTEGER NOT NULL DEFAULT 0,
    `skor_b` INTEGER NOT NULL DEFAULT 0,
    `id_venue` INTEGER NULL,

    INDEX `tb_match_id_bagan_fkey`(`id_bagan`),
    INDEX `tb_match_id_peserta_a_fkey`(`id_peserta_a`),
    INDEX `tb_match_id_peserta_b_fkey`(`id_peserta_b`),
    INDEX `tb_match_id_venue_fkey`(`id_venue`),
    PRIMARY KEY (`id_match`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_match_audit` (
    `id_audit` INTEGER NOT NULL AUTO_INCREMENT,
    `id_match` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `aksi` VARCHAR(100) NOT NULL,
    `payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tb_match_audit_id_match_fkey`(`id_match`),
    PRIMARY KEY (`id_audit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_audit_log` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `tabel` VARCHAR(100) NOT NULL,
    `aksi` VARCHAR(100) NOT NULL,
    `data_lama` JSON NULL,
    `data_baru` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_dojang` ADD CONSTRAINT `tb_dojang_id_pelatih_pendaftar_fkey` FOREIGN KEY (`id_pelatih_pendaftar`) REFERENCES `tb_pelatih`(`id_pelatih`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_atlet` ADD CONSTRAINT `tb_atlet_id_dojang_fkey` FOREIGN KEY (`id_dojang`) REFERENCES `tb_dojang`(`id_dojang`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_atlet` ADD CONSTRAINT `tb_atlet_id_pelatih_pembuat_fkey` FOREIGN KEY (`id_pelatih_pembuat`) REFERENCES `tb_pelatih`(`id_pelatih`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kompetisi` ADD CONSTRAINT `tb_kompetisi_id_penyelenggara_fkey` FOREIGN KEY (`id_penyelenggara`) REFERENCES `tb_penyelenggara`(`id_penyelenggara`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_berat` ADD CONSTRAINT `tb_kelas_berat_id_kelompok_fkey` FOREIGN KEY (`id_kelompok`) REFERENCES `tb_kelompok_usia`(`id_kelompok`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_poomsae` ADD CONSTRAINT `tb_kelas_poomsae_id_kelompok_fkey` FOREIGN KEY (`id_kelompok`) REFERENCES `tb_kelompok_usia`(`id_kelompok`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_kejuaraan` ADD CONSTRAINT `tb_kelas_kejuaraan_id_kompetisi_fkey` FOREIGN KEY (`id_kompetisi`) REFERENCES `tb_kompetisi`(`id_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_kejuaraan` ADD CONSTRAINT `tb_kelas_kejuaraan_id_kategori_event_fkey` FOREIGN KEY (`id_kategori_event`) REFERENCES `tb_kategori_event`(`id_kategori_event`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_kejuaraan` ADD CONSTRAINT `tb_kelas_kejuaraan_id_kelompok_fkey` FOREIGN KEY (`id_kelompok`) REFERENCES `tb_kelompok_usia`(`id_kelompok`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_kejuaraan` ADD CONSTRAINT `tb_kelas_kejuaraan_id_kelas_berat_fkey` FOREIGN KEY (`id_kelas_berat`) REFERENCES `tb_kelas_berat`(`id_kelas_berat`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_kelas_kejuaraan` ADD CONSTRAINT `tb_kelas_kejuaraan_id_poomsae_fkey` FOREIGN KEY (`id_poomsae`) REFERENCES `tb_kelas_poomsae`(`id_poomsae`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_peserta_kompetisi` ADD CONSTRAINT `tb_peserta_kompetisi_id_atlet_fkey` FOREIGN KEY (`id_atlet`) REFERENCES `tb_atlet`(`id_atlet`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_peserta_kompetisi` ADD CONSTRAINT `tb_peserta_kompetisi_id_kelas_kejuaraan_fkey` FOREIGN KEY (`id_kelas_kejuaraan`) REFERENCES `tb_kelas_kejuaraan`(`id_kelas_kejuaraan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_venue` ADD CONSTRAINT `tb_venue_id_kompetisi_fkey` FOREIGN KEY (`id_kompetisi`) REFERENCES `tb_kompetisi`(`id_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_bagan` ADD CONSTRAINT `tb_bagan_id_kompetisi_fkey` FOREIGN KEY (`id_kompetisi`) REFERENCES `tb_kompetisi`(`id_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_bagan` ADD CONSTRAINT `tb_bagan_id_kelas_kejuaraan_fkey` FOREIGN KEY (`id_kelas_kejuaraan`) REFERENCES `tb_kelas_kejuaraan`(`id_kelas_kejuaraan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_drawing_seed` ADD CONSTRAINT `tb_drawing_seed_id_bagan_fkey` FOREIGN KEY (`id_bagan`) REFERENCES `tb_bagan`(`id_bagan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_drawing_seed` ADD CONSTRAINT `tb_drawing_seed_id_peserta_kompetisi_fkey` FOREIGN KEY (`id_peserta_kompetisi`) REFERENCES `tb_peserta_kompetisi`(`id_peserta_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_match` ADD CONSTRAINT `tb_match_id_bagan_fkey` FOREIGN KEY (`id_bagan`) REFERENCES `tb_bagan`(`id_bagan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_match` ADD CONSTRAINT `tb_match_id_peserta_a_fkey` FOREIGN KEY (`id_peserta_a`) REFERENCES `tb_peserta_kompetisi`(`id_peserta_kompetisi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_match` ADD CONSTRAINT `tb_match_id_peserta_b_fkey` FOREIGN KEY (`id_peserta_b`) REFERENCES `tb_peserta_kompetisi`(`id_peserta_kompetisi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_match` ADD CONSTRAINT `tb_match_id_venue_fkey` FOREIGN KEY (`id_venue`) REFERENCES `tb_venue`(`id_venue`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_match_audit` ADD CONSTRAINT `tb_match_audit_id_match_fkey` FOREIGN KEY (`id_match`) REFERENCES `tb_match`(`id_match`) ON DELETE RESTRICT ON UPDATE CASCADE;
