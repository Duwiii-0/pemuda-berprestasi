<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuktiTransfer extends Model
{
    use HasFactory;

    protected $table = 'tb_bukti_transfer';
    protected $primaryKey = 'id_bukti_transfer';

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null; // No updated_at column in the table

    protected $fillable = [
        'id_dojang',
        'id_pelatih',
        'bukti_transfer_path',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the dojang that the proof of transfer belongs to.
     */
    public function dojang(): BelongsTo
    {
        return $this->belongsTo(Dojang::class, 'id_dojang', 'id_dojang');
    }

    /**
     * Get the pelatih that uploaded the proof of transfer.
     */
    public function pelatih(): BelongsTo
    {
        return $this->belongsTo(Pelatih::class, 'id_pelatih', 'id_pelatih');
    }
}
