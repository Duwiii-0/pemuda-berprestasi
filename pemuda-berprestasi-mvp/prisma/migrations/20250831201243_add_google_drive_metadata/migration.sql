-- AlterTable
ALTER TABLE `tb_atlet` ADD COLUMN `akte_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `akte_gdrive_url` VARCHAR(500) NULL,
    ADD COLUMN `ktp_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `ktp_gdrive_url` VARCHAR(500) NULL,
    ADD COLUMN `pas_foto_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `pas_foto_gdrive_url` VARCHAR(500) NULL,
    ADD COLUMN `sertifikat_belt_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `sertifikat_belt_gdrive_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `tb_pelatih` ADD COLUMN `ktp_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `ktp_gdrive_url` VARCHAR(500) NULL,
    ADD COLUMN `sertifikat_gdrive_id` VARCHAR(255) NULL,
    ADD COLUMN `sertifikat_gdrive_url` VARCHAR(500) NULL;
