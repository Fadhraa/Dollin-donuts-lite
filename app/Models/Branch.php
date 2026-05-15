<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['nama', 'alamat', 'is_active', 'latitude', 'longitude'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
