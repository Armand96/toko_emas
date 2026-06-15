<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TSalesDetail extends Model
{
    protected $fillable = [
        'sales_id',
        'product_id',
        'price',
        'inventory_code',
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_code', 'inventory_code');
    }

    public function header()
    {
        return $this->belongsTo(TSales::class, 'sales_id', 'id');
    }
}
