/*
  Warnings:

  - Added the required column `belt` to the `tb_atlet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nik` to the `tb_atlet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_atlet` ADD COLUMN `alamat` VARCHAR(191) NULL,
    ADD COLUMN `belt` VARCHAR(191) NOT NULL,
    ADD COLUMN `nik` VARCHAR(191) NOT NULL,
    ADD COLUMN `no_telp` VARCHAR(191) NULL,
    MODIFY `umur` INTEGER NULL;
