/*
  Warnings:

  - You are about to drop the column `created_at` on the `tb_akun` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `tb_akun` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `tb_akun` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `tb_akun` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    MODIFY `role` VARCHAR(50) NOT NULL;

-- CreateTable
CREATE TABLE `tb_admin` (
    `id_admin` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `id_akun` INTEGER NOT NULL,

    UNIQUE INDEX `tb_admin_id_akun_key`(`id_akun`),
    PRIMARY KEY (`id_admin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_admin` ADD CONSTRAINT `tb_admin_id_akun_fkey` FOREIGN KEY (`id_akun`) REFERENCES `tb_akun`(`id_akun`) ON DELETE RESTRICT ON UPDATE CASCADE;
