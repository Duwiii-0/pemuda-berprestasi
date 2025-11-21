<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    use HasFactory;

    protected $table = 'tb_certificate';
    protected $primaryKey = 'id_certificate';

    const CREATED_AT = 'generated_at';
    const UPDATED_AT = null; // No updated_at column in the table

    protected $fillable = [
        'certificate_number',
        'id_atlet',
        'id_peserta_kompetisi',
        'id_kompetisi',
        'medal_status',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function atlet(): BelongsTo
    {
        return $this->belongsTo(Atlet::class, 'id_atlet', 'id_atlet');
    }

    public function pesertaKompetisi(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'id_peserta_kompetisi', 'id_peserta_kompetisi');
    }

    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }
}
