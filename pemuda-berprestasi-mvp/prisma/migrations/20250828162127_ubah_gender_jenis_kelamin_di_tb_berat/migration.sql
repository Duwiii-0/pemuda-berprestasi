/*
  Warnings:

  - You are about to drop the column `gender` on the `tb_kelas_berat` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `tb_kompetisi` table. All the data in the column will be lost.
  - You are about to drop the column `type_kompetisi` on the `tb_kompetisi` table. All the data in the column will be lost.
  - Added the required column `jenis_kelamin` to the `tb_kelas_berat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_kelas_berat` DROP COLUMN `gender`,
    ADD COLUMN `jenis_kelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL;

-- AlterTable
ALTER TABLE `tb_kompetisi` DROP COLUMN `status`,
    DROP COLUMN `type_kompetisi`;
