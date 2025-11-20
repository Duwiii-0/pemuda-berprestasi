/*
  Warnings:

  - Added the required column `updated_at` to the `tb_dojang` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tb_dojang` DROP FOREIGN KEY `tb_dojang_id_pelatih_pendaftar_fkey`;

-- AlterTable
ALTER TABLE `tb_dojang` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `id_pelatih_pendaftar` INTEGER NULL;

-- CreateIndex
CREATE INDEX `tb_dojang_status_idx` ON `tb_dojang`(`status`);

-- AddForeignKey
ALTER TABLE `tb_dojang` ADD CONSTRAINT `tb_dojang_id_pelatih_pendaftar_fkey` FOREIGN KEY (`id_pelatih_pendaftar`) REFERENCES `tb_pelatih`(`id_pelatih`) ON DELETE SET NULL ON UPDATE CASCADE;
