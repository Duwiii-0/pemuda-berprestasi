<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Antrian extends Model
{
    use HasFactory;

    protected $table = 'tb_antrian';
    protected $primaryKey = 'id_antrian';
    public $timestamps = false;

    protected $fillable = [
        'id_lapangan',
        'bertanding',
        'persiapan',
        'pemanasan',
    ];

    public function lapangan(): BelongsTo
    {
        return $this->belongsTo(Lapangan::class, 'id_lapangan', 'id_lapangan');
    }
}
