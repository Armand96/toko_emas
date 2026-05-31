<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'product_id',
        'category_id',
        'branch_id',
        'berat',
        'karat',
        'modal',
        'jual',
        'approval_id',
        'status_inventory'
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
}
