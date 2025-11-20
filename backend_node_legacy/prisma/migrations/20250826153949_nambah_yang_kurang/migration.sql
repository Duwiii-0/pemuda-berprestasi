/*
  Warnings:

  - Added the required column `provinsi` to the `tb_atlet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenis_kelamin` to the `tb_pelatih` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_lahir` to the `tb_pelatih` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_atlet` ADD COLUMN `kota` VARCHAR(100) NULL,
    ADD COLUMN `provinsi` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `tb_pelatih` ADD COLUMN `jenis_kelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    ADD COLUMN `kota` VARCHAR(100) NULL,
    ADD COLUMN `nik` VARCHAR(255) NULL,
    ADD COLUMN `provinsi` VARCHAR(100) NULL,
    ADD COLUMN `tanggal_lahir` DATETIME(3) NOT NULL;
