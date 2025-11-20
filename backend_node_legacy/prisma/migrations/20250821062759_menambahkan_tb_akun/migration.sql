/*
  Warnings:

  - A unique constraint covering the columns `[id_akun]` on the table `tb_pelatih` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `tb_pelatih` ADD COLUMN `id_akun` INTEGER NULL;

-- CreateTable
CREATE TABLE `tb_akun` (
    `id_akun` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'PELATIH') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_akun_username_key`(`username`),
    PRIMARY KEY (`id_akun`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `tb_pelatih_id_akun_key` ON `tb_pelatih`(`id_akun`);

-- AddForeignKey
ALTER TABLE `tb_pelatih` ADD CONSTRAINT `tb_pelatih_id_akun_fkey` FOREIGN KEY (`id_akun`) REFERENCES `tb_akun`(`id_akun`) ON DELETE SET NULL ON UPDATE CASCADE;
