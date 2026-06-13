<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TSalesDetail extends Model
{
    protected $fillable = [
        'sales_id',
        'product_id',
        'price',
        'inventory_id',
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
        return $this->belongsTo(Inventory::class, 'inventory_id', 'inventory_id');
    }

    public function header()
    {
        return $this->belongsTo(MProduct::class, 'sales_id', 'id');
    }
}
