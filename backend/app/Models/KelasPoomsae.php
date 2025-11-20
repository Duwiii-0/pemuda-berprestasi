<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KelasPoomsae extends Model
{
    use HasFactory;

    protected $table = 'tb_kelas_poomsae';
    protected $primaryKey = 'id_poomsae';

    protected $fillable = [
        'id_kelompok',
        'nama_kelas',
        'jenis_kelamin',
    ];

    /**
     * Get the kelompok that owns the KelasPoomsae
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokUsia::class, 'id_kelompok', 'id_kelompok');
    }

    /**
     * Get all of the kelasKejuaraan for the KelasPoomsae
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasKejuaraan(): HasMany
    {
        return $this->hasMany(KelasKejuaraan::class, 'id_poomsae', 'id_poomsae');
    }
}

