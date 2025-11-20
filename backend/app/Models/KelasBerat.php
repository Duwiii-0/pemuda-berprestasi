<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KelasBerat extends Model
{
    use HasFactory;

    protected $table = 'tb_kelas_berat';
    protected $primaryKey = 'id_kelas_berat';

    protected $fillable = [
        'id_kelompok',
        'jenis_kelamin',
        'batas_min',
        'batas_max',
        'nama_kelas',
    ];

    /**
     * Get the kelompok that owns the KelasBerat
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokUsia::class, 'id_kelompok', 'id_kelompok');
    }

    /**
     * Get all of the kelasKejuaraan for the KelasBerat
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasKejuaraan(): HasMany
    {
        return $this->hasMany(KelasKejuaraan::class, 'id_kelas_berat', 'id_kelas_berat');
    }
}

