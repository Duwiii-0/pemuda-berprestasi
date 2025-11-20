<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Penyelenggara extends Model
{
    use HasFactory;

    protected $table = 'tb_penyelenggara';
    protected $primaryKey = 'id_penyelenggara';

    protected $fillable = [
        'nama_penyelenggara',
        'email',
        'no_telp',
    ];

    /**
     * Get all of the kompetisi for the Penyelenggara
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function kompetisi(): HasMany
    {
        return $this->hasMany(Kompetisi::class, 'id_penyelenggara', 'id_penyelenggara');
    }
}

