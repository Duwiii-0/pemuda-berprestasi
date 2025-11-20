/*
  Warnings:

  - Added the required column `lokasi` to the `tb_kompetisi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_kompetisi` ADD COLUMN `lokasi` VARCHAR(191) NOT NULL;
