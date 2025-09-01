-- CreateTable
CREATE TABLE `tb_admin_kompetisi` (
    `id_admin_kompetisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kompetisi` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `id_akun` INTEGER NOT NULL,

    UNIQUE INDEX `tb_admin_kompetisi_id_akun_key`(`id_akun`),
    INDEX `tb_admin_kompetisi_id_akun_fkey`(`id_akun`),
    INDEX `tb_admin_kompetisi_id_kompetisi_fkey`(`id_kompetisi`),
    PRIMARY KEY (`id_admin_kompetisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_admin_kompetisi` ADD CONSTRAINT `tb_admin_kompetisi_id_akun_fkey` FOREIGN KEY (`id_akun`) REFERENCES `tb_akun`(`id_akun`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_admin_kompetisi` ADD CONSTRAINT `tb_admin_kompetisi_id_kompetisi_fkey` FOREIGN KEY (`id_kompetisi`) REFERENCES `tb_kompetisi`(`id_kompetisi`) ON DELETE RESTRICT ON UPDATE CASCADE;
