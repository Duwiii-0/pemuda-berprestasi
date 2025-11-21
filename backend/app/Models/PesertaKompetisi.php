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
    public $timestamps = false;

    protected $fillable = [
        'id_kompetisi',
        'id_atlet',
        'id_pelatih',
        'id_dojang',
        'id_kelas_berat',
        'id_kelas_poomsae',
        'status_pembayaran',
        'sertifikat_path',
        'id_tim',
    ];

    /**
     * Get the atlet that is registered for the competition.
     */
    public function atlet(): BelongsTo
    {
        return $this->belongsTo(Atlet::class, 'id_atlet', 'id_atlet');
    }

    /**
     * Get the competition that the participant is registered for.
     */
    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }

    /**
     * Get the pelatih for the participant.
     */
    public function pelatih(): BelongsTo
    {
        return $this->belongsTo(Pelatih::class, 'id_pelatih', 'id_pelatih');
    }

    /**
     * Get the dojang for the participant.
     */
    public function dojang(): BelongsTo
    {
        return $this->belongsTo(Dojang::class, 'id_dojang', 'id_dojang');
    }

    /**
     * Get the weight class for the participant (optional).
     */
    public function kelasBerat(): BelongsTo
    {
        return $this->belongsTo(KelasBerat::class, 'id_kelas_berat', 'id_kelas_berat');
    }

    /**
     * Get the poomsae class for the participant (optional).
     */
    public function kelasPoomsae(): BelongsTo
    {
        return $this->belongsTo(KelasPoomsae::class, 'id_kelas_poomsae', 'id_kelas_poomsae');
    }
}

