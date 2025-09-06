CREATE TABLE `tb_admin` (
	`id_admin` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(150) NOT NULL,
	`id_akun` int NOT NULL,
	CONSTRAINT `tb_admin_id_admin` PRIMARY KEY(`id_admin`),
	CONSTRAINT `tb_admin_id_akun_unique` UNIQUE(`id_akun`)
);
--> statement-breakpoint
CREATE TABLE `tb_admin_kompetisi` (
	`id_admin_kompetisi` int AUTO_INCREMENT NOT NULL,
	`id_kompetisi` int NOT NULL,
	`nama` varchar(150) NOT NULL,
	`id_akun` int NOT NULL,
	CONSTRAINT `tb_admin_kompetisi_id_admin_kompetisi` PRIMARY KEY(`id_admin_kompetisi`),
	CONSTRAINT `tb_admin_kompetisi_id_akun_unique` UNIQUE(`id_akun`)
);
--> statement-breakpoint
CREATE TABLE `tb_akun` (
	`id_akun` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL,
	CONSTRAINT `tb_akun_id_akun` PRIMARY KEY(`id_akun`),
	CONSTRAINT `tb_akun_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tb_pelatih` (
	`id_pelatih` int AUTO_INCREMENT NOT NULL,
	`nama_pelatih` varchar(150) NOT NULL,
	`no_telp` varchar(15),
	`foto_ktp` varchar(255),
	`nik` varchar(16) NOT NULL,
	`tanggal_lahir` datetime,
	`jenis_kelamin` enum('LAKI_LAKI','PEREMPUAN'),
	`provinsi` varchar(100),
	`kota` varchar(100),
	`alamat` varchar(100),
	`sertifikat_sabuk` varchar(255),
	`id_akun` int NOT NULL,
	`id_dojang` int NOT NULL,
	CONSTRAINT `tb_pelatih_id_pelatih` PRIMARY KEY(`id_pelatih`),
	CONSTRAINT `tb_pelatih_nik_unique` UNIQUE(`nik`),
	CONSTRAINT `tb_pelatih_id_akun_unique` UNIQUE(`id_akun`)
);
--> statement-breakpoint
CREATE TABLE `tb_penyelenggara` (
	`id_penyelenggara` int AUTO_INCREMENT NOT NULL,
	`nama_penyelenggara` varchar(150) NOT NULL,
	`email` varchar(255),
	`no_telp` varchar(15),
	CONSTRAINT `tb_penyelenggara_id_penyelenggara` PRIMARY KEY(`id_penyelenggara`)
);
--> statement-breakpoint
CREATE TABLE `tb_dojang` (
	`id_dojang` int AUTO_INCREMENT NOT NULL,
	`nama_dojang` varchar(150) NOT NULL,
	`email` varchar(255),
	`no_telp` varchar(15),
	`founder` varchar(150),
	`negara` varchar(100),
	`provinsi` varchar(100),
	`kota` varchar(100),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tb_dojang_id_dojang` PRIMARY KEY(`id_dojang`)
);
--> statement-breakpoint
CREATE TABLE `tb_atlet` (
	`id_atlet` int AUTO_INCREMENT NOT NULL,
	`nama_atlet` varchar(150) NOT NULL,
	`tanggal_lahir` datetime NOT NULL,
	`nik` varchar(16) NOT NULL,
	`berat_badan` float NOT NULL,
	`provinsi` varchar(100) NOT NULL,
	`kota` varchar(100),
	`belt` varchar(50) NOT NULL,
	`alamat` varchar(100),
	`no_telp` varchar(15),
	`tinggi_badan` float NOT NULL,
	`jenis_kelamin` enum('LAKI_LAKI','PEREMPUAN') NOT NULL,
	`umur` int,
	`id_dojang` int NOT NULL,
	`id_pelatih_pembuat` int NOT NULL,
	`akte_kelahiran` varchar(255),
	`pas_foto` varchar(255),
	`sertifikat_belt` varchar(255),
	`ktp` varchar(255),
	CONSTRAINT `tb_atlet_id_atlet` PRIMARY KEY(`id_atlet`)
);
--> statement-breakpoint
CREATE TABLE `tb_kategori_event` (
	`id_kategori_event` int AUTO_INCREMENT NOT NULL,
	`nama_kategori` varchar(150) NOT NULL,
	CONSTRAINT `tb_kategori_event_id_kategori_event` PRIMARY KEY(`id_kategori_event`)
);
--> statement-breakpoint
CREATE TABLE `tb_kelas_berat` (
	`id_kelas_berat` int AUTO_INCREMENT NOT NULL,
	`id_kelompok` int NOT NULL,
	`jenis_kelamin` enum('LAKI_LAKI','PEREMPUAN') NOT NULL,
	`batas_min` float NOT NULL,
	`batas_max` float NOT NULL,
	`nama_kelas` varchar(100) NOT NULL,
	CONSTRAINT `tb_kelas_berat_id_kelas_berat` PRIMARY KEY(`id_kelas_berat`)
);
--> statement-breakpoint
CREATE TABLE `tb_kelas_kejuaraan` (
	`id_kelas_kejuaraan` int AUTO_INCREMENT NOT NULL,
	`id_kategori_event` int NOT NULL,
	`id_kelompok` int,
	`id_kelas_berat` int,
	`id_poomsae` int,
	`id_kompetisi` int NOT NULL,
	`cabang` enum('POOMSAE','KYORUGI') NOT NULL,
	CONSTRAINT `tb_kelas_kejuaraan_id_kelas_kejuaraan` PRIMARY KEY(`id_kelas_kejuaraan`)
);
--> statement-breakpoint
CREATE TABLE `tb_kelas_poomsae` (
	`id_poomsae` int AUTO_INCREMENT NOT NULL,
	`id_kelompok` int NOT NULL,
	`nama_kelas` varchar(50) NOT NULL,
	CONSTRAINT `tb_kelas_poomsae_id_poomsae` PRIMARY KEY(`id_poomsae`)
);
--> statement-breakpoint
CREATE TABLE `tb_kelompok_usia` (
	`id_kelompok` int AUTO_INCREMENT NOT NULL,
	`nama_kelompok` varchar(100) NOT NULL,
	`usia_min` int NOT NULL,
	`usia_max` int NOT NULL,
	CONSTRAINT `tb_kelompok_usia_id_kelompok` PRIMARY KEY(`id_kelompok`)
);
--> statement-breakpoint
CREATE TABLE `tb_kompetisi` (
	`id_kompetisi` int AUTO_INCREMENT NOT NULL,
	`id_penyelenggara` int NOT NULL,
	`tanggal_mulai` datetime NOT NULL,
	`lokasi` varchar(255) NOT NULL,
	`tanggal_selesai` datetime NOT NULL,
	`nama_event` varchar(255) NOT NULL,
	`status_kompetisi` enum('PENDAFTARAN','SEDANG_DIMULAI','SELESAI') NOT NULL,
	CONSTRAINT `tb_kompetisi_id_kompetisi` PRIMARY KEY(`id_kompetisi`)
);
--> statement-breakpoint
CREATE TABLE `tb_peserta_kompetisi` (
	`id_peserta_kompetisi` int AUTO_INCREMENT NOT NULL,
	`id_atlet` int,
	`id_kelas_kejuaraan` int NOT NULL,
	`is_team` boolean NOT NULL DEFAULT false,
	`status_pendaftaran` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	CONSTRAINT `tb_peserta_kompetisi_id_peserta_kompetisi` PRIMARY KEY(`id_peserta_kompetisi`)
);
--> statement-breakpoint
CREATE TABLE `tb_peserta_tim` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_peserta_kompetisi` int NOT NULL,
	`id_atlet` int NOT NULL,
	CONSTRAINT `tb_peserta_tim_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tb_venue` (
	`id_venue` int AUTO_INCREMENT NOT NULL,
	`id_kompetisi` int NOT NULL,
	`nama_venue` varchar(150) NOT NULL,
	`lokasi` varchar(255),
	CONSTRAINT `tb_venue_id_venue` PRIMARY KEY(`id_venue`)
);
--> statement-breakpoint
CREATE TABLE `tb_bagan` (
	`id_bagan` int AUTO_INCREMENT NOT NULL,
	`id_kompetisi` int NOT NULL,
	`id_kelas_kejuaraan` int NOT NULL,
	CONSTRAINT `tb_bagan_id_bagan` PRIMARY KEY(`id_bagan`)
);
--> statement-breakpoint
CREATE TABLE `tb_drawing_seed` (
	`id_seed` int AUTO_INCREMENT NOT NULL,
	`id_bagan` int NOT NULL,
	`id_peserta_kompetisi` int NOT NULL,
	`seed_num` int NOT NULL,
	CONSTRAINT `tb_drawing_seed_id_seed` PRIMARY KEY(`id_seed`)
);
--> statement-breakpoint
CREATE TABLE `tb_match` (
	`id_match` int AUTO_INCREMENT NOT NULL,
	`id_bagan` int NOT NULL,
	`ronde` int NOT NULL,
	`id_peserta_a` int,
	`id_peserta_b` int,
	`skor_a` int NOT NULL DEFAULT 0,
	`skor_b` int NOT NULL DEFAULT 0,
	`id_venue` int,
	CONSTRAINT `tb_match_id_match` PRIMARY KEY(`id_match`)
);
--> statement-breakpoint
CREATE TABLE `tb_match_audit` (
	`id_audit` int AUTO_INCREMENT NOT NULL,
	`id_match` int NOT NULL,
	`id_user` int NOT NULL,
	`aksi` varchar(100) NOT NULL,
	`payload` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tb_match_audit_id_audit` PRIMARY KEY(`id_audit`)
);
--> statement-breakpoint
CREATE TABLE `tb_audit_log` (
	`id_log` int AUTO_INCREMENT NOT NULL,
	`id_user` int NOT NULL,
	`tabel` varchar(100) NOT NULL,
	`aksi` varchar(100) NOT NULL,
	`data_lama` json,
	`data_baru` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tb_audit_log_id_log` PRIMARY KEY(`id_log`)
);
--> statement-breakpoint
CREATE INDEX `tb_admin_kompetisi_id_akun_fkey` ON `tb_admin_kompetisi` (`id_akun`);--> statement-breakpoint
CREATE INDEX `tb_admin_kompetisi_id_kompetisi_fkey` ON `tb_admin_kompetisi` (`id_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_atlet_id_dojang_idx` ON `tb_atlet` (`id_dojang`);--> statement-breakpoint
CREATE INDEX `tb_atlet_id_pelatih_pembuat_idx` ON `tb_atlet` (`id_pelatih_pembuat`);--> statement-breakpoint
CREATE INDEX `tb_kelas_berat_id_kelompok_fkey` ON `tb_kelas_berat` (`id_kelompok`);--> statement-breakpoint
CREATE INDEX `tb_kelas_kejuaraan_id_kompetisi_fkey` ON `tb_kelas_kejuaraan` (`id_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_kompetisi_id_penyelenggara_fkey` ON `tb_kompetisi` (`id_penyelenggara`);--> statement-breakpoint
CREATE INDEX `tb_peserta_kompetisi_id_atlet_idx` ON `tb_peserta_kompetisi` (`id_atlet`);--> statement-breakpoint
CREATE INDEX `tb_peserta_kompetisi_id_kelas_kejuaraan_idx` ON `tb_peserta_kompetisi` (`id_kelas_kejuaraan`);--> statement-breakpoint
CREATE INDEX `tb_peserta_tim_id_peserta_kompetisi_idx` ON `tb_peserta_tim` (`id_peserta_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_peserta_tim_id_atlet_idx` ON `tb_peserta_tim` (`id_atlet`);--> statement-breakpoint
CREATE INDEX `tb_venue_id_kompetisi_fkey` ON `tb_venue` (`id_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_bagan_id_kompetisi_fkey` ON `tb_bagan` (`id_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_bagan_id_kelas_kejuaraan_fkey` ON `tb_bagan` (`id_kelas_kejuaraan`);--> statement-breakpoint
CREATE INDEX `tb_drawing_seed_id_bagan_fkey` ON `tb_drawing_seed` (`id_bagan`);--> statement-breakpoint
CREATE INDEX `tb_drawing_seed_id_peserta_kompetisi_fkey` ON `tb_drawing_seed` (`id_peserta_kompetisi`);--> statement-breakpoint
CREATE INDEX `tb_match_id_bagan_fkey` ON `tb_match` (`id_bagan`);--> statement-breakpoint
CREATE INDEX `tb_match_id_peserta_a_fkey` ON `tb_match` (`id_peserta_a`);--> statement-breakpoint
CREATE INDEX `tb_match_id_peserta_b_fkey` ON `tb_match` (`id_peserta_b`);--> statement-breakpoint
CREATE INDEX `tb_match_id_venue_fkey` ON `tb_match` (`id_venue`);--> statement-breakpoint
CREATE INDEX `tb_match_audit_id_match_fkey` ON `tb_match_audit` (`id_match`);