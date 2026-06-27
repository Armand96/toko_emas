<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'stockopname_header_id',
    'inventory_code',
    'product_id',
    'opname_status',
    'last_status',
    'note',
    'scanned_at',
])]
class StockOpnameDetail extends Model
{
    //

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_code', 'inventory_code');
    }

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function header()
    {
        return $this->belongsTo(StockOpnameHeader::class, 'stockopname_header_id', 'id');
    }
}
