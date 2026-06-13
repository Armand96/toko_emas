<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'inventory_id',
        'product_id',
        'category_id',
        'subcategory_id',
        'branch_id',
        'barcode',
        'berat',
        'karat',
        'modal',
        'jual',
        'image_path',
        'thumb_path',
        'status',
        'note',
    ];

    protected $hidden = [
        // 'created_at',
        'updated_at'
    ];

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(Mbranch::class, 'branch_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(MCategory::class, 'category_id', 'id');
    }

    public function subCategory()
    {
        return $this->belongsTo(MCategory::class, 'subcategory_id', 'id');
    }
}
