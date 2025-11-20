<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KelasKejuaraan extends Model
{
    use HasFactory;

    protected $table = 'tb_kelas_kejuaraan';
    protected $primaryKey = 'id_kelas_kejuaraan';

    protected $fillable = [
        'id_kategori_event',
        'id_kelompok',
        'id_kelas_berat',
        'id_poomsae',
        'id_kompetisi',
        'cabang',
        'poomsae_type',
        'jenis_kelamin',
        'bracket_status',
    ];

    /**
     * Get the kategoriEvent that owns the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kategoriEvent(): BelongsTo
    {
        return $this->belongsTo(KategoriEvent::class, 'id_kategori_event', 'id_kategori_event');
    }

    /**
     * Get the kelompok that owns the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokUsia::class, 'id_kelompok', 'id_kelompok');
    }

    /**
     * Get the kelasBerat that owns the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kelasBerat(): BelongsTo
    {
        return $this->belongsTo(KelasBerat::class, 'id_kelas_berat', 'id_kelas_berat');
    }

    /**
     * Get the poomsae that owns the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function poomsae(): BelongsTo
    {
        return $this->belongsTo(KelasPoomsae::class, 'id_poomsae', 'id_poomsae');
    }

    /**
     * Get the kompetisi that owns the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function kompetisi(): BelongsTo
    {
        return $this->belongsTo(Kompetisi::class, 'id_kompetisi', 'id_kompetisi');
    }

    /**
     * Get all of the pesertaKompetisi for the KelasKejuaraan
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pesertaKompetisi(): HasMany
    {
        return $this->hasMany(PesertaKompetisi::class, 'id_kelas_kejuaraan', 'id_kelas_kejuaraan');
    }
}

