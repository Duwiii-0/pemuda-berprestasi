/*
  Warnings:

  - Added the required column `status` to the `tb_kompetisi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_kompetisi` ADD COLUMN `status` ENUM('PENDAFTARAN', 'SEDANG_DIMULAI', 'SELESAI') NOT NULL;
