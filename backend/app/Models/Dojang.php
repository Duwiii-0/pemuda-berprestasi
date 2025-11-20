<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dojang extends Model
{
    use HasFactory;

    protected $table = 'tb_dojang';
    protected $primaryKey = 'id_dojang';
    public $timestamps = true;

    protected $fillable = [
        'nama_dojang',
        'email',
        'no_telp',
        'founder',
        'negara',
        'provinsi',
        'kota',
        'kecamatan',
        'kelurahan',
        'alamat',
        'logo',
    ];

    /**
     * Get all of the pelatihs for the Dojang
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pelatih(): HasMany
    {
        return $this->hasMany(Pelatih::class, 'id_dojang', 'id_dojang');
    }

    /**
     * Get all of the atlets for the Dojang
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function atlet(): HasMany
    {
        return $this->hasMany(Atlet::class, 'id_dojang', 'id_dojang');
    }
}
