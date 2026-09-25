<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaLogamMulia extends Model
{
    protected $table = 'harga_logam_mulia';

    protected $fillable = [
        'berat',
        'harga_jual',
        'harga_buyback',
        'urutan',
        'is_active',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'berat' => 'float',
        'harga_jual' => 'float',
        'harga_buyback' => 'float',
        'urutan' => 'integer',
        'is_active' => 'boolean',
    ];
}
