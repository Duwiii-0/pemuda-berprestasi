<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bagan extends Model
{
    use HasFactory;

    protected $table = 'tb_bagan';
    protected $primaryKey = 'id_bagan';
    public $timestamps = false;

    protected $fillable = [
        'id_kompetisi',
        'id_kelas_kejuaraan',
        'bracket_data', // Assuming this stores the JSON structure
    ];

    protected $casts = [
        'bracket_data' => 'array',
    ];

    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }

    public function kelasKejuaraan(): BelongsTo
    {
        return $this->belongsTo(KelasKejuaraan::class, 'id_kelas_kejuaraan', 'id_kelas_kejuaraan');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(Match::class, 'id_bagan', 'id_bagan');
    }
}
