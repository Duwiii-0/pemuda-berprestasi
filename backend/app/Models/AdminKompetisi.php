<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminKompetisi extends Model
{
    use HasFactory;

    protected $table = 'tb_admin_kompetisi';
    protected $primaryKey = 'id_admin_kompetisi';
    public $timestamps = false;

    protected $fillable = [
        'id_kompetisi',
        'nama',
        'id_akun',
    ];

    public function akun(): BelongsTo
    {
        return $this->belongsTo(Akun::class, 'id_akun', 'id_akun');
    }

    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }
}
