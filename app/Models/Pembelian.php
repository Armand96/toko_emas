<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'batch',
    'inventory_code',
    'product_id',
    'created_by',
    'category_id',
    'subcategory_id',
    'supplier_id',
    'image_path',
    'thumb_path',
    'branch_id',
    'status',
    'bank__cabank_id',
    'barcode',
    'berat',
    'karat',
    'modal',
    'jual',
    'tipe_pembayaran',
    'serial_number',
    'note',
])]
class Pembelian extends Model
{
    //
    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

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

    public function subcategory()
    {
        return $this->belongsTo(MCategory::class, 'subcategory_id', 'id');
    }

    public function supplier()
    {
        return $this->belongsTo(MSupplier::class, 'supplier_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function bankCabang()
    {
        return $this->belongsTo(MBank::class, 'bank_cabang_id', 'id');
    }
}
