<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrawingSeed extends Model
{
    use HasFactory;

    protected $table = 'tb_drawing_seed';
    protected $primaryKey = null; // Composite primary key, handled manually
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_bagan',
        'id_peserta_kompetisi',
        'seed_num',
    ];

    public function bagan(): BelongsTo
    {
        return $this->belongsTo(Bagan::class, 'id_bagan', 'id_bagan');
    }

    public function pesertaKompetisi(): BelongsTo
    {
        return $this->belongsTo(PesertaKompetisi::class, 'id_peserta_kompetisi', 'id_peserta_kompetisi');
    }
}
