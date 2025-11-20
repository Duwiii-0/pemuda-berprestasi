<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kompetisi extends Model
{
    use HasFactory;

    protected $table = 'tb_kompetisi';
    protected $primaryKey = 'id_kompetisi';

    protected $fillable = [
        'id_penyelenggara',
        'tanggal_mulai',
        'lokasi',
        'tanggal_selesai',
        'nama_event',
        'status',
        'deskripsi',
        'website_url',
        'poster_image',
    ];

    /**
     * Get the penyelenggara that owns the Kompetisi
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function penyelenggara(): BelongsTo
    {
        return $this->belongsTo(Penyelenggara::class, 'id_penyelenggara', 'id_penyelenggara');
    }
}

