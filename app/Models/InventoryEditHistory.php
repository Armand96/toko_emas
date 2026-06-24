<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'inventory_id',
    'pembelian_id',
    'product_id',
    'category_id',
    'subcategory_id',
    'branch_id',
    'inventory_code',
    'barcode',
    'berat',
    'karat',
    'modal',
    'jual',
    'image_path',
    'thumb_path',
    'status',
    'note',
    'updated_by'
])]
class InventoryEditHistory extends Model
{
    public function parent()
    {
        return $this->belongsTo(Inventory::class, 'inventory_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(MCategory::class, 'category_id', 'id');
    }

    public function subCategory()
    {
        return $this->belongsTo(MCategory::class, 'subcategory_id', 'id');
    }

    public function sales()
    {
        return $this->hasOne(TSalesDetail::class, 'inventory_code', 'inventory_code');
    }

    public function pembelian()
    {
        return $this->hasOne(Pembelian::class, 'inventory_code', 'inventory_code');
    }

    public function transfer()
    {
        return $this->hasOne(TransferItem::class, 'inventory_code', 'inventory_code');
    }

    public function remove()
    {
        return $this->hasOne(RemoveItem::class, 'inventory_code', 'inventory_code');
    }

    public function stockOpnameData()
    {
        return $this->hasMany(StockOpnameDetail::class, 'inventory_code', 'inventory_code');
    }

    public function updateByUser()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }
}
