<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KategoriEvent extends Model
{
    use HasFactory;

    protected $table = 'tb_kategori_event';
    protected $primaryKey = 'id_kategori_event';

    protected $fillable = [
        'nama_kategori',
    ];

    /**
     * Get all of the kelasKejuaraan for the KategoriEvent
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kelasKejuaraan(): HasMany
    {
        return $this->hasMany(KelasKejuaraan::class, 'id_kategori_event', 'id_kategori_event');
    }
}

