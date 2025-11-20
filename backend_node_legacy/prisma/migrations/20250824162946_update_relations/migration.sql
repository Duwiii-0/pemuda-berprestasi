/*
  Warnings:

  - You are about to drop the column `id_pelatih_pendaftar` on the `tb_dojang` table. All the data in the column will be lost.
  - Added the required column `id_dojang` to the `tb_pelatih` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tb_dojang` DROP FOREIGN KEY `tb_dojang_id_pelatih_pendaftar_fkey`;

-- DropIndex
DROP INDEX `tb_dojang_id_pelatih_pendaftar_fkey` ON `tb_dojang`;

-- AlterTable
ALTER TABLE `tb_dojang` DROP COLUMN `id_pelatih_pendaftar`;

-- AlterTable
ALTER TABLE `tb_pelatih` ADD COLUMN `id_dojang` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `tb_pelatih` ADD CONSTRAINT `tb_pelatih_id_dojang_fkey` FOREIGN KEY (`id_dojang`) REFERENCES `tb_dojang`(`id_dojang`) ON DELETE RESTRICT ON UPDATE CASCADE;
