/*
  Warnings:

  - The values [L,P] on the enum `tb_kelas_berat_gender` will be removed. If these variants are still used in the database, this will fail.
  - The values [L,P] on the enum `tb_kelas_berat_gender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `tb_atlet` MODIFY `jenis_kelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL;

-- AlterTable
ALTER TABLE `tb_kelas_berat` MODIFY `gender` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL;
