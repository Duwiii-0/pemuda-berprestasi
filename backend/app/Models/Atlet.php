<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Atlet extends Model
{
    use HasFactory;

    protected $table = 'tb_atlet';
    protected $primaryKey = 'id_atlet';
    public $timestamps = false;

    protected $fillable = [
        'nama_atlet',
        'tanggal_lahir',
        'nik',
        'berat_badan',
        'provinsi',
        'kota',
        'belt',
        'alamat',
        'no_telp',
        'tinggi_badan',
        'jenis_kelamin',
        'umur',
        'id_dojang',
        'id_pelatih_pembuat',
        'akte_kelahiran',
        'pas_foto',
        'sertifikat_belt',
        'ktp',
    ];

    /**
     * Get the dojang that owns the Atlet
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function dojang(): BelongsTo
    {
        return $this->belongsTo(Dojang::class, 'id_dojang', 'id_dojang');
    }

    /**
     * Get the pelatih that created the Atlet
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function pelatihPembuat(): BelongsTo
    {
        return $this->belongsTo(Pelatih::class, 'id_pelatih_pembuat', 'id_pelatih');
    }

    /**
     * Get all of the pesertaKompetisi for the Atlet
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pesertaKompetisi(): HasMany
    {
        return $this->hasMany(PesertaKompetisi::class, 'id_atlet', 'id_atlet');
    }
}
