-- AlterTable
ALTER TABLE `tb_pelatih` MODIFY `jenis_kelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NULL,
    MODIFY `tanggal_lahir` DATETIME(3) NULL;
