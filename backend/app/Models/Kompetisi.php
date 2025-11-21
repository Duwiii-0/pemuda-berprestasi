<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kompetisi extends Model
{
    use HasFactory;

    protected $table = 'tb_kompetisi';
    protected $primaryKey = 'id_kompetisi';
    public $timestamps = false;

    protected $fillable = [
        'id_penyelenggara',
        'id_kategori_event',
        'nama_kompetisi',
        'tanggal_mulai',
        'tanggal_selesai',
        'lokasi',
        'status',
        'banner',
        'proposal',
        'admin_kompetisi',
    ];

    protected $casts = [
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
    ];

    /**
     * Get the penyelenggara that owns the Kompetisi
     */
    public function penyelenggara(): BelongsTo
    {
        return $this->belongsTo(Penyelenggara::class, 'id_penyelenggara', 'id_penyelenggara');
    }

    /**
     * Get the kategori event for the Kompetisi.
     */
    public function kategoriEvent(): BelongsTo
    {
        return $this->belongsTo(KategoriEvent::class, 'id_kategori_event', 'id_kategori_event');
    }

    /**
     * Get all of the peserta for the Kompetisi.
     */
    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }
}

