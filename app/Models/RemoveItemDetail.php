<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'inventory_code',
    'remove_header_id',
    'product_id',
])]
class RemoveItemDetail extends Model
{
    public function header()
    {
        return $this->belongsTo(RemoveItem::class, 'remove_header_id', 'id');
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
