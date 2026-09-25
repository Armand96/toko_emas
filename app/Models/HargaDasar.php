<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaDasar extends Model
{
    protected $table = 'harga_dasar';

    protected $fillable = [
        'harga_dasar_jual',
        'harga_dasar_beli',
    ];

    protected $casts = [
        'harga_dasar_jual' => 'float',
        'harga_dasar_beli' => 'float',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1], [
            'harga_dasar_jual' => 0,
            'harga_dasar_beli' => 0,
        ]);
    }
}
