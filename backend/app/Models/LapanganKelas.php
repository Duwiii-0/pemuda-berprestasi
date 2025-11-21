<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LapanganKelas extends Model
{
    use HasFactory;

    protected $table = 'tb_lapangan_kelas';
    // This model uses a composite primary key, which Eloquent doesn't support well out-of-the-box.
    // We'll treat it as a model without a primary key for simplicity in this context.
    protected $primaryKey = null;
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_lapangan',
        'id_kelas_kejuaraan',
        'urutan',
    ];

    public function lapangan(): BelongsTo
    {
        return $this->belongsTo(Lapangan::class, 'id_lapangan', 'id_lapangan');
    }

    public function kelasKejuaraan(): BelongsTo
    {
        return $this->belongsTo(KelasKejuaraan::class, 'id_kelas_kejuaraan', 'id_kelas_kejuaraan');
    }
}
