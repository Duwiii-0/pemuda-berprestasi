<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PesertaKompetisi extends Model
{
    use HasFactory;

    protected $table = 'tb_peserta_kompetisi';
    protected $primaryKey = 'id_peserta_kompetisi';

    protected $fillable = [
        'id_atlet',
        'id_kelas_kejuaraan',
        'is_team',
        'status',
        'penimbangan1',
        'penimbangan2',
    ];

    /**
     * Get the atlet that owns the PesertaKompetisi
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function atlet(): BelongsTo
    {
        return $this->belongsTo(Atlet::class, 'id_atlet', 'id_atlet');
    }

    /**
     * Get the kelasKejuaraan that owns the PesertaKompetisi
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kelasKejuaraan(): BelongsTo
    {
        return $this->belongsTo(KelasKejuaraan::class, 'id_kelas_kejuaraan', 'id_kelas_kejuaraan');
    }
}

