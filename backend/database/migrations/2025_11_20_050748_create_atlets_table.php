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
        Schema::create('tb_atlet', function (Blueprint $table) {
            $table->id('id_atlet');
            $table->string('nama_atlet', 150);
            $table->dateTime('tanggal_lahir');
            $table->string('nik');
            $table->float('berat_badan');
            $table->string('provinsi', 100);
            $table->string('kota', 100)->nullable();
            $table->string('belt');
            $table->string('alamat')->nullable();
            $table->string('no_telp')->nullable();
            $table->float('tinggi_badan');
            $table->enum('jenis_kelamin', ['LAKI_LAKI', 'PEREMPUAN']);
            $table->integer('umur')->nullable();
            
            $table->foreignId('id_dojang')->constrained('tb_dojang', 'id_dojang')->onDelete('cascade');
            $table->foreignId('id_pelatih_pembuat')->constrained('tb_pelatih', 'id_pelatih');

            $table->string('akte_kelahiran')->nullable();
            $table->string('pas_foto')->nullable();
            $table->string('sertifikat_belt')->nullable();
            $table->string('ktp')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_atlet');
    }
};
