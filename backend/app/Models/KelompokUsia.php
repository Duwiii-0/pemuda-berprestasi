<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KelompokUsia extends Model
{
    use HasFactory;

    protected $table = 'tb_kelompok_usia';
    protected $primaryKey = 'id_kelompok';

    protected $fillable = [
        'nama_kelompok',
        'usia_min',
        'usia_max',
    ];

    /**
     * Get all of the kelasBerat for the KelompokUsia
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasBerat(): HasMany
    {
        return $this->hasMany(KelasBerat::class, 'id_kelompok', 'id_kelompok');
    }

    /**
     * Get all of the kelasPoomsae for the KelompokUsia
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasPoomsae(): HasMany
    {
        return $this->hasMany(KelasPoomsae::class, 'id_kelompok', 'id_kelompok');
    }

    /**
     * Get all of the kelasKejuaraan for the KelompokUsia
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasKejuaraan(): HasMany
    {
        return $this->hasMany(KelasKejuaraan::class, 'id_kelompok', 'id_kelompok');
    }
}

