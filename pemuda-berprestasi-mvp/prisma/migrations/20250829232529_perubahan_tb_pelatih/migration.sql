/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `tb_pelatih` will be added. If there are existing duplicate values, this will fail.
  - Made the column `id_akun` on table `tb_pelatih` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nik` on table `tb_pelatih` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `tb_pelatih` DROP FOREIGN KEY `tb_pelatih_id_akun_fkey`;

-- AlterTable
ALTER TABLE `tb_pelatih` MODIFY `id_akun` INTEGER NOT NULL,
    MODIFY `nik` VARCHAR(16) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tb_pelatih_nik_key` ON `tb_pelatih`(`nik`);

-- AddForeignKey
ALTER TABLE `tb_pelatih` ADD CONSTRAINT `tb_pelatih_id_akun_fkey` FOREIGN KEY (`id_akun`) REFERENCES `tb_akun`(`id_akun`) ON DELETE RESTRICT ON UPDATE CASCADE;
