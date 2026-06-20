<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'batch',
    'inventory_code',
    'product_id',
    'category_id',
    'subcategory_id',
    'supplier_id',
    'image_path',
    'thumb_path',
    'branch_id',
    'status',
    'bank_id',
    'barcode',
    'berat',
    'karat',
    'modal',
    'jual',
    'note',
])]
class Pembelian extends Model
{
    //

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_code', 'inventory_code');
    }

    public function category()
    {
        return $this->belongsTo(MCategory::class, 'category_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function bank()
    {
        return $this->belongsTo(MBank::class, 'bank_id', 'id');
    }
}
