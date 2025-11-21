<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lapangan extends Model
{
    use HasFactory;

    protected $table = 'tb_lapangan';
    protected $primaryKey = 'id_lapangan';
    public $timestamps = false;

    protected $fillable = [
        'id_kompetisi',
        'nama_lapangan',
        'tanggal',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }

    public function kelasList(): HasMany
    {
        return $this->hasMany(LapanganKelas::class, 'id_lapangan', 'id_lapangan');
    }

    public function antrian(): HasOne
    {
        return $this->hasOne(Antrian::class, 'id_lapangan', 'id_lapangan');
    }
}
