<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Akun extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'tb_akun';
    protected $primaryKey = 'id_akun';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'password_hash',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password_hash',
    ];

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Get the pelatih associated with the Akun
     */
    public function pelatih(): HasOne
    {
        return $this->hasOne(Pelatih::class, 'id_akun', 'id_akun');
    }

    /**
     * Get the admin associated with the Akun
     */
    public function admin(): HasOne
    {
        return $this->hasOne(Admin::class, 'id_akun', 'id_akun');
    }

    /**
     * Get the admin kompetisi associated with the Akun
     */
    public function adminKompetisi(): HasOne
    {
        // Assuming AdminKompetisi model exists or will be created
        // If the model name is different, it should be adjusted.
        return $this->hasOne(AdminKompetisi::class, 'id_akun', 'id_akun');
    }
}
