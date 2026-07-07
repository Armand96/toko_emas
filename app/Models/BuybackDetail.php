<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuybackDetail extends Model
{
    protected $fillable = [
        'buyback_id',
        'product_id',
        'inventory_code',
        'berat',
        'karat',
        'serial_number',
        'price',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function header()
    {
        return $this->belongsTo(Buyback::class, 'buyback_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_code', 'inventory_code');
    }
}
