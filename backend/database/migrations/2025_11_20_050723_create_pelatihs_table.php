<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tb_pelatih', function (Blueprint $table) {
            $table->id('id_pelatih');
            $table->string('nama_pelatih', 150);
            $table->string('no_telp', 15)->nullable();
            $table->string('foto_ktp')->nullable();
            $table->string('nik', 16)->unique();
            $table->dateTime('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['LAKI_LAKI', 'PEREMPUAN'])->nullable();
            $table->string('provinsi', 100)->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('alamat', 100)->nullable();
            $table->string('sertifikat_sabuk')->nullable();
            
            $table->foreignId('id_akun')->unique()->constrained('tb_akun', 'id_akun');
            $table->foreignId('id_dojang')->constrained('tb_dojang', 'id_dojang')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_pelatih');
    }
};
