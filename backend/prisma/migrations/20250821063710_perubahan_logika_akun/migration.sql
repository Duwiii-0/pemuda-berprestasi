/*
  Warnings:

  - You are about to drop the column `password` on the `tb_akun` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `tb_akun` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `tb_pelatih` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `tb_pelatih` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `tb_akun` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `tb_akun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `tb_akun` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `tb_akun_username_key` ON `tb_akun`;

-- DropIndex
DROP INDEX `tb_pelatih_email_key` ON `tb_pelatih`;

-- AlterTable
ALTER TABLE `tb_akun` DROP COLUMN `password`,
    DROP COLUMN `username`,
    ADD COLUMN `email` VARCHAR(255) NOT NULL,
    ADD COLUMN `password_hash` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `tb_pelatih` DROP COLUMN `email`,
    DROP COLUMN `password_hash`;

-- CreateIndex
CREATE UNIQUE INDEX `tb_akun_email_key` ON `tb_akun`(`email`);
