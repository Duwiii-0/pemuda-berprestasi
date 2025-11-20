-- DropForeignKey
ALTER TABLE `tb_peserta_kompetisi` DROP FOREIGN KEY `tb_peserta_kompetisi_id_atlet_fkey`;

-- AlterTable
ALTER TABLE `tb_peserta_kompetisi` ADD COLUMN `is_team` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `id_atlet` INTEGER NULL;

-- CreateTable
CREATE TABLE `tb_peserta_tim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_peserta_kompetisi` INTEGER NOT NULL,
    `id_atlet` INTEGER NOT NULL,

    INDEX `tb_peserta_tim_id_peserta_kompetisi_idx`(`id_peserta_kompetisi`),
    INDEX `tb_peserta_tim_id_atlet_idx`(`id_atlet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_peserta_tim` ADD CONSTRAINT `tb_peserta_tim_id_peserta_kompetisi_fkey` FOREIGN KEY (`id_peserta_kompetisi`) REFERENCES `tb_peserta_kompetisi`(`id_peserta_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_peserta_tim` ADD CONSTRAINT `tb_peserta_tim_id_atlet_fkey` FOREIGN KEY (`id_atlet`) REFERENCES `tb_atlet`(`id_atlet`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_peserta_kompetisi` ADD CONSTRAINT `tb_peserta_kompetisi_id_atlet_fkey` FOREIGN KEY (`id_atlet`) REFERENCES `tb_atlet`(`id_atlet`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `tb_atlet` RENAME INDEX `tb_atlet_id_dojang_fkey` TO `tb_atlet_id_dojang_idx`;

-- RenameIndex
ALTER TABLE `tb_atlet` RENAME INDEX `tb_atlet_id_pelatih_pembuat_fkey` TO `tb_atlet_id_pelatih_pembuat_idx`;

-- RenameIndex
ALTER TABLE `tb_peserta_kompetisi` RENAME INDEX `tb_peserta_kompetisi_id_atlet_fkey` TO `tb_peserta_kompetisi_id_atlet_idx`;

-- RenameIndex
ALTER TABLE `tb_peserta_kompetisi` RENAME INDEX `tb_peserta_kompetisi_id_kelas_kejuaraan_fkey` TO `tb_peserta_kompetisi_id_kelas_kejuaraan_idx`;
