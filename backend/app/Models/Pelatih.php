<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pelatih extends Model
{
    use HasFactory;

    protected $table = 'tb_pelatih';
    protected $primaryKey = 'id_pelatih';
    public $timestamps = false;

    protected $fillable = [
        'nama_pelatih',
        'no_telp',
        'foto_ktp',
        'nik',
        'tanggal_lahir',
        'jenis_kelamin',
        'provinsi',
        'kota',
        'alamat',
        'sertifikat_sabuk',
        'id_akun',
        'id_dojang',
    ];

    /**
     * Get the akun that owns the Pelatih
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function akun(): BelongsTo
    {
        return $this->belongsTo(Akun::class, 'id_akun', 'id_akun');
    }

    /**
     * Get the dojang that owns the Pelatih
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function dojang(): BelongsTo
    {
        return $this->belongsTo(Dojang::class, 'id_dojang', 'id_dojang');
    }

    /**
     * Get all of the atlets created by this Pelatih
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function atletDibuat(): HasMany
    {
        return $this->hasMany(Atlet::class, 'id_pelatih_pembuat', 'id_pelatih');
    }
}
