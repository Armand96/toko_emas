<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaPerhiasan extends Model
{
    protected $table = 'harga_perhiasan';

    protected $fillable = [
        'karat',
        'kadar',
        'lb_jual',
        'lb_beli',
        'berat',
        'urutan',
        'is_active',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'karat' => 'float',
        'kadar' => 'float',
        'lb_jual' => 'float',
        'lb_beli' => 'float',
        'berat' => 'float',
        'urutan' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['harga_jual', 'harga_beli'];

    // Dipakai satu request; mencegah query harga dasar berulang per baris.
    protected static ?HargaDasar $dasarCache = null;

    protected static function dasar(): HargaDasar
    {
        return static::$dasarCache ??= HargaDasar::current();
    }

    public static function flushDasarCache(): void
    {
        static::$dasarCache = null;
    }

    public function getHargaJualAttribute(): float
    {
        return round($this->lb_jual * static::dasar()->harga_dasar_jual * $this->berat);
    }

    public function getHargaBeliAttribute(): float
    {
        return round($this->lb_beli * static::dasar()->harga_dasar_beli * $this->berat);
    }
}
