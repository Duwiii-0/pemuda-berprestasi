/*
  Warnings:

  - You are about to drop the column `daftar_taeguk` on the `tb_kelas_poomsae` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `tb_kelas_poomsae` table. All the data in the column will be lost.
  - Added the required column `nama_kelas` to the `tb_kelas_poomsae` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_kelas_poomsae` DROP COLUMN `daftar_taeguk`,
    DROP COLUMN `level`,
    ADD COLUMN `nama_kelas` VARCHAR(50) NOT NULL;
