<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'transfer_item_id',
    'product_id',
    'inventory_code'
])]
class TransferItemDetail extends Model
{
    public function header()
    {
        return $this->belongsTo(TransferItem::class, 'transfer_item_id', 'id');
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_code', 'inventory_code');
    }

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }
}
