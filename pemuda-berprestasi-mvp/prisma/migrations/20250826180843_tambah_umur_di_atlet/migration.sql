/*
  Warnings:

  - Added the required column `umur` to the `tb_atlet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tb_atlet` ADD COLUMN `umur` INTEGER NOT NULL;
