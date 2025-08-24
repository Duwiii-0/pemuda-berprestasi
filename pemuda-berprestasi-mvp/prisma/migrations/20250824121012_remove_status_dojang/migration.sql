/*
  Warnings:

  - You are about to drop the column `status` on the `tb_dojang` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `tb_dojang_status_idx` ON `tb_dojang`;

-- AlterTable
ALTER TABLE `tb_dojang` DROP COLUMN `status`;
