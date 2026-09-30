<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaLogamMulia extends Model
{
    protected $table = 'harga_logam_mulia';

    protected $fillable = [
        'berat',
        'urutan',
        'is_active',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'berat' => 'float',
        'urutan' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['harga_dasar', 'harga_jual', 'harga_buyback'];

    protected static ?HargaDasar $dasarCache = null;

    protected static function dasar(): HargaDasar
    {
        return static::$dasarCache ??= HargaDasar::current();
    }

    public static function flushDasarCache(): void
    {
        static::$dasarCache = null;
    }

    // Logam mulia punya harga dasar sendiri, tidak terkait harga perhiasan.
    // Harga jual kena markup persen_jual_lm (diatur di Setting Harga);
    // buyback murni dasar x berat.
    public function getHargaDasarAttribute(): float
    {
        return round(static::dasar()->harga_dasar_jual_lm * $this->berat);
    }

    public function getHargaJualAttribute(): float
    {
        return round($this->harga_dasar * (1 + static::dasar()->persen_jual_lm / 100));
    }

    public function getHargaBuybackAttribute(): float
    {
        return round(static::dasar()->harga_dasar_beli_lm * $this->berat);
    }
}
