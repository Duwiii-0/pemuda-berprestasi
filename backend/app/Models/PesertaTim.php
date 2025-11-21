<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PesertaTim extends Model
{
    use HasFactory;

    protected $table = 'tb_peserta_tim';
    // This model uses a composite primary key, which Eloquent doesn't support well out-of-the-box.
    // We'll treat it as a model without a primary key for simplicity in this context.
    protected $primaryKey = null;
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_peserta_kompetisi',
        'id_atlet',
    ];

    public function pesertaKompetisi(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'id_peserta_kompetisi', 'id_peserta_kompetisi');
    }

    public function atlet(): BelongsTo
    {
        return $this->belongsTo(Atlet::class, 'id_atlet', 'id_atlet');
    }
}
