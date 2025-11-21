<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Match extends Model
{
    use HasFactory;

    protected $table = 'tb_match';
    protected $primaryKey = 'id_match';
    public $timestamps = false;

    protected $fillable = [
        'id_bagan',
        'ronde',
        'id_peserta_a',
        'id_peserta_b',
        'skor_a',
        'skor_b',
        'winner_id',
        'nomor_antrian',
        'nomor_lapangan',
        'nomor_partai',
        'tanggal_pertandingan',
    ];

    protected $casts = [
        'tanggal_pertandingan' => 'datetime',
    ];

    public function bagan(): BelongsTo
    {
        return $this->belongsTo(Bagan::class, 'id_bagan', 'id_bagan');
    }

    public function pesertaA(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'id_peserta_a', 'id_peserta_kompetisi');
    }

    public function pesertaB(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'id_peserta_b', 'id_peserta_kompetisi');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'winner_id', 'id_peserta_kompetisi');
    }
}
