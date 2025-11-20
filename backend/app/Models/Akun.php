<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Akun extends Model
{
    use HasFactory;

    protected $table = 'tb_akun';
    protected $primaryKey = 'id_akun';
    public $timestamps = false;

    protected $fillable = [
        'email',
        'password_hash',
        'role',
    ];

    /**
     * Get the pelatih associated with the Akun
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function pelatih(): HasOne
    {
        return $this->hasOne(Pelatih::class, 'id_akun', 'id_akun');
    }
}
